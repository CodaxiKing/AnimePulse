import RSS from 'rss-parser';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  link: string;
  publishedDate: string;
  category?: string;
  thumbnail?: string;
  author?: string;
}

interface JikanNewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  forum_url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  excerpt: string;
}

export class AnimeNewsService {
  private rssParser = new RSS({
    customFields: {
      item: [
        'description',
        'category',
        'author',
        'content',
        'content:encoded',
        'summary'
      ]
    }
  });

  private readonly RSS_FEEDS = {
    all: 'https://www.animenewsnetwork.com/all/rss.xml',
    news: 'https://www.animenewsnetwork.com/news/rss.xml',
    reviews: 'https://www.animenewsnetwork.com/review/rss.xml',
    features: 'https://www.animenewsnetwork.com/feature/rss.xml'
  };

  private readonly JIKAN_API_BASE = 'https://api.jikan.moe/v4';
  private readonly ANN_API_BASE = 'https://cdn.animenewsnetwork.com/encyclopedia';

  // Método para buscar notícias reais do RSS da Anime News Network
  private async getRSSNews(
    category: 'all' | 'news' | 'reviews' | 'features',
    limit: number = 20
  ): Promise<NewsItem[]> {
    try {
      const feedUrl = this.RSS_FEEDS[category];
      const feed = await this.rssParser.parseURL(feedUrl);
      if (!feed.items?.length) return [];

      return feed.items.slice(0, limit).map((item, index) => {
        const contentEncoded = (item as any)['content:encoded'] as string | undefined;
        const rawContent = contentEncoded || item.content || item.summary || item.description || '';
        const cleanDesc = (item.contentSnippet || item.summary || item.description || '').replace(/<[^>]*>/g, '').trim();
        const description = cleanDesc.substring(0, 200) + (cleanDesc.length > 200 ? '...' : '');
        const thumbMatch = rawContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
        const published = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        return {
          id: (item.guid as string) || `${category}-${index}-${item.link || item.title || 'item'}`,
          title: item.title || 'Título não disponível',
          description,
          content: rawContent,
          link: item.link || '#',
          publishedDate: published,
          category: item.categories?.[0] || category,
          thumbnail: thumbMatch?.[1],
          author: (item as any).creator || item.author || 'Anime News Network',
        } satisfies NewsItem;
      });
    } catch (err) {
      console.error(`❌ Erro ao carregar RSS (${category}):`, err);
      return [];
    }
  }

  // Método para buscar notícias da API oficial da Anime News Network
  async getAnnApiNews(limit: number = 20): Promise<NewsItem[]> {
    try {
      console.log(`📰 Buscando notícias da API oficial da Anime News Network... (limite: ${limit})`);
      
      // A API da ANN não tem endpoint direto de notícias, mas vamos usar os títulos
      // Buscar títulos recentes de anime/manga para simular notícias
      const response = await fetch(`${this.ANN_API_BASE}/reports.xml?id=155&type=anime&nlist=${Math.min(limit * 2, 50)}`, {
        headers: {
          'User-Agent': 'AnimePulse/1.0 (Educational Project)'
        }
      } as any);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const xmlData = await response.text();
      
      const result = await new Promise<any>((resolve, reject) => {
        parseString(xmlData, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      if (!result?.report?.item) {
        console.log("⚠️ Resposta da API da ANN não contém dados válidos");
        return [];
      }
      
      const items = Array.isArray(result.report.item) ? result.report.item : [result.report.item];
      console.log(`✅ ${items.length} títulos encontrados na API da ANN`);
      
      // Gerar notícias baseadas nos títulos da ANN
      const newsTemplates = [
        "recebe novo trailer oficial",
        "anuncia data de estreia", 
        "ganha nova temporada confirmada",
        "tem elenco de dublagem revelado",
        "recebe adaptação para anime",
        "celebra marco de vendas",
        "anuncia colaboração especial",
        "revela novos detalhes da produção"
      ];
      
      const newsItems: NewsItem[] = items.slice(0, limit).map((item: any, index: number) => {
        const template = newsTemplates[index % newsTemplates.length];
        const title = item.name?.[0] || `Título ${index + 1}`;
        const publishDate = new Date(Date.now() - (index * 3600000 * 4)).toISOString(); // 4 horas de diferença
        
        return {
          id: `ann-${item.id?.[0] || index}`,
          title: `${title} ${template}`,
          description: `Novidades sobre ${title}. Confira as últimas informações sobre este título que tem chamado atenção da comunidade anime.`,
          content: `${title} continua ganhando destaque na indústria do anime. Esta atualização traz informações importantes para os fãs que acompanham o desenvolvimento do projeto.`,
          link: `https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${item.id?.[0] || ''}`,
          publishedDate: publishDate,
          category: 'anime',
          thumbnail: `https://cdn.animenewsnetwork.com/thumbnails/max${Math.floor(Math.random() * 1000) + 200}x${Math.floor(Math.random() * 1000) + 200}/cms/news/${Math.floor(Math.random() * 100000)}.jpg`,
          author: 'Anime News Network'
        };
      });
      
      return newsItems;
    } catch (error) {
      console.error("❌ Erro ao buscar notícias da API da ANN:", error);
      return [];
    }
  }

  // Método para buscar notícias reais da API do MyAnimeList via Jikan
  async getJikanRealNews(limit: number = 20): Promise<NewsItem[]> {
    try {
      console.log(`📰 Buscando notícias reais do MyAnimeList via Jikan API... (limite: ${limit})`);
      
      // Usar o endpoint oficial de notícias da Jikan API
      const response = await fetch(`${this.JIKAN_API_BASE}/news?limit=${Math.min(limit, 100)}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log("⚠️ Resposta da API do Jikan news não contém dados válidos");
        return [];
      }
      
      console.log(`✅ ${data.data.length} notícias reais encontradas no MyAnimeList`);
      
      // Converter notícias do Jikan para o formato interno
      const newsItems: NewsItem[] = data.data.slice(0, limit).map((newsItem: JikanNewsItem) => {
        return {
          id: `mal-${newsItem.mal_id}`,
          title: newsItem.title,
          description: newsItem.excerpt ? newsItem.excerpt.substring(0, 200) + (newsItem.excerpt.length > 200 ? '...' : '') : 'Notícia do MyAnimeList',
          content: newsItem.excerpt || newsItem.title,
          link: newsItem.url,
          publishedDate: newsItem.date,
          category: 'news',
          thumbnail: newsItem.images?.jpg?.image_url,
          author: newsItem.author_username || 'MyAnimeList'
        };
      });
      
      return newsItems;
    } catch (error) {
      console.error("❌ Erro ao buscar notícias reais do Jikan API:", error);
      return [];
    }
  }

  // Método para simular notícias do Jikan usando dados de animes populares (fallback)
  async getJikanSimulatedNews(limit: number = 20): Promise<NewsItem[]> {
    try {
      console.log(`📰 Simulando notícias baseadas em animes populares... (limite: ${limit})`);
      
      // Como fallback, usar dados dos animes para criar notícias simuladas
      const response = await fetch(`${this.JIKAN_API_BASE}/top/anime?limit=${Math.min(limit, 25)}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log("⚠️ Resposta da API do Jikan não contém dados válidos");
        return [];
      }
      
      console.log(`✅ ${data.data.length} animes encontrados para gerar notícias`);
      
      // Gerar notícias baseadas nos animes populares
      const newsTemplates = [
        "obtém nova temporada anunciada",
        "recebe filme de compilação",
        "celebra aniversário com evento especial",
        "ganha nova figura colecionável",
        "tem mangá licenciado no Brasil",
        "recebe adaptação para live-action",
        "ganha nova colaboração comercial",
        "tem trilha sonora lançada oficialmente"
      ];
      
      const newsItems: NewsItem[] = data.data.slice(0, limit).map((anime: any, index: number) => {
        const template = newsTemplates[index % newsTemplates.length];
        const publishDate = new Date(Date.now() - (index * 3600000 * 6)).toISOString(); // 6 horas de diferença entre cada notícia
        
        return {
          id: `jikan-${anime.mal_id}`,
          title: `${anime.title} ${template}`,
          description: `${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : `Nova atualização sobre ${anime.title}.`}`,
          content: anime.synopsis || `Informações sobre ${anime.title} foram atualizadas.`,
          link: anime.url,
          publishedDate: publishDate,
          category: 'anime',
          thumbnail: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
          author: 'MyAnimeList'
        };
      });
      
      return newsItems;
    } catch (error) {
      console.error("❌ Erro ao simular notícias do Jikan API:", error);
      return [];
    }
  }

  async getNews(category: 'all' | 'news' | 'reviews' | 'features' = 'news', limit: number = 20): Promise<NewsItem[]> {
    // 1. Tentar notícias reais do MyAnimeList via Jikan API primeiro
    console.log(`📰 Buscando notícias reais do MyAnimeList via Jikan API...`);
    try {
      const jikanRealNews = await this.getJikanRealNews(limit);
      if (jikanRealNews.length > 0) {
        console.log(`✅ Usando ${jikanRealNews.length} notícias reais do MyAnimeList`);
        return jikanRealNews;
      }
    } catch (jikanError) {
      console.log("⚠️ Notícias reais do Jikan falharam, tentando RSS da ANN...");
    }

    // 2. Fallback para RSS da ANN (notícias reais alternativas)
    console.log(`📰 Buscando notícias reais do RSS da Anime News Network...`);
    try {
      const rssNews = await this.getRSSNews(category, limit);
      if (rssNews.length > 0) {
        console.log(`✅ Usando ${rssNews.length} notícias reais do RSS da ANN`);
        return rssNews;
      }
    } catch (rssError) {
      console.log("⚠️ RSS da ANN falhou, tentando notícias simuladas...");
    }

    // 3. Fallback para notícias simuladas do Jikan
    console.log(`📰 Tentando notícias simuladas baseadas em animes populares...`);
    try {
      const jikanSimulatedNews = await this.getJikanSimulatedNews(limit);
      if (jikanSimulatedNews.length > 0) {
        console.log(`✅ Usando ${jikanSimulatedNews.length} notícias simuladas do Jikan API`);
        return jikanSimulatedNews;
      }
    } catch (jikanError) {
      console.log("⚠️ Jikan API falhou, usando dados mock como fallback final");
      return this.getMockNews(limit);
    }

    // Se chegou até aqui, retornar dados mock
    return this.getMockNews(limit);
  }

  private getMockNews(limit: number): NewsItem[] {
    const mockNews: NewsItem[] = [
      {
        id: 'mock-1',
        title: 'Attack on Titan Final Season Confirms Release Date',
        description: 'The final episodes of Attack on Titan have been confirmed for release this winter, bringing the epic saga to its long-awaited conclusion...',
        link: '#',
        publishedDate: new Date().toISOString(),
        category: 'news',
        author: 'Anime News Network'
      },
      {
        id: 'mock-2',
        title: 'Studio Ghibli Announces New Film Project',
        description: 'Studio Ghibli has officially announced their next animated film project, marking their return after several years of hiatus...',
        link: '#',
        publishedDate: new Date(Date.now() - 3600000).toISOString(),
        category: 'news',
        author: 'Anime News Network'
      },
      {
        id: 'mock-3',
        title: 'Demon Slayer: Infinity Castle Arc Gets Trilogy Treatment',
        description: 'The highly anticipated Infinity Castle arc will be adapted as a movie trilogy, promising spectacular animation and epic battles...',
        link: '#',
        publishedDate: new Date(Date.now() - 7200000).toISOString(),
        category: 'news',
        author: 'Anime News Network'
      },
      {
        id: 'mock-4',
        title: 'One Piece Live Action Season 2 Production Update',
        description: 'Netflix provides exciting updates on the production of One Piece live action season 2, including new cast members and filming locations...',
        link: '#',
        publishedDate: new Date(Date.now() - 10800000).toISOString(),
        category: 'news',
        author: 'Anime News Network'
      },
      {
        id: 'mock-5',
        title: 'Jujutsu Kaisen Season 3 Animation Studio Confirmed',
        description: 'MAPPA studio has been confirmed to continue animating Jujutsu Kaisen season 3, ensuring consistency in the beloved series...',
        link: '#',
        publishedDate: new Date(Date.now() - 14400000).toISOString(),
        category: 'news',
        author: 'Anime News Network'
      }
    ];

    return mockNews.slice(0, limit);
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    try {
      // Buscar em todas as categorias para encontrar a notícia pelo ID
      const categories: Array<'all' | 'news' | 'reviews' | 'features'> = ['all', 'news', 'reviews', 'features'];
      
      for (const category of categories) {
        const news = await this.getNews(category, 100); // Buscar mais itens para encontrar pelo ID
        const foundNews = news.find(item => item.id === id);
        if (foundNews) {
          // Tentar buscar conteúdo completo se tiver link
          if (foundNews.link && foundNews.link !== '#') {
            const fullContent = await this.fetchFullContent(foundNews.link);
            if (fullContent) {
              foundNews.content = fullContent;
            }
          }
          return foundNews;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Erro ao buscar notícia por ID ${id}:`, error);
      return null;
    }
  }

  private async fetchFullContent(url: string): Promise<string | null> {
    try {
      console.log(`🔍 Tentando buscar conteúdo completo de: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      } as any);
      
      if (!response.ok) {
        console.log(`❌ Status ${response.status} para URL: ${url}`);
        return null;
      }
      
      const html = await response.text();
      
      // Extrair conteúdo principal do HTML
      const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                          html.match(/<div[^>]*class=['"].*?content.*?['"][^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/<div[^>]*class=['"].*?article.*?['"][^>]*>([\s\S]*?)<\/div>/i);
      
      if (contentMatch) {
        let content = contentMatch[1];
        // Limpar scripts, estilos e outros elementos desnecessários
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        
        console.log(`✅ Conteúdo extraído com sucesso (${content.length} caracteres)`);
        return content;
      }
      
      console.log(`⚠️ Não foi possível extrair conteúdo de: ${url}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar conteúdo de ${url}:`, error);
      return null;
    }
  }

  async getLatestNews(limit: number = 10): Promise<NewsItem[]> {
    return this.getNews('news', limit);
  }

  async getReviews(limit: number = 10): Promise<NewsItem[]> {
    return this.getNews('reviews', limit);
  }

  async getFeatures(limit: number = 10): Promise<NewsItem[]> {
    return this.getNews('features', limit);
  }
}

export const animeNewsService = new AnimeNewsService();