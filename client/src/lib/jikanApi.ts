// Jikan API Integration (MyAnimeList unofficial API)
import type { Anime, Manga } from "@shared/schema";

// Base URL da Jikan API v4
const JIKAN_API_BASE = "https://api.jikan.moe/v4";

// Tipos específicos da API Jikan
interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_synonyms?: string[];
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  source?: string;
  episodes?: number;
  status?: string;
  airing?: boolean;
  aired?: {
    from?: string;
    to?: string;
    string?: string;
  };
  duration?: string;
  rating?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  season?: string;
  year?: number;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  studios?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

interface JikanManga {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_synonyms?: string[];
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  chapters?: number;
  volumes?: number;
  status?: string;
  publishing?: boolean;
  published?: {
    from?: string;
    to?: string;
    string?: string;
  };
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  authors?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  serializations?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

// Função auxiliar para fazer requisições com rate limiting
async function jikanRequest<T>(endpoint: string): Promise<T> {
  const url = `${JIKAN_API_BASE}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AnimePulse/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Rate limiting da Jikan API (3 requisições por segundo)
    await new Promise(resolve => setTimeout(resolve, 334));
    
    return data;
  } catch (error) {
    console.error(`Error fetching from Jikan API: ${url}`, error);
    throw error;
  }
}

// Função para converter anime Jikan para formato interno
function convertJikanAnimeToAnime(jikanAnime: JikanAnime): Anime {
  return {
    id: jikanAnime.mal_id.toString(),
    title: jikanAnime.title,
    image: jikanAnime.images.jpg.large_image_url || jikanAnime.images.jpg.image_url,
    studio: jikanAnime.studios?.[0]?.name || 'Estúdio desconhecido',
    year: jikanAnime.year || new Date(jikanAnime.aired?.from || '').getFullYear() || new Date().getFullYear(),
    genres: jikanAnime.genres?.map(g => g.name) || [],
    synopsis: jikanAnime.synopsis || 'Sinopse não disponível',
    releaseDate: jikanAnime.aired?.from || '',
    status: jikanAnime.status?.toLowerCase() || 'unknown',
    totalEpisodes: jikanAnime.episodes || 0,
    rating: jikanAnime.score?.toString() || '0',
    viewCount: jikanAnime.members || 0
  };
}

// Função para converter manga Jikan para formato interno
function convertJikanMangaToManga(jikanManga: JikanManga): Manga {
  return {
    id: jikanManga.mal_id.toString(),
    title: jikanManga.title,
    image: jikanManga.images.jpg.large_image_url || jikanManga.images.jpg.image_url,
    author: jikanManga.authors?.[0]?.name || 'Autor desconhecido',
    latestChapter: jikanManga.chapters || 0,
    genres: jikanManga.genres?.map(g => g.name) || [],
    synopsis: jikanManga.synopsis || 'Sinopse não disponível',
    status: jikanManga.status?.toLowerCase() || 'unknown',
    rating: jikanManga.score?.toString() || '0',
    year: new Date(jikanManga.published?.from || '').getFullYear() || new Date().getFullYear(),
    type: 'Manga',
    readCount: jikanManga.members || 0
  };
}

// Buscar animes trending/populares
export async function getJikanTrendingAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🔥 Fetching trending anime from Jikan API...");
    
    const response = await jikanRequest<JikanResponse<JikanAnime[]>>(`top/anime?type=tv&filter=airing&limit=${limit}`);
    
    if (response.data && Array.isArray(response.data)) {
      const animes = response.data.map(convertJikanAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} trending anime from Jikan`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching trending anime from Jikan:", error);
    return [];
  }
}

// Buscar top animes
export async function getJikanTopAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🏆 Fetching top anime from Jikan API...");
    
    const response = await jikanRequest<JikanResponse<JikanAnime[]>>(`top/anime?type=tv&limit=${limit}`);
    
    if (response.data && Array.isArray(response.data)) {
      const animes = response.data.map(convertJikanAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} top anime from Jikan`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching top anime from Jikan:", error);
    return [];
  }
}

// Buscar anime por ID
export async function getJikanAnimeById(id: string): Promise<Anime | null> {
  try {
    console.log(`🎯 Fetching anime details for ID: ${id} from Jikan...`);
    
    const response = await jikanRequest<JikanResponse<JikanAnime>>(`anime/${id}/full`);
    
    if (response.data) {
      const anime = convertJikanAnimeToAnime(response.data);
      console.log(`✅ Found anime details from Jikan: ${anime.title}`);
      return anime;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching anime ${id} from Jikan:`, error);
    return null;
  }
}

// Buscar animes por termo
export async function searchJikanAnime(query: string, limit: number = 25): Promise<Anime[]> {
  try {
    console.log(`🔍 Searching anime on Jikan: "${query}"`);
    
    const encodedQuery = encodeURIComponent(query);
    const response = await jikanRequest<JikanResponse<JikanAnime[]>>(`anime?q=${encodedQuery}&limit=${limit}&order_by=popularity`);
    
    if (response.data && Array.isArray(response.data)) {
      const animes = response.data.map(convertJikanAnimeToAnime);
      console.log(`✅ Found ${animes.length} anime results from Jikan`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Error searching anime on Jikan:`, error);
    return [];
  }
}

// Buscar top mangas
export async function getJikanTopManga(limit: number = 25): Promise<Manga[]> {
  try {
    console.log("📚 Fetching top manga from Jikan API...");
    
    const response = await jikanRequest<JikanResponse<JikanManga[]>>(`top/manga?limit=${limit}`);
    
    if (response.data && Array.isArray(response.data)) {
      const mangas = response.data.map(convertJikanMangaToManga);
      console.log(`✅ Fetched ${mangas.length} top manga from Jikan`);
      return mangas;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching top manga from Jikan:", error);
    return [];
  }
}

// Buscar manga por ID
export async function getJikanMangaById(id: string): Promise<Manga | null> {
  try {
    console.log(`📖 Fetching manga details for ID: ${id} from Jikan...`);
    
    const response = await jikanRequest<JikanResponse<JikanManga>>(`manga/${id}/full`);
    
    if (response.data) {
      const manga = convertJikanMangaToManga(response.data);
      console.log(`✅ Found manga details from Jikan: ${manga.title}`);
      return manga;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching manga ${id} from Jikan:`, error);
    return null;
  }
}

// Buscar mangas por termo
export async function searchJikanManga(query: string, limit: number = 25): Promise<Manga[]> {
  try {
    console.log(`🔍 Searching manga on Jikan: "${query}"`);
    
    const encodedQuery = encodeURIComponent(query);
    const response = await jikanRequest<JikanResponse<JikanManga[]>>(`manga?q=${encodedQuery}&limit=${limit}&order_by=popularity`);
    
    if (response.data && Array.isArray(response.data)) {
      const mangas = response.data.map(convertJikanMangaToManga);
      console.log(`✅ Found ${mangas.length} manga results from Jikan`);
      return mangas;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Error searching manga on Jikan:`, error);
    return [];
  }
}

// Buscar animes da temporada atual
export async function getJikanSeasonalAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🌸 Fetching seasonal anime from Jikan API...");
    
    const now = new Date();
    const year = now.getFullYear();
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const currentSeason = seasons[Math.floor((now.getMonth()) / 3)];
    
    const response = await jikanRequest<JikanResponse<JikanAnime[]>>(`seasons/${year}/${currentSeason}?limit=${limit}`);
    
    if (response.data && Array.isArray(response.data)) {
      const animes = response.data.map(convertJikanAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} seasonal anime from Jikan`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching seasonal anime from Jikan:", error);
    return [];
  }
}

// Função auxiliar para obter detalhes completos do anime para exibição
export async function getJikanAnimeDetails(id: string): Promise<Anime | null> {
  return await getJikanAnimeById(id);
}

// Função auxiliar para obter detalhes completos do manga para exibição  
export async function getJikanMangaDetails(id: string): Promise<Manga | null> {
  return await getJikanMangaById(id);
}