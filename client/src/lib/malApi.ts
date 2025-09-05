// MyAnimeList API Integration
import type { Anime, Manga } from "@shared/schema";

// Tipos específicos da API do MyAnimeList
interface MALAnime {
  id: number;
  title: string;
  main_picture?: {
    medium: string;
    large: string;
  };
  alternative_titles?: {
    synonyms?: string[];
    en?: string;
    ja?: string;
  };
  start_date?: string;
  end_date?: string;
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_episodes?: number;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  studios?: Array<{ id: number; name: string }>;
  rating?: string;
  media_type?: string;
  source?: string;
  statistics?: {
    num_list_users: number;
    status: {
      watching: number;
      completed: number;
      on_hold: number;
      dropped: number;
      plan_to_watch: number;
    };
  };
}

interface MALManga {
  id: number;
  title: string;
  main_picture?: {
    medium: string;
    large: string;
  };
  alternative_titles?: {
    synonyms?: string[];
    en?: string;
    ja?: string;
  };
  start_date?: string;
  end_date?: string;
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_chapters?: number;
  num_volumes?: number;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  authors?: Array<{ 
    node: { 
      id: number; 
      first_name: string; 
      last_name: string; 
    };
    role: string;
  }>;
  media_type?: string;
  serialization?: Array<{ node: { id: number; name: string } }>;
}

interface MALApiResponse<T> {
  data: Array<{ node: T; ranking?: { rank: number } }>;
  paging?: {
    next?: string;
    previous?: string;
  };
}

// Configuração da API
const MAL_API_BASE = 'https://api.myanimelist.net/v2';
const CLIENT_ID = '8c655cb39b399536ed320693e1074910';

// Headers padrão para requisições
const getHeaders = () => ({
  'X-MAL-CLIENT-ID': CLIENT_ID,
  'User-Agent': 'AnimePulse/1.0',
  'Accept': 'application/json',
});

// Cache para evitar muitas requisições
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Função para converter dados do MAL para nosso formato
function convertMALAnimeToLocal(malAnime: MALAnime): Anime {
  const firstStudio = malAnime.studios?.[0]?.name || 'Desconhecido';
  const year = malAnime.start_date ? new Date(malAnime.start_date).getFullYear() : undefined;
  const genres = malAnime.genres?.map(g => g.name) || [];
  
  return {
    id: malAnime.id.toString(),
    title: malAnime.title,
    image: malAnime.main_picture?.large || malAnime.main_picture?.medium || '',
    studio: firstStudio,
    year: year ?? null,
    genres,
    synopsis: malAnime.synopsis || '',
    releaseDate: malAnime.start_date || '',
    status: malAnime.status === 'finished_airing' ? 'completed' : 
             malAnime.status === 'currently_airing' ? 'ongoing' : 
             malAnime.status || 'unknown',
    totalEpisodes: malAnime.num_episodes || 0,
    rating: malAnime.rating || '',
    viewCount: malAnime.statistics?.num_list_users || 0,
  };
}

function convertMALMangaToLocal(malManga: MALManga): Manga {
  const firstAuthor = malManga.authors?.[0]?.node ? 
    `${malManga.authors[0].node.first_name} ${malManga.authors[0].node.last_name}`.trim() : 
    'Desconhecido';
  const genres = malManga.genres?.map(g => g.name) || [];
  
  return {
    id: malManga.id.toString(),
    title: malManga.title,
    image: malManga.main_picture?.large || malManga.main_picture?.medium || '',
    author: firstAuthor,
    latestChapter: malManga.num_chapters ?? null,
    genres,
    synopsis: malManga.synopsis || '',
    status: malManga.status === 'finished' ? 'completed' : 
             malManga.status === 'publishing' ? 'ongoing' : 
             malManga.status || 'unknown',
    rating: malManga.mean?.toString() || '',
  };
}

// Funções da API

export async function getMALTrendingAnime(limit: number = 25): Promise<Anime[]> {
  const cacheKey = `trending_anime_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📋 Using cached trending anime data');
    return cached;
  }

  try {
    console.log('🔥 Fetching trending anime from MyAnimeList...');
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_episodes', 'status', 'genres',
      'studios', 'rating', 'media_type', 'source', 'statistics'
    ].join(',');

    const url = `/api/mal/anime/trending?limit=${limit}`;
    console.log('🌐 MAL Proxy URL:', url);

    const response = await fetch(url);

    console.log('📡 MAL Response status:', response.status);
    console.log('📡 MAL Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MAL API Error Response:', errorText);
      throw new Error(`MAL API error: ${response.status} - ${errorText}`);
    }

    const data: MALApiResponse<MALAnime> = await response.json();
    console.log('📊 MAL Data received:', data);
    
    const animes = data.data.map(item => convertMALAnimeToLocal(item.node));
    
    setCachedData(cacheKey, animes);
    console.log(`✅ Fetched ${animes.length} trending anime from MAL`);
    
    return animes;
  } catch (error) {
    console.error('❌ Error fetching trending anime from MAL:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

export async function getMALTopAnime(limit: number = 25): Promise<Anime[]> {
  const cacheKey = `top_anime_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📋 Using cached top anime data');
    return cached;
  }

  try {
    console.log('🏆 Fetching top anime from MyAnimeList...');
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_episodes', 'status', 'genres',
      'studios', 'rating', 'media_type', 'source', 'statistics'
    ].join(',');

    const response = await fetch(`/api/mal/anime/top?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`MAL API error: ${response.status}`);
    }

    const data: MALApiResponse<MALAnime> = await response.json();
    const animes = data.data.map(item => convertMALAnimeToLocal(item.node));
    
    setCachedData(cacheKey, animes);
    console.log(`✅ Fetched ${animes.length} top anime from MAL`);
    
    return animes;
  } catch (error) {
    console.error('❌ Error fetching top anime from MAL:', error);
    return [];
  }
}

export async function getMALTopManga(limit: number = 25): Promise<Manga[]> {
  const cacheKey = `top_manga_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📋 Using cached top manga data');
    return cached;
  }

  try {
    console.log('📚 Fetching top manga from MyAnimeList...');
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_chapters', 'num_volumes', 'status',
      'genres', 'authors', 'media_type', 'serialization'
    ].join(',');

    const response = await fetch(`/api/mal/manga/top?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`MAL API error: ${response.status}`);
    }

    const data: MALApiResponse<MALManga> = await response.json();
    const mangas = data.data.map(item => convertMALMangaToLocal(item.node));
    
    setCachedData(cacheKey, mangas);
    console.log(`✅ Fetched ${mangas.length} top manga from MAL`);
    
    return mangas;
  } catch (error) {
    console.error('❌ Error fetching top manga from MAL:', error);
    return [];
  }
}

export async function getMALAnimeById(id: string): Promise<Anime | null> {
  const cacheKey = `anime_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📋 Using cached anime data for ID: ${id}`);
    return cached;
  }

  try {
    console.log(`🎯 Fetching anime details for ID: ${id} from MAL...`);
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_episodes', 'status', 'genres',
      'studios', 'rating', 'media_type', 'source', 'statistics'
    ].join(',');

    const response = await fetch(
      `${MAL_API_BASE}/anime/${id}?fields=${fields}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️ Anime not found with ID: ${id}`);
        return null;
      }
      throw new Error(`MAL API error: ${response.status}`);
    }

    const malAnime: MALAnime = await response.json();
    const anime = convertMALAnimeToLocal(malAnime);
    
    setCachedData(cacheKey, anime);
    console.log(`✅ Fetched anime details for: ${anime.title}`);
    
    return anime;
  } catch (error) {
    console.error(`❌ Error fetching anime details for ID ${id}:`, error);
    return null;
  }
}

export async function getMALMangaById(id: string): Promise<Manga | null> {
  const cacheKey = `manga_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📋 Using cached manga data for ID: ${id}`);
    return cached;
  }

  try {
    console.log(`🎯 Fetching manga details for ID: ${id} from MAL...`);
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_chapters', 'num_volumes', 'status',
      'genres', 'authors', 'media_type', 'serialization'
    ].join(',');

    const response = await fetch(
      `${MAL_API_BASE}/manga/${id}?fields=${fields}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️ Manga not found with ID: ${id}`);
        return null;
      }
      throw new Error(`MAL API error: ${response.status}`);
    }

    const malManga: MALManga = await response.json();
    const manga = convertMALMangaToLocal(malManga);
    
    setCachedData(cacheKey, manga);
    console.log(`✅ Fetched manga details for: ${manga.title}`);
    
    return manga;
  } catch (error) {
    console.error(`❌ Error fetching manga details for ID ${id}:`, error);
    return null;
  }
}

export async function searchMALAnime(query: string, limit: number = 10): Promise<Anime[]> {
  if (!query.trim()) return [];
  
  const cacheKey = `search_anime_${query}_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📋 Using cached search results for: ${query}`);
    return cached;
  }

  try {
    console.log(`🔍 Searching anime on MAL: ${query}`);
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_episodes', 'status', 'genres',
      'studios', 'rating', 'media_type'
    ].join(',');

    const response = await fetch(
      `${MAL_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`MAL API error: ${response.status}`);
    }

    const data: MALApiResponse<MALAnime> = await response.json();
    const animes = data.data.map(item => convertMALAnimeToLocal(item.node));
    
    setCachedData(cacheKey, animes);
    console.log(`✅ Found ${animes.length} anime results for: ${query}`);
    
    return animes;
  } catch (error) {
    console.error(`❌ Error searching anime: ${query}`, error);
    return [];
  }
}

export async function searchMALManga(query: string, limit: number = 10): Promise<Manga[]> {
  if (!query.trim()) return [];
  
  const cacheKey = `search_manga_${query}_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📋 Using cached manga search results for: ${query}`);
    return cached;
  }

  try {
    console.log(`🔍 Searching manga on MAL: ${query}`);
    
    const fields = [
      'id', 'title', 'main_picture', 'alternative_titles',
      'start_date', 'end_date', 'synopsis', 'mean', 'rank',
      'popularity', 'num_chapters', 'num_volumes', 'status',
      'genres', 'authors', 'media_type'
    ].join(',');

    const response = await fetch(
      `${MAL_API_BASE}/manga?q=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`MAL API error: ${response.status}`);
    }

    const data: MALApiResponse<MALManga> = await response.json();
    const mangas = data.data.map(item => convertMALMangaToLocal(item.node));
    
    setCachedData(cacheKey, mangas);
    console.log(`✅ Found ${mangas.length} manga results for: ${query}`);
    
    return mangas;
  } catch (error) {
    console.error(`❌ Error searching manga: ${query}`, error);
    return [];
  }
}