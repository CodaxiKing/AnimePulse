import RSS from 'rss-parser';

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

  async getNews(category: 'all' | 'news' | 'reviews' | 'features' = 'news', limit: number = 20): Promise<NewsItem[]> {
    try {
      const feedUrl = this.RSS_FEEDS[category];
      
      console.log(`📰 Buscando notícias da categoria: ${category} - URL: ${feedUrl}`);
      
      const feed = await this.rssParser.parseURL(feedUrl);
      
      console.log(`✅ RSS feed carregado: ${feed.title} - ${feed.items?.length || 0} items`);
      
      if (!feed.items) {
        return [];
      }

      const newsItems: NewsItem[] = feed.items.slice(0, limit).map((item, index) => {
        // Extrair thumbnail se disponível no content
        const thumbnailMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : undefined;

        // Extrair conteúdo completo e descrição com debug
        const fullContent = (item as any)['content:encoded'] || item.content || item.description || item.summary || '';
        const cleanDescription = item.contentSnippet || item.description || '';
        const description = cleanDescription.replace(/<[^>]*>/g, '').trim();
        
        // Debug: log dos dados disponíveis
        if (index < 2) { // Log apenas os primeiros 2 itens para não poluir
          console.log(`🔍 Debug notícia ${index + 1}:`);
          console.log('- Title:', item.title);
          console.log('- Content keys:', Object.keys(item));
          console.log('- Content:', item.content ? 'Presente' : 'Ausente');
          console.log('- Content:encoded:', (item as any)['content:encoded'] ? 'Presente' : 'Ausente');
          console.log('- Description length:', (item.description || '').length);
          console.log('- Full content length:', fullContent.length);
        }

        return {
          id: item.guid || `${category}-${index}`,
          title: item.title || 'Título não disponível',
          description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
          content: fullContent.length > description.length ? fullContent : description, // Usar o maior conteúdo disponível
          link: item.link || '#',
          publishedDate: item.pubDate || new Date().toISOString(),
          category: item.categories?.[0] || category,
          thumbnail,
          author: item.creator || item.author || 'Anime News Network'
        };
      });

      console.log(`✅ ${newsItems.length} notícias processadas da categoria ${category}`);
      return newsItems;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar notícias da categoria ${category}:`, error);
      
      // Retornar dados mock em caso de erro para manter a aplicação funcionando
      return this.getMockNews(limit);
    }
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
          return foundNews;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Erro ao buscar notícia por ID ${id}:`, error);
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