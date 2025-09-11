import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';

interface ScrapedAnime {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  totalEpisodes?: number;
  status?: string;
  genres?: string[];
  synopsis?: string;
  year?: number;
}

interface ScrapedEpisode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  url: string;
  streamingUrl?: string;
  thumbnail?: string;
  releaseDate?: string;
  duration?: string;
}

export class WebScrapingService {
  private browser: Browser | null = null;
  
  // Sites suportados para scraping
  private readonly SUPPORTED_SITES = {
    ANIMES_DIGITAL: 'https://animesdigital.org',
    ANIMES_ONLINE: 'https://animesonlinecc.to', 
    GOYABU: 'https://goyabu.to'
  };

  // Headers para simular navegador real
  private readonly DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      console.log('🚀 Iniciando browser Playwright...');
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
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    await this.initBrowser();
    const page = await this.browser!.newPage();
    
    // Configurar headers e comportamento
    await page.setExtraHTTPHeaders(this.DEFAULT_HEADERS);
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Bloquear imagens e fontes para acelerar o carregamento
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (resourceType === 'image' || resourceType === 'font') {
        route.abort();
      } else {
        route.continue();
      }
    });

    return page;
  }

  // Scraping do AnimesDigital.org
  async scrapeAnimesDigital(animeTitle?: string): Promise<ScrapedAnime[]> {
    const page = await this.createPage();
    console.log('🔍 Fazendo scraping no AnimesDigital.org...');

    try {
      let url = this.SUPPORTED_SITES.ANIMES_DIGITAL;
      
      // Se há um título específico, fazer busca
      if (animeTitle) {
        url = `${this.SUPPORTED_SITES.ANIMES_DIGITAL}/search?q=${encodeURIComponent(animeTitle)}`;
      }

      await page.goto(url, { waitUntil: 'networkidle' });

      // Aguardar elementos carregarem
      await page.waitForTimeout(2000);

      const animes = await page.evaluate(() => {
        const animeElements = document.querySelectorAll('.anime-item, .movie-item, .post-item, .grid-item');
        
        return Array.from(animeElements).map((element, index) => {
          const titleElement = element.querySelector('h3, h2, .title, .post-title, a[title]');
          const linkElement = element.querySelector('a');
          const imageElement = element.querySelector('img');
          const episodeElement = element.querySelector('.episode-count, .episodes, .ep-count');
          
          return {
            id: `animesdigital-${index + 1}`,
            title: titleElement?.textContent?.trim() || titleElement?.getAttribute('title') || 'Título não encontrado',
            url: linkElement?.href || '',
            thumbnail: (imageElement as HTMLImageElement)?.src || imageElement?.getAttribute('data-src') || '',
            totalEpisodes: episodeElement ? parseInt(episodeElement.textContent || '0') : undefined,
            status: 'available',
            year: new Date().getFullYear()
          };
        }).filter(anime => anime.title !== 'Título não encontrado' && anime.url);
      });

      console.log(`✅ AnimesDigital: Encontrados ${animes.length} animes`);
      return animes;

    } catch (error) {
      console.error('❌ Erro no scraping AnimesDigital:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  // Scraping do AnimesOnlineCC.to
  async scrapeAnimesOnline(animeTitle?: string): Promise<ScrapedAnime[]> {
    const page = await this.createPage();
    console.log('🔍 Fazendo scraping no AnimesOnlineCC.to...');

    try {
      let url = this.SUPPORTED_SITES.ANIMES_ONLINE;
      
      if (animeTitle) {
        url = `${this.SUPPORTED_SITES.ANIMES_ONLINE}/search?q=${encodeURIComponent(animeTitle)}`;
      }

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const animes = await page.evaluate(() => {
        const animeElements = document.querySelectorAll('.anime-card, .video-item, .post, .item');
        
        return Array.from(animeElements).map((element, index) => {
          const titleElement = element.querySelector('.title, h3, h2, .anime-title, a[title]');
          const linkElement = element.querySelector('a');
          const imageElement = element.querySelector('img');
          const genreElements = element.querySelectorAll('.genre, .category, .tag');
          
          return {
            id: `animesonline-${index + 1}`,
            title: titleElement?.textContent?.trim() || titleElement?.getAttribute('title') || 'Título não encontrado',
            url: linkElement?.href || '',
            thumbnail: (imageElement as HTMLImageElement)?.src || imageElement?.getAttribute('data-src') || '',
            genres: Array.from(genreElements).map(g => g.textContent?.trim()).filter(Boolean) as string[],
            status: 'available',
            year: new Date().getFullYear()
          };
        }).filter(anime => anime.title !== 'Título não encontrado' && anime.url);
      });

      console.log(`✅ AnimesOnlineCC: Encontrados ${animes.length} animes`);
      return animes;

    } catch (error) {
      console.error('❌ Erro no scraping AnimesOnlineCC:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  // Scraping do Goyabu.to
  async scrapeGoyabu(animeTitle?: string): Promise<ScrapedAnime[]> {
    const page = await this.createPage();
    console.log('🔍 Fazendo scraping no Goyabu.to...');

    try {
      let url = this.SUPPORTED_SITES.GOYABU;
      
      if (animeTitle) {
        url = `${this.SUPPORTED_SITES.GOYABU}/search?query=${encodeURIComponent(animeTitle)}`;
      }

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const animes = await page.evaluate(() => {
        const animeElements = document.querySelectorAll('.anime, .card, .item, .content-item');
        
        return Array.from(animeElements).map((element, index) => {
          const titleElement = element.querySelector('.name, .title, h3, h2, .card-title');
          const linkElement = element.querySelector('a');
          const imageElement = element.querySelector('img, .poster img');
          const synopsisElement = element.querySelector('.synopsis, .description, .plot');
          const genreElements = element.querySelectorAll('.genre, .tag');
          
          return {
            id: `goyabu-${index + 1}`,
            title: titleElement?.textContent?.trim() || 'Título não encontrado',
            url: linkElement?.href || '',
            thumbnail: (imageElement as HTMLImageElement)?.src || imageElement?.getAttribute('data-src') || '',
            synopsis: synopsisElement?.textContent?.trim(),
            genres: Array.from(genreElements).map(g => g.textContent?.trim()).filter(Boolean) as string[],
            status: 'available',
            year: new Date().getFullYear()
          };
        }).filter(anime => anime.title !== 'Título não encontrado' && anime.url);
      });

      console.log(`✅ Goyabu: Encontrados ${animes.length} animes`);
      return animes;

    } catch (error) {
      console.error('❌ Erro no scraping Goyabu:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  // Buscar episódios de um anime específico
  async scrapeEpisodes(animeUrl: string, animeId: string): Promise<ScrapedEpisode[]> {
    const page = await this.createPage();
    console.log(`🎬 Buscando episódios em: ${animeUrl}`);

    try {
      await page.goto(animeUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const episodes = await page.evaluate((animeId) => {
        const episodeElements = document.querySelectorAll('.episode, .ep, .episode-item, .video-item');
        
        return Array.from(episodeElements).map((element, index) => {
          const titleElement = element.querySelector('.ep-title, .title, .episode-title');
          const linkElement = element.querySelector('a');
          const numberElement = element.querySelector('.ep-number, .number, .episode-number');
          const imageElement = element.querySelector('img');
          
          return {
            id: `${animeId}-episode-${index + 1}`,
            animeId: animeId,
            number: numberElement ? parseInt(numberElement.textContent || '') || (index + 1) : (index + 1),
            title: titleElement?.textContent?.trim() || `Episódio ${index + 1}`,
            url: linkElement?.href || '',
            thumbnail: (imageElement as HTMLImageElement)?.src || imageElement?.getAttribute('data-src') || '',
            releaseDate: new Date().toISOString().split('T')[0],
            duration: '24 min'
          };
        }).filter(episode => episode.url);
      }, animeId);

      console.log(`✅ Encontrados ${episodes.length} episódios para ${animeId}`);
      return episodes;

    } catch (error) {
      console.error('❌ Erro ao buscar episódios:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  // Método principal para buscar animes de todos os sites
  async searchAllSites(query?: string): Promise<ScrapedAnime[]> {
    console.log(`🔍 Iniciando busca em todos os sites${query ? ` para: "${query}"` : ''}`);
    
    const results = await Promise.allSettled([
      this.scrapeAnimesDigital(query),
      this.scrapeAnimesOnline(query),
      this.scrapeGoyabu(query)
    ]);

    let allAnimes: ScrapedAnime[] = [];

    results.forEach((result, index) => {
      const siteName = Object.keys(this.SUPPORTED_SITES)[index];
      if (result.status === 'fulfilled') {
        allAnimes = allAnimes.concat(result.value);
        console.log(`✅ ${siteName}: ${result.value.length} animes`);
      } else {
        console.error(`❌ ${siteName}: ${result.reason}`);
      }
    });

    console.log(`🎯 Total de animes encontrados: ${allAnimes.length}`);
    
    // Remover duplicatas baseado no título
    const uniqueAnimes = allAnimes.filter((anime, index, self) => 
      index === self.findIndex(a => a.title.toLowerCase() === anime.title.toLowerCase())
    );

    console.log(`🎯 Animes únicos após remoção de duplicatas: ${uniqueAnimes.length}`);
    return uniqueAnimes;
  }

  // Método para obter URL de streaming de um episódio
  async getStreamingUrl(episodeUrl: string): Promise<string | null> {
    const page = await this.createPage();
    
    try {
      await page.goto(episodeUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Tentar encontrar diferentes tipos de players de vídeo
      const streamingUrl = await page.evaluate(() => {
        // Buscar por diferentes seletores de vídeo
        const videoElement = document.querySelector('video source, video, iframe[src*="player"], iframe[src*="embed"]');
        
        if (videoElement) {
          if (videoElement.tagName === 'IFRAME') {
            return (videoElement as HTMLIFrameElement).src;
          } else if (videoElement.tagName === 'SOURCE') {
            return (videoElement as HTMLSourceElement).src || '';
          } else if (videoElement.tagName === 'VIDEO') {
            return (videoElement as HTMLVideoElement).src;
          }
        }

        // Buscar por links de download ou streaming direto
        const linkElement = document.querySelector('a[href*=".mp4"], a[href*=".m3u8"], a[href*="stream"]');
        if (linkElement) {
          return (linkElement as HTMLAnchorElement).href;
        }

        return null;
      });

      return streamingUrl;
    } catch (error) {
      console.error('❌ Erro ao obter URL de streaming:', error);
      return null;
    } finally {
      await page.close();
    }
  }
}

export const webScrapingService = new WebScrapingService();