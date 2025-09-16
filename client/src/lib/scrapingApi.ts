// Cliente para a API de Web Scraping dos sites de anime

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:3001';

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
    
    const endpoint = `/api/animes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<ScrapedAnime[]>(endpoint);
  }

  // Obter episódios de um anime específico
  async getAnimeEpisodes(siteId: string, animeId: string, animeUrl: string): Promise<ScrapedEpisode[]> {
    const params = new URLSearchParams();
    params.append('animeUrl', animeUrl);
    
    const endpoint = `/api/animes/${siteId}/${animeId}/episodes?${params.toString()}`;
    return this.makeRequest<ScrapedEpisode[]>(endpoint);
  }

  // Obter URL de streaming de um episódio
  async getEpisodeStream(siteId: string, episodeId: string, episodeUrl: string): Promise<StreamingData> {
    const params = new URLSearchParams();
    params.append('episodeUrl', episodeUrl);
    
    const endpoint = `/api/episodes/${siteId}/${episodeId}/stream?${params.toString()}`;
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

// Sistema de vídeos de demonstração para episódios
const DEMO_VIDEOS = [
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny - Episódio de Demonstração',
    duration: '10:34'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'Elephants Dream - Episódio de Demonstração',
    duration: '10:53'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'For Bigger Blazes - Episódio de Demonstração',
    duration: '00:15'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'For Bigger Escapes - Episódio de Demonstração',
    duration: '00:15'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    title: 'Sintel - Episódio de Demonstração',
    duration: '14:48'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Subaru.mp4',
    title: 'Subaru - Episódio de Demonstração',
    duration: '00:30'
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    title: 'Tears of Steel - Episódio de Demonstração',
    duration: '12:14'
  }
];

// Função adapter para compatibilidade com EpisodeModal
export async function getEpisodeVideoUrl(animeTitle: string, episodeNumber: number, year?: number): Promise<string | null> {
  try {
    console.log(`🎬 Buscando vídeo de demonstração para: ${animeTitle} - Episódio ${episodeNumber}`);
    
    // Tentar buscar da API de scraping primeiro (se disponível)
    try {
      const searchResults = await searchScrapedAnimes(animeTitle);
      
      if (searchResults.length > 0) {
        const anime = searchResults[0];
        const episodes = await getScrapedAnimeEpisodes(anime.siteId, anime.id, anime.url);
        const episode = episodes.find(ep => ep.number === episodeNumber);
        
        if (episode) {
          const streamingData = await getScrapedEpisodeStream(anime.siteId, episode.id, episode.url);
          if (streamingData.streamingUrl) {
            console.log(`✅ URL de streaming real obtida da API de scraping`);
            return streamingData.streamingUrl;
          }
        }
      }
    } catch (scrapingError) {
      console.log('ℹ️ API de scraping não disponível, usando vídeo de demonstração');
    }
    
    // Usar vídeo de demonstração baseado no número do episódio
    const demoVideoIndex = (episodeNumber - 1) % DEMO_VIDEOS.length;
    const demoVideo = DEMO_VIDEOS[demoVideoIndex];
    
    console.log(`🎥 Usando vídeo de demonstração: ${demoVideo.title}`);
    console.log(`📺 Para usar episódios reais, configure uma API de streaming externa`);
    
    return demoVideo.url;
  } catch (error) {
    console.error('❌ Erro ao buscar vídeo:', error);
    
    // Fallback para o primeiro vídeo de demonstração
    console.log('🔄 Usando vídeo de demonstração como fallback');
    return DEMO_VIDEOS[0].url;
  }
}