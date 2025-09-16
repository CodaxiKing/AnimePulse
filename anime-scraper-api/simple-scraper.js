const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple demo data for testing
const demoAnimes = [
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
  }
];

const demoEpisodes = [
  {
    id: 'ep-1',
    animeId: 'demo-1',
    siteId: 'demo',
    number: 1,
    title: 'Fullmetal Alchemist',
    url: 'https://example.com/fullmetal-alchemist-brotherhood/episode-1',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: '24 min',
    releaseDate: '2009-04-05'
  },
  {
    id: 'ep-2',
    animeId: 'demo-1',
    siteId: 'demo',
    number: 2,
    title: 'The First Day',
    url: 'https://example.com/fullmetal-alchemist-brotherhood/episode-2',
    thumbnail: 'https://via.placeholder.com/640x360',
    duration: '24 min',
    releaseDate: '2009-04-12'
  }
];

// Demo streaming URLs
const demoStreams = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Simple Anime Scraper API is running',
    version: '1.0.0-simple',
    endpoints: {
      '/api/animes': 'GET - Search animes (query parameter: q)',
      '/api/animes/:siteId/:animeId/episodes': 'GET - Get anime episodes',
      '/api/episodes/:siteId/:episodeId/stream': 'GET - Get episode streaming URL'
    }
  });
});

// Search animes
app.get('/api/animes', async (req, res) => {
  try {
    const { q: query, site } = req.query;
    
    console.log(`🔍 Simple search for animes${query ? ` matching: "${query}"` : ''}`);
    
    let results = demoAnimes;
    
    // Simple filtering based on query
    if (query) {
      results = demoAnimes.filter(anime => 
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
    
    console.log(`🎬 Getting episodes for anime: ${animeId} from site: ${siteId}`);
    
    // Generate episodes for the requested anime
    const episodes = [];
    const baseAnime = demoAnimes.find(a => a.id === animeId) || demoAnimes[0];
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
    
    console.log(`🎥 Getting streaming URL for episode: ${episodeId} from site: ${siteId}`);
    
    // Get episode number from episodeId or use random
    const episodeMatch = episodeId.match(/ep-(\d+)/);
    const episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : 1;
    
    // Select a demo stream based on episode number
    const streamIndex = (episodeNumber - 1) % demoStreams.length;
    const streamingUrl = demoStreams[streamIndex];
    
    const streamingData = {
      streamingUrl: streamingUrl,
      referer: 'https://example.com',
      headers: {
        'Referer': 'https://example.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      external: false
    };
    
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
  console.log(`🚀 Simple Anime Scraper API running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/`);
  console.log(`💡 This is a simplified version with demo data for development`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  process.exit(0);
});