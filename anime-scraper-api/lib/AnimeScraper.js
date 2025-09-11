const { chromium } = require('playwright');
const cheerio = require('cheerio');

// Remove stealth plugin for now - causing compatibility issues

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

          // Improved episode count detection - only accept numbers clearly associated with episodes
          const episodeSelectors = [
            '.episodes', '.ep-count', '.episode-count', '.total-episodes',
            '[class*="episode"]', '[class*="ep"]', '.info .episodes',
            '.details .episodes', '.meta .episodes'
          ];
          let episodeText = '';
          let totalEpisodes = null;
          
          for (const selector of episodeSelectors) {
            const episodeElements = element.querySelectorAll(selector);
            for (const episodeElement of episodeElements) {
              const text = episodeElement.textContent?.trim() || '';
              
              // Only accept numbers that are clearly episode-related
              // Must have episode keywords within 20 characters of the number
              const episodePatterns = [
                // Patterns with explicit episode keywords
                /(?:episod|ep)(?:io|e)?s?\s*[:\.\-]?\s*(\d{1,3})(?:\s|$)/i,
                /(\d{1,3})\s*(?:episod|ep)(?:io|e)?s?(?:\s|$)/i,
                // Range patterns like "Ep 1-12" or "Episodes 1-24"
                /(?:episod|ep)(?:io|e)?s?\s*\d+\s*[-–—]\s*(\d{1,3})/i,
                // Fraction patterns like "5/12 episodes"
                /(\d{1,3})\s*\/\s*(\d{1,3})\s*(?:episod|ep)(?:io|e)?s?/i,
                // Total episodes patterns like "Total: 12"
                /total\s*[:\.\-]?\s*(\d{1,3})(?:\s*episod|ep)?/i
              ];
              
              for (const pattern of episodePatterns) {
                const match = text.match(pattern);
                if (match) {
                  let episodeCount = parseInt(match[1]);
                  
                  // For fraction patterns, take the larger number (total)
                  if (match[2]) {
                    const num2 = parseInt(match[2]);
                    episodeCount = Math.max(episodeCount, num2);
                  }
                  
                  // Validate episode count is reasonable (1-500 episodes)
                  if (episodeCount >= 1 && episodeCount <= 500) {
                    totalEpisodes = episodeCount;
                    episodeText = text;
                    break;
                  }
                }
              }
              if (totalEpisodes) break;
            }
            if (totalEpisodes) break;
          }
          
          // More restrictive fallback - only if we find explicit episode keywords
          if (!totalEpisodes) {
            const fullText = element.textContent || '';
            const restrictiveMatch = fullText.match(/(?:episod|ep)(?:io|e)?s?\s*[:\.\-]?\s*(\d{1,3})(?:\s|$|\s*eps?)/i);
            if (restrictiveMatch) {
              const episodeCount = parseInt(restrictiveMatch[1]);
              if (episodeCount >= 1 && episodeCount <= 500) {
                totalEpisodes = episodeCount;
              }
            }
          }

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
        // More specific selectors for episodes - prioritize episode-specific containers
        const episodeSelectors = [
          // Primary episode-specific selectors
          '.episode', '.ep', '.episode-item', '.episode-card', '.episode-list-item',
          '.video-episode', '.anime-episode', '.chapter-item',
          '[class*="episode"]:not([class*="count"]):not([class*="total"])',
          '[class*="ep-"]:not([class*="count"])', 
          // Secondary video-related selectors
          '.video-item', '.video-card', '.watch-item',
          // Generic selectors with episode validation
          '.item', '.card', '.list-item'
        ];
        
        let elements = [];
        let bestSelector = '';
        let bestScore = 0;
        
        // Find the best selector based on episode-specific content, not just quantity
        for (const selector of episodeSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length === 0) continue;
          
          // Score based on episode-specific content
          let episodeScore = 0;
          let episodeCount = 0;
          
          for (let i = 0; i < Math.min(found.length, 10); i++) {
            const elem = found[i];
            const text = elem.textContent?.toLowerCase() || '';
            const hasLink = elem.querySelector('a') || elem.closest('a');
            
            // Score factors
            let itemScore = 0;
            
            // Has episode-related keywords
            if (/(?:episod|ep|chapter|cap)/.test(text)) itemScore += 3;
            
            // Has episode numbers
            if (/(?:episod|ep)\s*\d+|\d+\s*(?:episod|ep)/.test(text)) itemScore += 5;
            
            // Has clickable link
            if (hasLink) itemScore += 2;
            
            // Has reasonable text length (not too short/long)
            if (text.length > 5 && text.length < 200) itemScore += 1;
            
            // Penalty for non-episode content
            if (/(?:comentario|comment|news|noticia|rating|avalia)/.test(text)) itemScore -= 3;
            
            if (itemScore > 0) {
              episodeScore += itemScore;
              episodeCount++;
            }
          }
          
          // Calculate final score (average score per element * element count)
          const finalScore = episodeCount > 0 ? (episodeScore / episodeCount) * Math.min(episodeCount, 50) : 0;
          
          if (finalScore > bestScore && episodeCount >= 1) {
            bestScore = finalScore;
            elements = found;
            bestSelector = selector;
          }
        }

        console.log(`Found ${elements.length} episodes using selector: ${bestSelector}`);

        const episodeData = Array.from(elements).map((element, index) => {
          // Try multiple selectors for episode title
          const titleSelectors = [
            '.title', '.name', 'h3', 'h4', 'h2', '.episode-title', 
            '.video-title', 'a[title]', 'span[title]', '.text', '.label'
          ];
          let title = '';
          
          for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector);
            if (titleElement) {
              title = titleElement.textContent?.trim() || titleElement.getAttribute('title') || '';
              if (title && title.length > 1) break;
            }
          }
          
          // Fallback to element text or parent text
          if (!title) {
            title = element.textContent?.trim() || '';
            if (!title && element.parentElement) {
              title = element.parentElement.textContent?.trim() || '';
            }
          }

          // Enhanced episode link detection and validation
          const linkElement = element.querySelector('a') || element.closest('a') || 
                             element.parentElement?.querySelector('a');
          let url = '';
          
          if (linkElement) {
            url = linkElement.href || linkElement.getAttribute('href') || '';
            
            if (url) {
              // Convert relative URLs to absolute
              if (!url.startsWith('http')) {
                try {
                  url = new URL(url, window.location.origin).href;
                } catch (e) {
                  url = '';
                }
              }
              
              // Validate that URL looks like an episode link
              const episodeUrlPatterns = [
                /\/(?:episode|ep|assistir|watch|ver)\//i,
                /\/.*\d+.*\//,
                /[?&](?:ep|episode)=\d+/i,
                /\/\d+\//
              ];
              
              const isValidEpisodeUrl = episodeUrlPatterns.some(pattern => pattern.test(url)) &&
                                      !url.includes('#') && // Avoid anchor links
                                      !url.includes('javascript:') && // Avoid JS links
                                      url.length > 10; // Reasonable URL length
              
              if (!isValidEpisodeUrl) {
                url = '';
              }
            }
          }

          // Enhanced episode number extraction
          let episodeNumber = index + 1; // Default fallback
          
          // Improved episode number extraction with proper validation
          const textSources = [
            element.getAttribute('data-episode') || '',
            element.getAttribute('data-ep') || '',
            title,
            element.textContent || ''
          ];
          
          let foundValidNumber = false;
          
          for (const text of textSources) {
            if (!text || foundValidNumber) continue;
            
            // Prioritized patterns for episode numbers (removed global flag)
            const patterns = [
              // Direct episode patterns
              /(?:ep|episod|episode)(?:io|e)?\s*[:\-\.#]?\s*(\d{1,4})/i,
              // Number followed by episode keywords
              /(\d{1,4})\s*(?:ep|episod|episode)(?:io|e)?/i,
              // Chapter patterns
              /(?:cap|capitulo|chapter)\s*[:\-\.#]?\s*(\d{1,4})/i,
              // Simple number patterns (only if no other numbers found)
              /^\s*(\d{1,4})\s*$/,
              /\s(\d{1,4})\s/
            ];
            
            for (let i = 0; i < patterns.length; i++) {
              const pattern = patterns[i];
              const match = text.match(pattern);
              
              if (match) {
                const num = parseInt(match[1]);
                
                // Validate episode number ranges
                if (num >= 1 && num <= 9999) {
                  // For the first two patterns (explicit episode keywords), accept immediately
                  if (i < 2) {
                    episodeNumber = num;
                    foundValidNumber = true;
                    break;
                  }
                  // For other patterns, only accept if reasonable range
                  else if (num >= 1 && num <= 500) {
                    episodeNumber = num;
                    foundValidNumber = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Final validation - ensure episode number is reasonable
          if (episodeNumber < 1 || episodeNumber > 9999) {
            episodeNumber = index + 1;
          }

          // Try to get thumbnail
          const imageSelectors = ['img', '.thumb img', '.poster img', '.cover img'];
          let thumbnail = '';
          
          for (const selector of imageSelectors) {
            const imageElement = element.querySelector(selector);
            if (imageElement) {
              thumbnail = imageElement.src || 
                         imageElement.getAttribute('data-src') || 
                         imageElement.getAttribute('data-original') || '';
              if (thumbnail) break;
            }
          }

          // Clean up title
          if (title) {
            // Remove episode number from title if it's redundant
            title = title.replace(/^(?:ep|episódio|episode|cap)\s*:?\s*\d+\s*[-:.]?\s*/i, '').trim();
            if (!title || title.length < 2) {
              title = `Episódio ${episodeNumber}`;
            }
          } else {
            title = `Episódio ${episodeNumber}`;
          }

          return {
            id: `${siteId}-${animeId}-ep-${episodeNumber}`,
            animeId,
            siteId,
            number: episodeNumber,
            title,
            url,
            thumbnail,
            duration: '24 min',
            releaseDate: new Date().toISOString(),
            _debugInfo: {
              originalTitle: element.textContent?.trim()?.slice(0, 50),
              selector: bestSelector,
              index
            }
          };
        }).filter(episode => {
          // Enhanced episode validation
          const hasValidUrl = episode.url && 
                             episode.url.length > 15 && 
                             episode.url.startsWith('http') &&
                             !episode.url.includes('undefined') &&
                             !episode.url.includes('null');
          
          const hasValidNumber = episode.number >= 1 && episode.number <= 9999;
          
          const hasValidTitle = episode.title && 
                               episode.title.length > 1 && 
                               episode.title !== 'undefined' &&
                               !episode.title.includes('null');
          
          return hasValidUrl && hasValidNumber && hasValidTitle;
        });

        // Enhanced sorting and deduplication
        const urlSet = new Set();
        const numberSet = new Set();
        const uniqueEpisodes = [];
        
        // First sort by episode number
        episodeData.sort((a, b) => {
          const numDiff = a.number - b.number;
          if (numDiff !== 0) return numDiff;
          // If same number, prefer shorter URL (usually more direct)
          return a.url.length - b.url.length;
        });
        
        // Remove duplicates prioritizing unique URLs and episode numbers
        episodeData.forEach(episode => {
          const normalizedUrl = episode.url.toLowerCase().replace(/[?&#].*$/, '');
          const urlKey = `${normalizedUrl}-${episode.number}`;
          
          if (!urlSet.has(urlKey) && !numberSet.has(episode.number)) {
            urlSet.add(urlKey);
            numberSet.add(episode.number);
            uniqueEpisodes.push(episode);
          }
        });
        
        // Final sort to ensure proper order
        uniqueEpisodes.sort((a, b) => a.number - b.number);
        
        // Validate episode sequence (remove outliers)
        if (uniqueEpisodes.length > 1) {
          const numbers = uniqueEpisodes.map(ep => ep.number);
          const maxGap = Math.max(...numbers) - Math.min(...numbers);
          
          // If there's a huge gap, filter out outliers
          if (maxGap > uniqueEpisodes.length * 5) {
            const median = numbers.sort((a, b) => a - b)[Math.floor(numbers.length / 2)];
            return uniqueEpisodes.filter(ep => Math.abs(ep.number - median) <= 100);
          }
        }

        return uniqueEpisodes;
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