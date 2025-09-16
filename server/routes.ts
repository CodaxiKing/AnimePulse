import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import type { 
  Anime, Episode, Manga, News, InsertUser,
  Post, Comment, Reaction, Group, Notification,
  InsertPost, InsertComment, InsertReaction, InsertGroup,
  InsertFollow, InsertGroupMember, InsertNotification,
  InsertReport, InsertBookmark, InsertTag,
  ChatRoom, ChatMessage, ChatParticipant, WatchPartyEvent,
  InsertChatRoom, InsertChatMessage, InsertChatParticipant, InsertWatchPartyEvent
} from "@shared/schema";
import fetch from 'node-fetch';
import { 
  insertUserSchema, insertPostSchema, insertCommentSchema, 
  insertReactionSchema, insertGroupSchema, insertFollowSchema,
  insertGroupMemberSchema, insertNotificationSchema, insertReportSchema,
  insertBookmarkSchema, insertTagSchema, insertChatRoomSchema, 
  insertChatMessageSchema, insertChatParticipantSchema, insertWatchPartyEventSchema,
  chatRooms, chatMessages, chatParticipants, watchPartyEvents, users
} from "@shared/schema";
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

  // Integrated Anime Scraping API Routes
  
  // Demo data for scraping simulation
  const demoScrapedAnimes = [
    {
      id: 'demo-1',
      siteId: 'demo',
      title: 'Fullmetal Alchemist: Brotherhood',
      url: 'https://example.com/fullmetal-alchemist-brotherhood',
      thumbnail: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
      totalEpisodes: 64,
      genres: ['Action', 'Adventure', 'Drama'],
      status: 'Completed',
      year: 2009
    },
    {
      id: 'demo-2',
      siteId: 'demo',
      title: 'Attack on Titan',
      url: 'https://example.com/attack-on-titan',
      thumbnail: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
      totalEpisodes: 25,
      genres: ['Action', 'Drama', 'Fantasy'],
      status: 'Completed',
      year: 2013
    },
    {
      id: 'demo-3',
      siteId: 'demo',
      title: 'One Piece',
      url: 'https://example.com/one-piece',
      thumbnail: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
      totalEpisodes: 1000,
      genres: ['Adventure', 'Comedy', 'Drama'],
      status: 'Ongoing',
      year: 1999
    }
  ];

  // Demo streaming URLs removed - only real scraping will be used

  // Search scraped animes
  app.get("/api/scraping/animes", async (req, res) => {
    try {
      const { q: query, site } = req.query;
      
      console.log(`🔍 Searching scraped animes${query ? ` for: "${query}"` : ''}`);
      
      let results = demoScrapedAnimes;
      
      // Simple filtering based on query
      if (query && typeof query === 'string') {
        results = demoScrapedAnimes.filter(anime => 
          anime.title.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      res.json({
        success: true,
        data: results,
        count: results.length,
        query: query || null,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error searching scraped animes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to search animes'
      });
    }
  });

  // Get episodes for a specific scraped anime
  app.get("/api/scraping/animes/:siteId/:animeId/episodes", async (req, res) => {
    try {
      const { siteId, animeId } = req.params;
      const { animeUrl } = req.query;
      
      console.log(`🎬 Getting episodes for scraped anime: ${animeId} from site: ${siteId}`);
      
      // Generate episodes for the requested anime
      const episodes = [];
      const baseAnime = demoScrapedAnimes.find(a => a.id === animeId) || demoScrapedAnimes[0];
      const totalEpisodes = baseAnime.totalEpisodes || 12;
      
      for (let i = 1; i <= Math.min(totalEpisodes, 12); i++) {
        episodes.push({
          id: `ep-${i}`,
          animeId: animeId,
          siteId: siteId,
          number: i,
          title: `Episódio ${i}`,
          url: `https://example.com/${animeId}/episode-${i}`,
          thumbnail: 'https://via.placeholder.com/640x360',
          duration: '24 min',
          releaseDate: new Date(2024, 0, i).toISOString().split('T')[0]
        });
      }
      
      res.json({
        success: true,
        data: episodes,
        count: episodes.length,
        animeId,
        siteId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error getting scraped episodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get episodes'
      });
    }
  });

  // Get streaming URL for a scraped episode
  app.get("/api/scraping/episodes/:siteId/:episodeId/stream", async (req, res) => {
    try {
      const { siteId, episodeId } = req.params;
      const { episodeUrl } = req.query;
      
      console.log(`🎥 Getting streaming URL for scraped episode: ${episodeId} from site: ${siteId}`);
      
      // Real streaming scraping would go here
      // For now, return error since no real streaming is available
      
      res.status(404).json({
        success: false,
        error: 'Episode stream not available',
        message: 'Real streaming not implemented yet'
      });
      return;
      
      // This will not be reached due to early return above
      
    } catch (error) {
      console.error('❌ Error getting scraped streaming URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get streaming URL'
      });
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

  // ============================================
  // COMMUNITY API ROUTES - SOCIAL FEATURES
  // ============================================

  // POSTS ROUTES
  // Create a new post
  app.post("/api/community/posts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId
      });

      const post = await storage.createPost(postData);
      const fullPost = await storage.getPost(post.id, userId);

      res.status(201).json({ post: fullPost });
    } catch (error) {
      console.error("Create post error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Get posts feed
  app.get("/api/community/posts", async (req, res) => {
    try {
      const userId = req.session.userId;
      const { 
        limit = 20, 
        offset = 0, 
        visibility, 
        groupId,
        feed = 'all' // 'all', 'following', 'groups'
      } = req.query;

      let posts;
      if (feed === 'following' || feed === 'groups') {
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        posts = await storage.getFeedPosts(userId, {
          filter: feed as 'following' | 'groups',
          limit: Number(limit),
          offset: Number(offset)
        });
      } else {
        posts = await storage.getPosts(userId, {
          visibility: visibility as string,
          groupId: groupId as string,
          limit: Number(limit),
          offset: Number(offset)
        });
      }

      res.json({ posts, count: posts.length });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  // Get single post
  app.get("/api/community/posts/:postId", async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId;

      const post = await storage.getPost(postId, userId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ post });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to get post" });
    }
  });

  // Update post
  app.put("/api/community/posts/:postId", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;
      
      // Validate request body with partial post schema
      const updateSchema = insertPostSchema.partial().pick({
        content: true,
        mediaUrls: true,
        visibility: true
      });
      
      const validatedData = updateSchema.parse(req.body);

      const updatedPost = await storage.updatePost(postId, userId, validatedData);

      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found or access denied" });
      }

      res.json({ post: updatedPost });
    } catch (error) {
      console.error("Update post error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Delete post
  app.delete("/api/community/posts/:postId", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;

      await storage.deletePost(postId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // COMMENTS ROUTES
  // Create comment
  app.post("/api/community/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        userId
      });

      const comment = await storage.createComment(commentData);
      res.status(201).json({ comment });
    } catch (error) {
      console.error("Create comment error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid comment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Get post comments
  app.get("/api/community/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const comments = await storage.getPostComments(postId);

      res.json({ comments, count: comments.length });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  // Delete comment
  app.delete("/api/community/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.session.userId!;

      await storage.deleteComment(commentId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // REACTIONS ROUTES
  // React to post
  app.post("/api/community/posts/:postId/react", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;
      const { type = 'like' } = req.body;

      const reaction = await storage.createReaction({
        postId,
        userId,
        type
      });

      res.status(201).json({ reaction });
    } catch (error) {
      console.error("Create reaction error:", error);
      res.status(500).json({ error: "Failed to create reaction" });
    }
  });

  // Remove reaction from post
  app.delete("/api/community/posts/:postId/react", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;

      await storage.deleteReaction(userId, postId);

      res.json({ success: true });
    } catch (error) {
      console.error("Remove reaction error:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Get post reactions
  app.get("/api/community/posts/:postId/reactions", async (req, res) => {
    try {
      const { postId } = req.params;
      const { type, limit = 50, offset = 0 } = req.query;

      const reactions = await storage.getPostReactions(postId);

      res.json({ reactions, count: reactions.length });
    } catch (error) {
      console.error("Get reactions error:", error);
      res.status(500).json({ error: "Failed to get reactions" });
    }
  });

  // React to comment
  app.post("/api/community/comments/:commentId/react", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.session.userId!;
      const { type = 'like' } = req.body;

      const reaction = await storage.createReaction({
        commentId,
        userId,
        type
      });

      res.status(201).json({ reaction });
    } catch (error) {
      console.error("Create comment reaction error:", error);
      res.status(500).json({ error: "Failed to create reaction" });
    }
  });

  // Remove reaction from comment
  app.delete("/api/community/comments/:commentId/react", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.session.userId!;

      await storage.deleteReaction(userId, undefined, commentId);

      res.json({ success: true });
    } catch (error) {
      console.error("Remove comment reaction error:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // FOLLOW SYSTEM ROUTES
  // Follow user
  app.post("/api/community/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const followingId = req.params.userId;
      const followerId = req.session.userId!;

      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json({ follow });
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow user
  app.delete("/api/community/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const followingId = req.params.userId;
      const followerId = req.session.userId!;

      await storage.unfollowUser(followerId, followingId);

      res.json({ success: true });
    } catch (error) {
      console.error("Unfollow user error:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  // Get user followers
  app.get("/api/community/users/:userId/followers", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { limit = 50, offset = 0 } = req.query;

      const followers = await storage.getFollowers(userId);

      res.json({ followers, count: followers.length });
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Failed to get followers" });
    }
  });

  // Get user following
  app.get("/api/community/users/:userId/following", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { limit = 50, offset = 0 } = req.query;

      const following = await storage.getFollowing(userId);

      res.json({ following, count: following.length });
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Failed to get following" });
    }
  });

  // GROUPS ROUTES
  // Create group
  app.post("/api/community/groups", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const groupData = insertGroupSchema.parse({
        ...req.body,
        ownerId: userId
      });

      const group = await storage.createGroup(groupData);
      res.status(201).json({ group });
    } catch (error) {
      console.error("Create group error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid group data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // Get groups
  app.get("/api/community/groups", async (req, res) => {
    try {
      const { search, privacy, limit = 20, offset = 0 } = req.query;

      const groups = await storage.getGroups({
        privacy: privacy as string,
        limit: Number(limit)
      });

      res.json({ groups, count: groups.length });
    } catch (error) {
      console.error("Get groups error:", error);
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  // Get single group
  app.get("/api/community/groups/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.session.userId;

      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Note: Group privacy check removed - implement in frontend or add isGroupMember to storage interface

      res.json({ group });
    } catch (error) {
      console.error("Get group error:", error);
      res.status(500).json({ error: "Failed to get group" });
    }
  });

  // Join group
  app.post("/api/community/groups/:groupId/join", requireAuth, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.session.userId!;

      const membership = await storage.joinGroup(groupId, userId);
      res.status(201).json({ membership });
    } catch (error) {
      console.error("Join group error:", error);
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  // Leave group
  app.post("/api/community/groups/:groupId/leave", requireAuth, async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.session.userId!;

      await storage.leaveGroup(groupId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Leave group error:", error);
      res.status(500).json({ error: "Failed to leave group" });
    }
  });

  // Get group members
  app.get("/api/community/groups/:groupId/members", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { role, limit = 50, offset = 0 } = req.query;

      // Note: getGroupMembers not implemented in storage interface
      const members: any[] = [];

      res.json({ members, count: members.length });
    } catch (error) {
      console.error("Get group members error:", error);
      res.status(500).json({ error: "Failed to get group members" });
    }
  });

  // NOTIFICATIONS ROUTES
  // Get user notifications
  app.get("/api/community/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { unreadOnly = false, limit = 20 } = req.query;

      const notifications = await storage.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: Number(limit)
      });

      res.json({ notifications, count: notifications.length });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/community/notifications/:notificationId/read", requireAuth, async (req, res) => {
    try {
      const { notificationId } = req.params;

      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/community/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Get unread notifications count
  app.get("/api/community/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // USER PROFILE & SEARCH ROUTES
  // Get enhanced user profile
  app.get("/api/community/users/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.session.userId;

      const profile = await storage.getUserProfile(userId, requestingUserId);
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ profile });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Search users
  app.get("/api/community/users", async (req, res) => {
    try {
      const { q: query, limit = 20, offset = 0 } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const users = await storage.searchUsers(query, Number(limit));

      res.json({ users, count: users.length });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // BOOKMARKS ROUTES
  // Bookmark post
  app.post("/api/community/posts/:postId/bookmark", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;

      const bookmark = await storage.createBookmark(userId, postId);
      res.status(201).json({ bookmark });
    } catch (error) {
      console.error("Bookmark post error:", error);
      res.status(500).json({ error: "Failed to bookmark post" });
    }
  });

  // Remove bookmark
  app.delete("/api/community/posts/:postId/bookmark", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session.userId!;

      await storage.removeBookmark(userId, postId);

      res.json({ success: true });
    } catch (error) {
      console.error("Remove bookmark error:", error);
      res.status(500).json({ error: "Failed to remove bookmark" });
    }
  });

  // Get user bookmarks
  app.get("/api/community/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { limit = 20, offset = 0 } = req.query;

      const bookmarks = await storage.getUserBookmarks(userId);

      res.json({ bookmarks, count: bookmarks.length });
    } catch (error) {
      console.error("Get bookmarks error:", error);
      res.status(500).json({ error: "Failed to get bookmarks" });
    }
  });

  // TAGS ROUTES
  // Create tag
  app.post("/api/community/tags", requireAuth, async (req, res) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json({ tag });
    } catch (error) {
      console.error("Create tag error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid tag data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  // Get tags
  app.get("/api/community/tags", async (req, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;

      const tags = await storage.getTags(search as string);

      res.json({ tags, count: tags.length });
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ error: "Failed to get tags" });
    }
  });

  // Add tag to post
  app.post("/api/community/posts/:postId/tags", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const { tagId } = req.body;

      await storage.addTagToPost(postId, tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Add tag to post error:", error);
      res.status(500).json({ error: "Failed to add tag to post" });
    }
  });

  // Remove tag from post
  app.delete("/api/community/posts/:postId/tags/:tagId", requireAuth, async (req, res) => {
    try {
      const { postId, tagId } = req.params;

      await storage.removeTagFromPost(postId, tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove tag from post error:", error);
      res.status(500).json({ error: "Failed to remove tag from post" });
    }
  });

  // REPORTS/MODERATION ROUTES  
  // Create report
  app.post("/api/community/reports", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: userId
      });

      const report = await storage.createReport(reportData);
      res.status(201).json({ report });
    } catch (error) {
      console.error("Create report error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid report data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Get reports (admin/mod only - simplified for now)
  app.get("/api/community/reports", requireAuth, async (req, res) => {
    try {
      const { status, limit = 20, offset = 0 } = req.query;

      const reports = await storage.getReports({
        status: status as string,
        limit: Number(limit)
      });

      res.json({ reports, count: reports.length });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  // Update report status (admin/mod only - simplified for now)
  app.patch("/api/community/reports/:reportId", requireAuth, async (req, res) => {
    try {
      const { reportId } = req.params;
      
      // Validate request body for report status update
      const { status, reviewedById } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: "Status is required and must be a string" });
      }
      
      if (reviewedById && typeof reviewedById !== 'string') {
        return res.status(400).json({ error: "ReviewedById must be a string if provided" });
      }

      const report = await storage.updateReportStatus(reportId, status, reviewedById);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json({ report });
    } catch (error) {
      console.error("Update report error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid report update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // ========== CHAT API ENDPOINTS ==========

  // Listar todas as salas de chat públicas
  app.get("/api/chat/rooms", async (req, res) => {
    try {
      const { type = 'public' } = req.query;
      
      const rooms = await db.select({
        id: chatRooms.id,
        name: chatRooms.name,
        description: chatRooms.description,
        type: chatRooms.type,
        avatar: chatRooms.avatar,
        animeTitle: chatRooms.animeTitle,
        currentEpisode: chatRooms.currentEpisode,
        maxMembers: chatRooms.maxMembers,
        isActive: chatRooms.isActive,
        createdAt: chatRooms.createdAt,
        participantCount: sql<number>`(SELECT COUNT(*) FROM ${chatParticipants} WHERE ${chatParticipants.chatRoomId} = ${chatRooms.id})`
      })
      .from(chatRooms)
      .where(eq(chatRooms.type, type as string))
      .orderBy(chatRooms.createdAt);

      res.json({ data: rooms });
    } catch (error) {
      console.error("Error getting chat rooms:", error);
      res.status(500).json({ error: "Failed to get chat rooms" });
    }
  });

  // Criar nova sala de chat
  app.post("/api/chat/rooms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { name, description, type = 'public', animeId, animeTitle, maxMembers = 50 } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Nome da sala é obrigatório" });
      }

      const [room] = await db.insert(chatRooms).values({
        name,
        description,
        type,
        ownerId: userId,
        animeId,
        animeTitle,
        maxMembers,
        isActive: true
      }).returning();

      // Adicionar criador como participante
      await db.insert(chatParticipants).values({
        chatRoomId: room.id,
        userId,
        role: 'owner'
      });

      res.json({ data: room });
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ error: "Failed to create chat room" });
    }
  });

  // Entrar em uma sala de chat
  app.post("/api/chat/rooms/:roomId/join", requireAuth, async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session.userId!;

      // Verificar se já é participante
      const existingParticipant = await db.select()
        .from(chatParticipants)
        .where(and(eq(chatParticipants.chatRoomId, roomId), eq(chatParticipants.userId, userId)));

      if (existingParticipant.length > 0) {
        return res.json({ data: { message: "Já é participante desta sala" } });
      }

      // Verificar limite de participantes
      const room = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
      if (!room.length) {
        return res.status(404).json({ error: "Sala não encontrada" });
      }

      const participantCount = await db.select({ count: sql<number>`COUNT(*)` })
        .from(chatParticipants)
        .where(eq(chatParticipants.chatRoomId, roomId));

      if (participantCount[0]?.count >= room[0].maxMembers) {
        return res.status(400).json({ error: "Sala lotada" });
      }

      // Adicionar participante
      await db.insert(chatParticipants).values({
        chatRoomId: roomId,
        userId,
        role: 'member'
      });

      res.json({ data: { message: "Entrou na sala com sucesso" } });
    } catch (error) {
      console.error("Error joining chat room:", error);
      res.status(500).json({ error: "Failed to join chat room" });
    }
  });

  // Obter mensagens de uma sala
  app.get("/api/chat/rooms/:roomId/messages", requireAuth, async (req, res) => {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verificar se é participante
      const userId = req.session.userId!;
      const participant = await db.select()
        .from(chatParticipants)
        .where(and(eq(chatParticipants.chatRoomId, roomId), eq(chatParticipants.userId, userId)));

      if (!participant.length) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const messages = await db.select({
        id: chatMessages.id,
        content: chatMessages.content,
        type: chatMessages.type,
        mediaUrl: chatMessages.mediaUrl,
        isEdited: chatMessages.isEdited,
        createdAt: chatMessages.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar
        }
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.chatRoomId, roomId))
      .orderBy(chatMessages.createdAt)
      .limit(Number(limit))
      .offset(Number(offset));

      res.json({ data: messages });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Criar watch party
  app.post("/api/chat/watch-party", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { name, animeId, animeTitle, description } = req.body;

      if (!name || !animeId || !animeTitle) {
        return res.status(400).json({ error: "Nome, ID do anime e título são obrigatórios" });
      }

      const [room] = await db.insert(chatRooms).values({
        name,
        description,
        type: 'watch_party',
        ownerId: userId,
        animeId,
        animeTitle,
        currentEpisode: 1,
        currentTime: 0,
        isPlaying: false,
        maxMembers: 10
      }).returning();

      // Adicionar criador como participante
      await db.insert(chatParticipants).values({
        chatRoomId: room.id,
        userId,
        role: 'owner'
      });

      res.json({ data: room });
    } catch (error) {
      console.error("Error creating watch party:", error);
      res.status(500).json({ error: "Failed to create watch party" });
    }
  });

  // Obter estado da watch party
  app.get("/api/chat/watch-party/:roomId/state", requireAuth, async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session.userId!;

      // Verificar se é participante
      const participant = await db.select()
        .from(chatParticipants)
        .where(and(eq(chatParticipants.chatRoomId, roomId), eq(chatParticipants.userId, userId)));

      if (!participant.length) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const room = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId));
      if (!room.length || room[0].type !== 'watch_party') {
        return res.status(404).json({ error: "Watch party não encontrada" });
      }

      const participants = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        isOnline: chatParticipants.isOnline
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatRoomId, roomId));

      const watchPartyState = {
        isPlaying: room[0].isPlaying,
        currentTime: room[0].currentTime,
        currentEpisode: room[0].currentEpisode,
        animeTitle: room[0].animeTitle,
        participants: participants.map(p => p.displayName)
      };

      res.json({ data: watchPartyState });
    } catch (error) {
      console.error("Error getting watch party state:", error);
      res.status(500).json({ error: "Failed to get watch party state" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup for real-time chat and watch parties
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections
  const clients = new Map<string, { ws: WebSocket, userId: string, chatRoomId?: string }>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
          case 'join_chat': {
            const { userId, chatRoomId } = payload;
            
            // Store client connection
            const clientId = `${userId}_${Date.now()}`;
            clients.set(clientId, { ws, userId, chatRoomId });
            
            // Update participant status
            await db.update(chatParticipants)
              .set({ isOnline: true, lastSeen: new Date() })
              .where(and(eq(chatParticipants.userId, userId), eq(chatParticipants.chatRoomId, chatRoomId)));

            // Notify other participants
            const roomClients = Array.from(clients.values()).filter(
              client => client.chatRoomId === chatRoomId && client.ws.readyState === WebSocket.OPEN
            );
            
            roomClients.forEach(client => {
              if (client.ws !== ws) {
                client.ws.send(JSON.stringify({
                  type: 'user_joined',
                  payload: { userId, chatRoomId }
                }));
              }
            });
            break;
          }

          case 'send_message': {
            const { userId, chatRoomId, content, type: messageType = 'text', replyToId } = payload;
            
            // Insert message into database
            const [newMessage] = await db.insert(chatMessages).values({
              userId,
              chatRoomId,
              content,
              type: messageType,
              replyToId
            }).returning();

            // Get user details
            const [user] = await db.select().from(users).where(eq(users.id, userId));

            const messageWithUser = {
              ...newMessage,
              user
            };

            // Broadcast message to all room participants
            const roomClients = Array.from(clients.values()).filter(
              client => client.chatRoomId === chatRoomId && client.ws.readyState === WebSocket.OPEN
            );

            roomClients.forEach(client => {
              client.ws.send(JSON.stringify({
                type: 'new_message',
                payload: messageWithUser
              }));
            });
            break;
          }

          case 'watch_party_sync': {
            const { userId, chatRoomId, eventType, timestamp, episodeNumber } = payload;
            
            // Insert sync event
            await db.insert(watchPartyEvents).values({
              userId,
              chatRoomId,
              eventType,
              timestamp,
              episodeNumber
            });

            // Update room state for watch parties
            if (eventType === 'play' || eventType === 'pause') {
              await db.update(chatRooms)
                .set({ 
                  isPlaying: eventType === 'play',
                  currentTime: timestamp,
                  updatedAt: new Date()
                })
                .where(eq(chatRooms.id, chatRoomId));
            }

            if (eventType === 'episode_change') {
              await db.update(chatRooms)
                .set({ 
                  currentEpisode: episodeNumber,
                  currentTime: 0,
                  updatedAt: new Date()
                })
                .where(eq(chatRooms.id, chatRoomId));
            }

            // Broadcast sync event to all room participants except sender
            const roomClients = Array.from(clients.values()).filter(
              client => client.chatRoomId === chatRoomId && client.ws.readyState === WebSocket.OPEN
            );

            roomClients.forEach(client => {
              if (client.userId !== userId) {
                client.ws.send(JSON.stringify({
                  type: 'watch_party_sync',
                  payload: { eventType, timestamp, episodeNumber, userId }
                }));
              }
            });
            break;
          }

          case 'typing_start': {
            const { userId, chatRoomId } = payload;
            
            // Broadcast typing indicator
            const roomClients = Array.from(clients.values()).filter(
              client => client.chatRoomId === chatRoomId && client.ws.readyState === WebSocket.OPEN
            );

            roomClients.forEach(client => {
              if (client.userId !== userId) {
                client.ws.send(JSON.stringify({
                  type: 'typing_start',
                  payload: { userId, chatRoomId }
                }));
              }
            });
            break;
          }

          case 'typing_stop': {
            const { userId, chatRoomId } = payload;
            
            // Broadcast stop typing indicator
            const roomClients = Array.from(clients.values()).filter(
              client => client.chatRoomId === chatRoomId && client.ws.readyState === WebSocket.OPEN
            );

            roomClients.forEach(client => {
              if (client.userId !== userId) {
                client.ws.send(JSON.stringify({
                  type: 'typing_stop',
                  payload: { userId, chatRoomId }
                }));
              }
            });
            break;
          }
        }
      } catch (error) {
        console.error('❌ Erro processando mensagem WebSocket:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Erro interno do servidor' }
        }));
      }
    });

    ws.on('close', async () => {
      // Find and remove client from active connections
      const clientEntry = Array.from(clients.entries()).find(([_, client]) => client.ws === ws);
      
      if (clientEntry) {
        const [clientId, client] = clientEntry;
        clients.delete(clientId);
        
        // Update participant status to offline
        if (client.userId) {
          await db.update(chatParticipants)
            .set({ isOnline: false, lastSeen: new Date() })
            .where(eq(chatParticipants.userId, client.userId));

          // Notify other participants
          if (client.chatRoomId) {
            const roomClients = Array.from(clients.values()).filter(
              c => c.chatRoomId === client.chatRoomId && c.ws.readyState === WebSocket.OPEN
            );
            
            roomClients.forEach(c => {
              c.ws.send(JSON.stringify({
                type: 'user_left',
                payload: { userId: client.userId, chatRoomId: client.chatRoomId }
              }));
            });
          }
        }
      }
      console.log('🔌 Conexão WebSocket fechada');
    });
  });

  return httpServer;
}
