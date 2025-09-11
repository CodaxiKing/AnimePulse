const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const AnimeScraper = require('./lib/AnimeScraper');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10, // Limit each IP to 10 requests per window
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again later.'
    });
  }
});

// Initialize scraper
const scraper = new AnimeScraper();

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Scraper API is running',
    version: '1.0.0',
    endpoints: {
      '/api/animes': 'GET - Search animes (query parameter: q)',
      '/api/animes/:siteId/:animeId/episodes': 'GET - Get anime episodes',
      '/api/episodes/:siteId/:episodeId/stream': 'GET - Get episode streaming URL'
    }
  });
});

// Get animes from all sites or search
app.get('/api/animes', async (req, res) => {
  try {
    const { q: query, site } = req.query;
    
    console.log(`🔍 Searching animes${query ? ` for: "${query}"` : ''}`);
    
    const results = await scraper.searchAnimes(query, site);
    
    res.json({
      success: true,
      data: results,
      count: results.length,
      query: query || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error searching animes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to search animes'
    });
  }
});

// Get episodes for a specific anime
app.get('/api/animes/:siteId/:animeId/episodes', async (req, res) => {
  try {
    const { siteId, animeId } = req.params;
    const { animeUrl } = req.query;
    
    if (!animeUrl) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'animeUrl query parameter is required'
      });
    }
    
    console.log(`🎬 Getting episodes for anime: ${animeId} from site: ${siteId}`);
    
    const episodes = await scraper.getEpisodes(siteId, animeId, animeUrl);
    
    res.json({
      success: true,
      data: episodes,
      count: episodes.length,
      animeId,
      siteId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting episodes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get episodes'
    });
  }
});

// Get streaming URL for an episode
app.get('/api/episodes/:siteId/:episodeId/stream', async (req, res) => {
  try {
    const { siteId, episodeId } = req.params;
    const { episodeUrl } = req.query;
    
    if (!episodeUrl) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request', 
        message: 'episodeUrl query parameter is required'
      });
    }
    
    console.log(`🎥 Getting streaming URL for episode: ${episodeId} from site: ${siteId}`);
    
    const streamingData = await scraper.getStreamingUrl(siteId, episodeId, episodeUrl);
    
    res.json({
      success: true,
      data: streamingData,
      episodeId,
      siteId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting streaming URL:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get streaming URL'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anime Scraper API running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await scraper.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await scraper.close();
  process.exit(0);
});