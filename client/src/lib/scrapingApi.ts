// Cliente para a API de Web Scraping dos sites de anime

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || ''; // Use relative URLs via Vite proxy

export interface ScrapedAnime {
  id: string;
  siteId: string;
  title: string;
  url: string;
  thumbnail: string;
  totalEpisodes?: number;
  genres?: string[];
  status?: string;
  year?: number;
}

export interface ScrapedEpisode {
  id: string;
  animeId: string;
  siteId: string;
  number: number;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  releaseDate?: string;
}

export interface StreamingData {
  streamingUrl: string;
  referer: string;
  headers: {
    Referer: string;
    'User-Agent': string;
  };
  external?: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  query?: string;
  timestamp: string;
  error?: string;
  message?: string;
}

class ScrapingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }
      
      return result.data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Buscar animes de todos os sites ou de um site específico
  async searchAnimes(query?: string, site?: string): Promise<ScrapedAnime[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (site) params.append('site', site);
    
    const endpoint = `/api/scraping/animes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<ScrapedAnime[]>(endpoint);
  }

  // Obter episódios de um anime específico
  async getAnimeEpisodes(siteId: string, animeId: string, animeUrl: string): Promise<ScrapedEpisode[]> {
    const params = new URLSearchParams();
    params.append('animeUrl', animeUrl);
    
    const endpoint = `/api/scraping/animes/${siteId}/${animeId}/episodes?${params.toString()}`;
    return this.makeRequest<ScrapedEpisode[]>(endpoint);
  }

  // Obter URL de streaming de um episódio
  async getEpisodeStream(siteId: string, episodeId: string, episodeUrl: string): Promise<StreamingData> {
    const params = new URLSearchParams();
    params.append('episodeUrl', episodeUrl);
    
    const endpoint = `/api/scraping/episodes/${siteId}/${episodeId}/stream?${params.toString()}`;
    return this.makeRequest<StreamingData>(endpoint);
  }

  // Verificar se a API está disponível
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Instância singleton da API
export const scrapingApi = new ScrapingApiClient();

// Funções de conveniência para usar nos componentes
export async function searchScrapedAnimes(query?: string, site?: string): Promise<ScrapedAnime[]> {
  return scrapingApi.searchAnimes(query, site);
}

export async function getScrapedAnimeEpisodes(siteId: string, animeId: string, animeUrl: string): Promise<ScrapedEpisode[]> {
  return scrapingApi.getAnimeEpisodes(siteId, animeId, animeUrl);
}

export async function getScrapedEpisodeStream(siteId: string, episodeId: string, episodeUrl: string): Promise<StreamingData> {
  return scrapingApi.getEpisodeStream(siteId, episodeId, episodeUrl);
}

export async function checkScrapingApiHealth(): Promise<boolean> {
  return scrapingApi.healthCheck();
}

// Função adapter para compatibilidade com EpisodeModal
export async function getEpisodeVideoUrl(animeTitle: string, episodeNumber: number, year?: number): Promise<string | null> {
  try {
    console.log(`🎬 Buscando vídeo para: ${animeTitle} - Episódio ${episodeNumber}`);
    
    // Buscar animes com título similar
    const searchResults = await searchScrapedAnimes(animeTitle);
    
    if (searchResults.length === 0) {
      console.log('⚠️ Nenhum anime encontrado na busca');
      return null;
    }
    
    // Pegar o primeiro resultado
    const anime = searchResults[0];
    console.log(`✅ Anime encontrado: ${anime.title} (${anime.siteId})`);
    
    // Buscar episódios do anime
    const episodes = await getScrapedAnimeEpisodes(anime.siteId, anime.id, anime.url);
    
    // Encontrar o episódio específico
    const episode = episodes.find(ep => ep.number === episodeNumber);
    
    if (!episode) {
      console.log(`⚠️ Episódio ${episodeNumber} não encontrado`);
      return null;
    }
    
    console.log(`✅ Episódio encontrado: ${episode.title}`);
    
    // Obter URL de streaming
    const streamingData = await getScrapedEpisodeStream(anime.siteId, episode.id, episode.url);
    
    if (streamingData.streamingUrl) {
      console.log(`✅ URL de streaming obtida: ${streamingData.streamingUrl.substring(0, 50)}...`);
      return streamingData.streamingUrl;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar vídeo:', error);
    return null;
  }
}