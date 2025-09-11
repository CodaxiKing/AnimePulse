// API functions for web scraping integration

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

interface StreamingResponse {
  streamingUrl: string;
  headers: {
    Referer: string;
    'User-Agent': string;
  };
}

// Buscar animes usando web scraping de todos os sites
export async function searchScrapedAnimes(query?: string): Promise<ScrapedAnime[]> {
  try {
    console.log('🔍 Searching scraped animes for:', query || 'all');
    
    const url = new URL('/api/scrape/animes', window.location.origin);
    if (query) {
      url.searchParams.append('q', query);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Scraped animes found:', data.data.length);
    
    return data.data;
  } catch (error) {
    console.error('❌ Error searching scraped animes:', error);
    throw error;
  }
}

// Buscar episódios de um anime específico usando web scraping
export async function getScrapedEpisodes(animeId: string, animeUrl: string): Promise<ScrapedEpisode[]> {
  try {
    console.log(`🎬 Getting scraped episodes for anime: ${animeId}`);
    
    const url = new URL(`/api/scrape/episodes/${animeId}`, window.location.origin);
    url.searchParams.append('animeUrl', animeUrl);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Scraped episodes found:', data.data.length);
    
    return data.data;
  } catch (error) {
    console.error('❌ Error getting scraped episodes:', error);
    throw error;
  }
}

// Obter URL de streaming de um episódio
export async function getScrapedStreamingUrl(episodeId: string, episodeUrl: string): Promise<StreamingResponse> {
  try {
    console.log(`🎥 Getting streaming URL for episode: ${episodeId}`);
    
    const url = new URL(`/api/scrape/streaming/${episodeId}`, window.location.origin);
    url.searchParams.append('episodeUrl', episodeUrl);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Streaming URL obtained for episode:', episodeId);
    
    return data;
  } catch (error) {
    console.error('❌ Error getting streaming URL:', error);
    throw error;
  }
}

// Tipos exportados para uso em componentes
export type { ScrapedAnime, ScrapedEpisode, StreamingResponse };