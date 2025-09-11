const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth');
const cheerio = require('cheerio');

// Add stealth plugin
chromium.use(stealth());

class AnimeScraper {
  constructor() {
    this.browser = null;
    this.sites = {
      animesdigital: {
        baseUrl: 'https://animesdigital.org',
        searchUrl: 'https://animesdigital.org/search',
        name: 'AnimesDigital.org'
      },
      animesonlinecc: {
        baseUrl: 'https://animesonlinecc.to',
        searchUrl: 'https://animesonlinecc.to/search',
        name: 'AnimesOnlineCC.to'
      },
      goyabu: {
        baseUrl: 'https://goyabu.to',
        searchUrl: 'https://goyabu.to/search',
        name: 'Goyabu.to'
      }
    };
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Initializing browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async createPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    return page;
  }

  async searchAnimes(query = '', targetSite = null) {
    const results = [];
    
    const sitesToScrape = targetSite && this.sites[targetSite] 
      ? [targetSite] 
      : Object.keys(this.sites);

    for (const siteId of sitesToScrape) {
      try {
        console.log(`🔍 Scraping ${this.sites[siteId].name}...`);
        const siteResults = await this.scrapeAnimesFromSite(siteId, query);
        results.push(...siteResults);
      } catch (error) {
        console.error(`❌ Error scraping ${this.sites[siteId].name}:`, error.message);
      }
    }

    return results;
  }

  async scrapeAnimesFromSite(siteId, query = '') {
    const page = await this.createPage();
    const site = this.sites[siteId];
    
    try {
      let url = site.baseUrl;
      
      if (query) {
        url = `${site.searchUrl}?q=${encodeURIComponent(query)}`;
      }

      console.log(`🌐 Visiting: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const animes = await page.evaluate((siteId) => {
        // Generic selectors that work across different anime sites
        const animeSelectors = [
          '.anime-item', '.card', '.item', '.content-item',
          '.anime', '.movie', '.series', '.post',
          '[class*="anime"]', '[class*="card"]', '[class*="item"]'
        ];
        
        let elements = [];
        for (const selector of animeSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements = found;
            break;
          }
        }

        return Array.from(elements).slice(0, 20).map((element, index) => {
          // Try multiple selectors for title
          const titleSelectors = ['.title', '.name', 'h3', 'h2', '.card-title', '.anime-title', 'a[title]'];
          let titleElement = null;
          let title = '';
          
          for (const selector of titleSelectors) {
            titleElement = element.querySelector(selector);
            if (titleElement) {
              title = titleElement.textContent?.trim() || titleElement.getAttribute('title') || '';
              if (title) break;
            }
          }

          // Try multiple selectors for link
          const linkElement = element.querySelector('a') || element.closest('a');
          let url = '';
          if (linkElement) {
            url = linkElement.href || linkElement.getAttribute('href') || '';
            if (url && !url.startsWith('http')) {
              url = new URL(url, window.location.origin).href;
            }
          }

          // Try multiple selectors for image
          const imageSelectors = ['img', '.poster img', '.thumbnail img', '.cover img'];
          let imageElement = null;
          let thumbnail = '';
          
          for (const selector of imageSelectors) {
            imageElement = element.querySelector(selector);
            if (imageElement) {
              thumbnail = imageElement.src || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-original') || '';
              if (thumbnail) break;
            }
          }

          // Try to get episode count
          const episodeSelectors = ['.episodes', '.ep-count', '[class*="episode"]', '[class*="ep"]'];
          let episodeText = '';
          for (const selector of episodeSelectors) {
            const episodeElement = element.querySelector(selector);
            if (episodeElement) {
              episodeText = episodeElement.textContent || '';
              break;
            }
          }
          
          const episodeMatch = episodeText.match(/(\d+)/);
          const totalEpisodes = episodeMatch ? parseInt(episodeMatch[1]) : null;

          // Try to get genres
          const genreSelectors = ['.genre', '.tag', '.category', '[class*="genre"]', '[class*="tag"]'];
          const genres = [];
          for (const selector of genreSelectors) {
            const genreElements = element.querySelectorAll(selector);
            genreElements.forEach(el => {
              const genreText = el.textContent?.trim();
              if (genreText && !genres.includes(genreText)) {
                genres.push(genreText);
              }
            });
          }

          return {
            id: `${siteId}-${index + 1}`,
            siteId,
            title: title || 'Título não encontrado',
            url,
            thumbnail,
            totalEpisodes,
            genres: genres.slice(0, 5), // Limit to 5 genres
            status: 'available',
            year: new Date().getFullYear()
          };
        }).filter(anime => 
          anime.title !== 'Título não encontrado' && 
          anime.url && 
          anime.title.length > 1
        );
      }, siteId);

      console.log(`✅ ${site.name}: Found ${animes.length} animes`);
      return animes;

    } catch (error) {
      console.error(`❌ Error scraping ${site.name}:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  async getEpisodes(siteId, animeId, animeUrl) {
    const page = await this.createPage();
    
    try {
      console.log(`🎬 Getting episodes from: ${animeUrl}`);
      await page.goto(animeUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const episodes = await page.evaluate((animeId, siteId) => {
        // Generic selectors for episodes
        const episodeSelectors = [
          '.episode', '.ep', '.episode-item', '.chapter',
          '[class*="episode"]', '[class*="ep"]', '.video-item'
        ];
        
        let elements = [];
        for (const selector of episodeSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements = found;
            break;
          }
        }

        return Array.from(elements).map((element, index) => {
          // Try multiple selectors for episode title
          const titleSelectors = ['.title', '.name', 'h3', 'h4', '.episode-title', 'a'];
          let title = '';
          
          for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector);
            if (titleElement) {
              title = titleElement.textContent?.trim() || titleElement.getAttribute('title') || '';
              if (title) break;
            }
          }

          // Try multiple selectors for episode link
          const linkElement = element.querySelector('a') || element.closest('a');
          let url = '';
          if (linkElement) {
            url = linkElement.href || linkElement.getAttribute('href') || '';
            if (url && !url.startsWith('http')) {
              url = new URL(url, window.location.origin).href;
            }
          }

          // Try to extract episode number
          const numberMatch = title.match(/(?:ep|episódio|episode)?\s*(\d+)/i) || 
                             element.textContent?.match(/(\d+)/) || 
                             [null, index + 1];
          const episodeNumber = parseInt(numberMatch[1]) || index + 1;

          // Try to get thumbnail
          const imageElement = element.querySelector('img');
          let thumbnail = '';
          if (imageElement) {
            thumbnail = imageElement.src || imageElement.getAttribute('data-src') || '';
          }

          return {
            id: `${siteId}-${animeId}-ep-${episodeNumber}`,
            animeId,
            siteId,
            number: episodeNumber,
            title: title || `Episódio ${episodeNumber}`,
            url,
            thumbnail,
            duration: '24 min',
            releaseDate: new Date().toISOString()
          };
        }).filter(episode => episode.url);
      }, animeId, siteId);

      console.log(`✅ Found ${episodes.length} episodes`);
      return episodes.sort((a, b) => a.number - b.number);

    } catch (error) {
      console.error('❌ Error getting episodes:', error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  async getStreamingUrl(siteId, episodeId, episodeUrl) {
    const page = await this.createPage();
    
    try {
      console.log(`🎥 Getting streaming URL from: ${episodeUrl}`);
      await page.goto(episodeUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);

      const streamingData = await page.evaluate(() => {
        // Common video selectors
        const videoSelectors = [
          'video', 'iframe[src*="player"]', 'iframe[src*="embed"]',
          '.video-player', '#video-player', '.player',
          'iframe[src*="youtube"]', 'iframe[src*="dailymotion"]'
        ];
        
        let videoElement = null;
        let streamingUrl = '';
        
        for (const selector of videoSelectors) {
          videoElement = document.querySelector(selector);
          if (videoElement) {
            if (videoElement.tagName === 'VIDEO') {
              streamingUrl = videoElement.src || videoElement.currentSrc || '';
            } else if (videoElement.tagName === 'IFRAME') {
              streamingUrl = videoElement.src || '';
            }
            if (streamingUrl) break;
          }
        }

        // Look for video sources in script tags
        if (!streamingUrl) {
          const scripts = document.querySelectorAll('script');
          for (const script of scripts) {
            const content = script.textContent || '';
            
            // Look for common video URL patterns
            const urlPatterns = [
              /["']https?:\/\/[^"']*\.mp4[^"']*/i,
              /["']https?:\/\/[^"']*\.m3u8[^"']*/i,
              /["']https?:\/\/[^"']*\/embed\/[^"']*/i,
              /source["\s]*:["\s]*["']([^"']+)["']/i
            ];
            
            for (const pattern of urlPatterns) {
              const match = content.match(pattern);
              if (match) {
                streamingUrl = match[0].replace(/['"]/g, '') || match[1];
                if (streamingUrl) break;
              }
            }
            if (streamingUrl) break;
          }
        }

        return {
          streamingUrl: streamingUrl || '',
          referer: window.location.href,
          userAgent: navigator.userAgent,
          headers: {
            'Referer': window.location.href,
            'User-Agent': navigator.userAgent,
            'Origin': window.location.origin
          }
        };
      });

      if (!streamingData.streamingUrl) {
        // Fallback: return the episode URL for external viewing
        return {
          streamingUrl: episodeUrl,
          referer: episodeUrl,
          external: true,
          headers: {
            'Referer': episodeUrl,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        };
      }

      console.log(`✅ Found streaming URL for episode: ${episodeId}`);
      return streamingData;

    } catch (error) {
      console.error('❌ Error getting streaming URL:', error.message);
      return {
        streamingUrl: episodeUrl,
        referer: episodeUrl,
        external: true,
        error: error.message
      };
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      console.log('🔒 Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = AnimeScraper;