import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
