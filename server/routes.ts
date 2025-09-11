import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import type { Anime, Episode, Manga, News, InsertUser } from "@shared/schema";
import fetch from 'node-fetch';
import { insertUserSchema } from "@shared/schema";
import session from "express-session";
import { ZodError } from "zod";
import { generateRandomDisplayName, getDaysUntilNextChange } from "./nameGenerator";

// Extend Express Session interface
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Middleware para verificar autenticação
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Mock user progress data (in a real app, this would come from database)
const mockUserProgress = [
  {
    animeId: 5114, // Fullmetal Alchemist: Brotherhood
    episodesWatched: 64,
    totalEpisodes: 64,
    status: 'completed',
    score: 10,
    updatedAt: '2024-12-01'
  },
  {
    animeId: 21, // One Piece
    episodesWatched: 450,
    totalEpisodes: 1000,
    status: 'watching',
    score: 9,
    updatedAt: '2024-12-15'
  },
  {
    animeId: 38000, // Kimetsu no Yaiba
    episodesWatched: 26,
    totalEpisodes: 26,
    status: 'completed',
    score: 9,
    updatedAt: '2024-11-20'
  },
  {
    animeId: 52991, // Sousou no Frieren
    episodesWatched: 15,
    totalEpisodes: 28,
    status: 'watching',
    score: 8,
    updatedAt: '2024-12-10'
  },
  {
    animeId: 16498, // Attack on Titan
    episodesWatched: 12,
    totalEpisodes: 25,
    status: 'watching',
    score: 8,
    updatedAt: '2024-12-05'
  },
  {
    animeId: 31043, // Boku no Hero Academia
    episodesWatched: 50,
    totalEpisodes: 138,
    status: 'watching',
    score: 7,
    updatedAt: '2024-12-12'
  },
  {
    animeId: 47778, // Kimetsu no Yaiba Movie
    episodesWatched: 1,
    totalEpisodes: 1,
    status: 'completed',
    score: 10,
    updatedAt: '2024-10-25'
  },
  {
    animeId: 11061, // Hunter x Hunter
    episodesWatched: 45,
    totalEpisodes: 148,
    status: 'watching',
    score: 9,
    updatedAt: '2024-12-13'
  },
  {
    animeId: 1535, // Death Note
    episodesWatched: 20,
    totalEpisodes: 37,
    status: 'watching',
    score: 8,
    updatedAt: '2024-12-14'
  },
  {
    animeId: 22319, // Tokyo Ghoul
    episodesWatched: 8,
    totalEpisodes: 12,
    status: 'watching',
    score: 7,
    updatedAt: '2024-12-11'
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar sessão
  app.use(session({
    secret: process.env.SESSION_SECRET || 'anime-pulse-secret-key-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }));
  // MyAnimeList Proxy Endpoints

  app.get("/api/mal/anime/trending", async (req, res) => {
    try {
      const { limit = 25 } = req.query;
      const fields = [
        'id', 'title', 'main_picture', 'alternative_titles',
        'start_date', 'end_date', 'synopsis', 'mean', 'rank',
        'popularity', 'num_episodes', 'status', 'genres',
        'studios', 'rating', 'media_type', 'source', 'statistics'
      ].join(',');
      
      const response = await fetch(
        `https://api.myanimelist.net/v2/anime/ranking?ranking_type=airing&limit=${limit}&fields=${fields}`,
        {
          headers: {
            'X-MAL-CLIENT-ID': '8c655cb39b399536ed320693e1074910',
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error('MAL API Error:', response.status);
        return res.status(response.status).json({ error: 'MyAnimeList API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from MAL:', error);
      res.status(500).json({ error: "Failed to fetch trending animes from MAL" });
    }
  });
  
  app.get("/api/mal/anime/top", async (req, res) => {
    try {
      const { limit = 25 } = req.query;
      const fields = [
        'id', 'title', 'main_picture', 'alternative_titles',
        'start_date', 'end_date', 'synopsis', 'mean', 'rank',
        'popularity', 'num_episodes', 'status', 'genres',
        'studios', 'rating', 'media_type', 'source', 'statistics'
      ].join(',');
      
      const response = await fetch(
        `https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=${limit}&fields=${fields}`,
        {
          headers: {
            'X-MAL-CLIENT-ID': '8c655cb39b399536ed320693e1074910',
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error('MAL API Error:', response.status);
        return res.status(response.status).json({ error: 'MyAnimeList API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from MAL:', error);
      res.status(500).json({ error: "Failed to fetch top animes from MAL" });
    }
  });
  
  app.get("/api/mal/manga/top", async (req, res) => {
    try {
      const { limit = 25 } = req.query;
      const fields = [
        'id', 'title', 'main_picture', 'alternative_titles',
        'start_date', 'end_date', 'synopsis', 'mean', 'rank',
        'popularity', 'num_chapters', 'num_volumes', 'status',
        'genres', 'authors', 'media_type', 'serialization'
      ].join(',');
      
      const response = await fetch(
        `https://api.myanimelist.net/v2/manga/ranking?ranking_type=all&limit=${limit}&fields=${fields}`,
        {
          headers: {
            'X-MAL-CLIENT-ID': '8c655cb39b399536ed320693e1074910',
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error('MAL API Error:', response.status);
        return res.status(response.status).json({ error: 'MyAnimeList API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from MAL:', error);
      res.status(500).json({ error: "Failed to fetch top manga from MAL" });
    }
  });

  // Detalhes de anime individual (deve vir após os endpoints específicos)
  app.get('/api/mal/anime/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.query;
      
      // Verificar se o ID é numérico (MAL ID válido)
      if (isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid anime ID' });
      }
      
      const fieldsParam = fields || 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_episodes,status,genres,studios,source,rating,statistics';
      
      const response = await fetch(
        `https://api.myanimelist.net/v2/anime/${id}?fields=${fieldsParam}`,
        {
          headers: {
            'X-MAL-CLIENT-ID': '8c655cb39b399536ed320693e1074910',
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('MAL API Error for anime ID:', id, response.status);
        return res.status(response.status).json({ error: `MAL API error: ${response.status}` });
      }

      const data = await response.json();
      res.json({ node: data });
    } catch (error) {
      console.error('Error fetching MAL anime details:', error);
      res.status(500).json({ error: 'Failed to fetch anime details' });
    }
  });

  // Anime routes with real streaming API integration
  app.get("/api/animes/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const animes = await animeStreamingService.getTrendingAnime(page);
      
      res.json({ data: animes });
    } catch (error) {
      console.error("Error fetching trending animes:", error);
      res.status(500).json({ error: "Failed to fetch trending animes" });
    }
  });

  app.get("/api/animes/recent", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const type = parseInt(req.query.type as string) || 1;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const episodes = await animeStreamingService.getRecentEpisodes(page, type);
      
      res.json({ data: episodes });
    } catch (error) {
      console.error("Error fetching recent episodes:", error);
      res.status(500).json({ error: "Failed to fetch recent episodes" });
    }
  });

  app.get("/api/animes/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const { animeStreamingService } = await import('./lib/animeService');
      const results = await animeStreamingService.searchAnime(query, page);
      
      res.json({ data: results });
    } catch (error) {
      console.error("Error searching animes:", error);
      res.status(500).json({ error: "Failed to search animes" });
    }
  });

  app.get("/api/animes/latest", async (req, res) => {
    try {
      const { animeStreamingService } = await import('./lib/animeService');
      const episodes = await animeStreamingService.getRecentEpisodes(1, 1);
      
      res.json({ data: episodes });
    } catch (error) {
      console.error("Error fetching latest animes:", error);
      res.status(500).json({ error: "Failed to fetch latest animes" });
    }
  });

  app.get("/api/animes/continue", async (req, res) => {
    try {
      // This would require user authentication in real implementation
      // For now, return recent episodes as continue watching
      const { animeStreamingService } = await import('./lib/animeService');
      const episodes = await animeStreamingService.getRecentEpisodes(1, 1);
      
      res.json({ data: episodes.slice(0, 5) });
    } catch (error) {
      console.error("Error fetching continue watching:", error);
      res.status(500).json({ error: "Failed to fetch continue watching" });
    }
  });

  app.get("/api/animes/top", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const animes = await animeStreamingService.getTrendingAnime(page);
      
      res.json({ data: animes });
    } catch (error) {
      console.error("Error fetching top animes:", error);
      res.status(500).json({ error: "Failed to fetch top animes" });
    }
  });

  app.get("/api/animes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const anime = await animeStreamingService.getAnimeById(id);
      
      if (!anime) {
        return res.status(404).json({ error: "Anime not found" });
      }
      
      res.json({ data: anime });
    } catch (error) {
      console.error("Error fetching anime details:", error);
      res.status(500).json({ error: "Failed to fetch anime details" });
    }
  });

  app.get("/api/animes/:id/episodes", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const episodes = await animeStreamingService.getAnimeEpisodes(id);
      
      res.json({ data: episodes });
    } catch (error) {
      console.error("Error fetching anime episodes:", error);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // New streaming endpoint
  app.get("/api/episodes/:id/stream", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { animeStreamingService } = await import('./lib/animeService');
      const streamingUrl = await animeStreamingService.getEpisodeStreamingUrl(id);
      
      if (!streamingUrl) {
        return res.status(404).json({ error: "Streaming URL not found" });
      }
      
      res.json({ 
        streamingUrl,
        headers: {
          'Referer': 'https://gogoplay.io/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    } catch (error) {
      console.error("Error fetching streaming URL:", error);
      res.status(500).json({ error: "Failed to fetch streaming URL" });
    }
  });

  // Web Scraping Routes
  app.get("/api/scrape/animes", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      const { webScrapingService } = await import('./lib/webScrapingService');
      const animes = await webScrapingService.searchAllSites(query);
      
      res.json({ data: animes });
    } catch (error) {
      console.error("Error scraping animes:", error);
      res.status(500).json({ error: "Failed to scrape animes" });
    }
  });

  app.get("/api/scrape/episodes/:animeId", async (req, res) => {
    try {
      const { animeId } = req.params;
      const { animeUrl } = req.query;
      
      if (!animeUrl) {
        return res.status(400).json({ error: "animeUrl is required" });
      }
      
      const { webScrapingService } = await import('./lib/webScrapingService');
      const episodes = await webScrapingService.scrapeEpisodes(animeUrl as string, animeId);
      
      res.json({ data: episodes });
    } catch (error) {
      console.error("Error scraping episodes:", error);
      res.status(500).json({ error: "Failed to scrape episodes" });
    }
  });

  app.get("/api/scrape/streaming/:episodeId", async (req, res) => {
    try {
      const { episodeId } = req.params;
      const { episodeUrl } = req.query;
      
      if (!episodeUrl) {
        return res.status(400).json({ error: "episodeUrl is required" });
      }
      
      const { webScrapingService } = await import('./lib/webScrapingService');
      const streamingUrl = await webScrapingService.getStreamingUrl(episodeUrl as string);
      
      if (!streamingUrl) {
        return res.status(404).json({ error: "Streaming URL not found" });
      }
      
      res.json({ 
        streamingUrl,
        headers: {
          'Referer': episodeUrl,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    } catch (error) {
      console.error("Error getting streaming URL:", error);
      res.status(500).json({ error: "Failed to get streaming URL" });
    }
  });

  // Manga routes
  app.get("/api/mangas/latest", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest manga" });
    }
  });

  app.get("/api/mangas/categories", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manga categories" });
    }
  });

  // News routes with Anime News Network integration
  app.get("/api/news", async (req, res) => {
    try {
      const category = req.query.category as 'all' | 'news' | 'reviews' | 'features' || 'news';
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getNews(category, limit);
      
      res.json({ data: news });
    } catch (error) {
      console.error("Error fetching anime news:", error);
      res.status(500).json({ error: "Failed to fetch anime news" });
    }
  });

  app.get("/api/news/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getLatestNews(limit);
      
      res.json({ data: news });
    } catch (error) {
      console.error("Error fetching latest anime news:", error);
      res.status(500).json({ error: "Failed to fetch latest anime news" });
    }
  });

  app.get("/api/news/reviews", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getReviews(limit);
      
      res.json({ data: news });
    } catch (error) {
      console.error("Error fetching anime reviews:", error);
      res.status(500).json({ error: "Failed to fetch anime reviews" });
    }
  });

  app.get("/api/news/features", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getFeatures(limit);
      
      res.json({ data: news });
    } catch (error) {
      console.error("Error fetching anime features:", error);
      res.status(500).json({ error: "Failed to fetch anime features" });
    }
  });

  app.get("/api/news/category/:category", async (req, res) => {
    try {
      const category = req.params.category as 'all' | 'news' | 'reviews' | 'features';
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getNews(category, limit);
      
      res.json({ data: news });
    } catch (error) {
      console.error(`Error fetching ${req.params.category} news:`, error);
      res.status(500).json({ error: "Failed to fetch news by category" });
    }
  });

  // Endpoint de debug para verificar estrutura RSS (deve vir antes do endpoint dinâmico)
  app.get("/api/news/debug", async (req, res) => {
    try {
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getNews('news', 3);
      
      res.json({
        message: "Debug RSS feed content",
        newsCount: news.length,
        firstNews: news[0] ? {
          id: news[0].id,
          title: news[0].title,
          descriptionLength: news[0].description.length,
          contentLength: news[0].content?.length || 0,
          hasContent: !!news[0].content,
          contentPreview: news[0].content?.substring(0, 200) || 'No content'
        } : null
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: "Debug failed" });
    }
  });

  // Endpoint para buscar notícia individual com conteúdo completo  
  app.get("/api/news/:id(*)", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`🔍 Buscando notícia com ID: ${id}`);
      
      const { animeNewsService } = await import('./lib/newsService');
      const news = await animeNewsService.getNewsById(id);
      
      if (!news) {
        console.log(`❌ Notícia não encontrada para ID: ${id}`);
        return res.status(404).json({ error: "News not found" });
      }
      
      console.log(`✅ Notícia encontrada: ${news.title}`);
      res.json(news);
    } catch (error) {
      console.error(`Error fetching news ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Endpoint para criar nova notícia
  app.post("/api/news/create", async (req, res) => {
    try {
      const { title, description, category, thumbnail, author, link } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }
      
      const newNews = {
        id: `custom-${Date.now()}`,
        title,
        description,
        content: description, // Para notícias criadas manualmente, usar description como content
        link: link || '#',
        publishedDate: new Date().toISOString(),
        category: category || 'news',
        thumbnail,
        author: author || 'AnimePulse'
      };
      
      // Em uma aplicação real, você salvaria isso no banco de dados
      // Por enquanto, vamos apenas retornar os dados criados
      
      console.log('✅ Nova notícia criada:', newNews.title);
      res.json(newNews);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ error: "Failed to create news" });
    }
  });

  // Social routes
  app.get("/api/social/posts", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social posts" });
    }
  });

  app.get("/api/social/users/active", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Verificar se usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Criar novo usuário
      const user = await storage.createUser(userData);
      
      // Criar sessão
      req.session.userId = user.id;
      
      // Retornar usuário sem senha
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Autenticar usuário
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Criar sessão
      req.session.userId = user.id;
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid'); // Nome padrão do cookie de sessão
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Retornar usuário sem senha e com informações extras
      const { password, ...userWithoutPassword } = user;
      const daysUntilNextChange = getDaysUntilNextChange(user.lastNameChange!);
      
      res.json({ 
        user: {
          ...userWithoutPassword,
          daysUntilNextChange,
          canChangeName: daysUntilNextChange === 0
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/auth/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      let stats = await storage.getUserStats(userId);
      
      // Se o usuário não tem estatísticas, criar uma entrada inicial
      if (!stats) {
        stats = await storage.createUserStats(userId);
      }
      
      res.json({ stats });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  // User Progress Endpoints for Timeline
  app.get("/api/user/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Filtrar apenas animes que não estão completados (para "Continue Assistindo")
      const activeProgress = mockUserProgress.filter(p => p.status === 'watching');
      
      console.log('📊 Retornando dados de progresso ativo (não completados):', activeProgress.length, 'itens');
      res.json(activeProgress);
      return;
      
      // Tentar buscar progresso real do banco de dados
      try {
        const progress = await storage.getWatchProgress(userId);
        if (progress.length > 0) {
          // Converter para formato esperado pelo frontend
          const formattedProgress = progress.map(p => ({
            animeId: parseInt(p.animeId || '0'),
            episodesWatched: p.episodeNumber,
            totalEpisodes: 24, // Valor padrão, poderia ser buscado da API
            status: 'watching',
            updatedAt: p.updatedAt?.toISOString().split('T')[0]
          }));
          return res.json(formattedProgress);
        }
      } catch (dbError) {
        console.warn('⚠️ Erro ao buscar progresso do banco, usando dados mock:', dbError);
      }
      
      // Fallback para dados mock se não houver progresso no banco
      res.json(mockUserProgress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.post("/api/user/progress", async (req, res) => {
    try {
      const { animeId, episodesWatched, totalEpisodes, status, score } = req.body;
      
      if (!animeId || !status) {
        return res.status(400).json({ error: "animeId and status are required" });
      }
      
      // Find existing progress
      const existingIndex = mockUserProgress.findIndex(p => p.animeId === animeId);
      
      const progressData = {
        animeId,
        episodesWatched: episodesWatched || 0,
        totalEpisodes: totalEpisodes || 12,
        status,
        score,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      
      if (existingIndex >= 0) {
        // Update existing progress
        mockUserProgress[existingIndex] = progressData;
      } else {
        // Add new progress
        mockUserProgress.push(progressData);
      }
      
      // Se o anime foi marcado como completado, verificar conquistas
      if (status === 'completed' && req.session.userId) {
        try {
          await storage.checkAndUnlockAchievements(req.session.userId);
        } catch (error) {
          console.error('Erro ao verificar conquistas:', error);
        }
      }
      
      res.json(progressData);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ error: "Failed to update user progress" });
    }
  });


  app.delete("/api/user/progress/:animeId", async (req, res) => {
    try {
      const animeId = parseInt(req.params.animeId);
      const index = mockUserProgress.findIndex(p => p.animeId === animeId);
      
      if (index >= 0) {
        mockUserProgress.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Progress not found" });
      }
    } catch (error) {
      console.error("Error deleting user progress:", error);
      res.status(500).json({ error: "Failed to delete user progress" });
    }
  });

  app.post("/api/auth/update-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { episodesWatched, animesCompleted, totalPoints, lastWatchDate } = req.body;
      
      let stats = await storage.getUserStats(userId);
      
      // Se não existem estatísticas, criar
      if (!stats) {
        stats = await storage.createUserStats(userId);
      }
      
      // Calcular novos valores (incrementais)
      const updates: any = {};
      
      if (episodesWatched) {
        updates.episodesWatched = (stats.episodesWatched || 0) + episodesWatched;
      }
      
      if (animesCompleted) {
        updates.animesCompleted = (stats.animesCompleted || 0) + animesCompleted;
      }
      
      if (totalPoints) {
        updates.totalPoints = (stats.totalPoints || 0) + totalPoints;
      }
      
      if (lastWatchDate) {
        updates.lastWatchDate = new Date(lastWatchDate);
      }
      
      // Calcular nível baseado nos pontos
      if (updates.totalPoints !== undefined) {
        updates.level = Math.floor((updates.totalPoints || 0) / 100) + 1;
      }
      
      const updatedStats = await storage.updateUserStats(userId, updates);
      
      res.json({ stats: updatedStats });
    } catch (error) {
      console.error("Update user stats error:", error);
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });

  app.put("/api/auth/display-name", requireAuth, async (req, res) => {
    try {
      const { displayName } = req.body;
      
      if (!displayName || typeof displayName !== 'string') {
        return res.status(400).json({ error: "Display name is required" });
      }

      if (displayName.length < 3 || displayName.length > 50) {
        return res.status(400).json({ error: "Display name must be between 3 and 50 characters" });
      }

      const updatedUser = await storage.updateDisplayName(req.session.userId!, displayName);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Retornar usuário atualizado sem senha
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Update display name error:", error);
      if (error.message?.includes("7 dias")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update display name" });
    }
  });

  app.post("/api/auth/generate-name", requireAuth, async (req, res) => {
    try {
      const randomName = generateRandomDisplayName();
      res.json({ displayName: randomName });
    } catch (error) {
      console.error("Generate name error:", error);
      res.status(500).json({ error: "Failed to generate name" });
    }
  });

  // Upload de foto de perfil
  app.post("/api/profile/upload-url", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/profile/avatar", requireAuth, async (req, res) => {
    try {
      const { avatarUrl } = req.body;
      const userId = req.session.userId!;
      
      if (!avatarUrl) {
        return res.status(400).json({ error: "Avatar URL is required" });
      }

      const updatedUser = await storage.updateUserAvatar(userId, avatarUrl);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update avatar error:", error);
      res.status(500).json({ error: "Failed to update avatar" });
    }
  });

  // Sistema de auto-conclusão de animes
  app.post("/api/anime/complete", requireAuth, async (req, res) => {
    try {
      const { animeId, animeTitle, animeImage, totalEpisodes } = req.body;
      const userId = req.session.userId!;
      
      if (!animeId || !animeTitle) {
        return res.status(400).json({ error: "Anime ID and title are required" });
      }

      // Marcar anime como completado
      const completedAnime = await storage.markAnimeAsCompleted(userId, {
        animeId,
        animeTitle,
        animeImage,
        totalEpisodes: totalEpisodes || 0,
        pointsEarned: (totalEpisodes || 0) * 10, // 10 pontos por episódio
      });

      // Remover da lista de progresso (Continue Assistindo)
      await storage.removeFromWatchProgress(userId, animeId);
      console.log(`✅ Anime ${animeTitle} removido da lista de progresso`);

      // Atualizar estatísticas do usuário
      const currentStats = await storage.getUserStats(userId);
      if (currentStats) {
        await storage.updateUserStats(userId, {
          animesCompleted: (currentStats.animesCompleted || 0) + 1,
          totalPoints: (currentStats.totalPoints || 0) + ((totalEpisodes || 0) * 10),
        });
      }

      res.json({ completedAnime });
    } catch (error) {
      console.error("Complete anime error:", error);
      res.status(500).json({ error: "Failed to complete anime" });
    }
  });

  // Buscar animes completados
  app.get("/api/user/completed-animes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const completedAnimes = await storage.getCompletedAnimes(userId);
      res.json(completedAnimes);
    } catch (error) {
      console.error("Get completed animes error:", error);
      res.status(500).json({ error: "Failed to get completed animes" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  // Seed achievements route (admin only)
  app.post("/api/admin/seed-achievements", async (req, res) => {
    try {
      // const { seedAchievements } = await import('./seedAchievements');
      // await seedAchievements();
      res.json({ success: true, message: "Achievements seeded successfully" });
    } catch (error) {
      console.error("Seed achievements error:", error);
      res.status(500).json({ error: "Failed to seed achievements" });
    }
  });

  app.get("/api/user/achievements", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Get user achievements error:", error);
      res.status(500).json({ error: "Failed to get user achievements" });
    }
  });

  app.post("/api/user/check-achievements", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const newlyUnlocked = await storage.checkAndUnlockAchievements(userId);
      res.json({ newlyUnlocked });
    } catch (error) {
      console.error("Check achievements error:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Atualizar progresso de anime
  app.post("/api/user/progress", requireAuth, async (req, res) => {
    try {
      const { animeId, episodeNumber } = req.body;
      const userId = req.session.userId!;
      
      if (!animeId || episodeNumber === undefined) {
        return res.status(400).json({ error: "Anime ID and episode number are required" });
      }

      const progress = await storage.updateWatchProgress(userId, animeId, episodeNumber);
      res.json({ progress });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Buscar animes específico
  app.get("/api/animes/search", async (req, res) => {
    try {
      const { q, page = 1 } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }
      
      console.log(`🔍 Searching for anime: "${q}"`);
      const { animeStreamingService } = await import('./lib/animeService');
      const results = await animeStreamingService.searchAnime(q, Number(page));
      
      res.json({
        data: results,
        page: Number(page),
        query: q
      });
    } catch (error) {
      console.error('❌ Error searching anime:', error);
      res.status(500).json({ error: "Anime search failed" });
    }
  });

  // Search route
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }
      
      // In real implementation, search across all content types
      res.json({ animes: [], mangas: [], news: [] });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
