import type { Anime, Episode, Manga, News, AnimeWithProgress, PostWithUser } from "@shared/schema";
import { 
  mockAnimes, 
  mockEpisodes, 
  mockMangas, 
  mockNews, 
  mockMangaCategories,
  getAnimesWithProgress,
  getPostsWithUsers,
  getAnimesByCategory,
  getEpisodesByAnimeId,
  getAnimeById
} from "./mock-data";

// API configuration
const HIANIME_API_BASE = import.meta.env.VITE_HIANIME_API || "https://hianime-api-pi.vercel.app/api/v2";
const ANINEWS_API_BASE = import.meta.env.VITE_ANINEWS_API || "https://api.jikan.moe/v4";
const OTAKUDESU_API_BASE = import.meta.env.VITE_OTAKUDESU_API || "https://unofficial-otakudesu-api-ruang-kreatif.vercel.app/api";
const MANGAHOOK_API_BASE = import.meta.env.VITE_MANGAHOOK_API || "https://api.jikan.moe/v4";

// Generic fetch with error handling
async function fetchWithFallback<T>(url: string, fallbackData: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`API call failed for ${url}:`, error);
    return fallbackData;
  }
}

// Anime API functions
// Cache global para evitar múltiplas chamadas de API
let apiCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minuto

// Função para buscar animes com múltiplas fontes
async function getAnimeDataFromAPI(): Promise<any[]> {
  const now = Date.now();
  
  // Se o cache ainda é válido, usar ele
  if (apiCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log("📦 Using cached API data");
    return apiCache;
  }
  
  // Tentar múltiplas APIs em ordem de prioridade
  const apiEndpoints = [
    `${ANINEWS_API_BASE}/top/anime?limit=25`,
    `${ANINEWS_API_BASE}/seasons/now?limit=25`,
    `${ANINEWS_API_BASE}/anime?order_by=popularity&limit=25`
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log("🌐 Trying endpoint:", endpoint);
      const response = await fetch(endpoint);
      console.log("📡 API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.data && data.data.length > 0) {
          apiCache = data.data;
          cacheTimestamp = now;
          console.log("✅ Cached", apiCache?.length || 0, "animes from", endpoint);
          return apiCache || [];
        }
      }
      
      // Aguardar um pouco antes da próxima tentativa para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn("❌ Failed endpoint:", endpoint, error);
    }
  }
  
  console.log("⚠️ All API endpoints failed, trying Otakudesu API...");
  
  // Tentar API do Otakudesu como último recurso
  try {
    const otakuData = await getOtakudesuData().catch(err => {
      console.warn("❌ Otakudesu API promise rejected:", err instanceof Error ? err.message : String(err));
      return [];
    });
    
    if (otakuData && otakuData.length > 0) {
      // Adaptar dados do Otakudesu para o formato esperado
      const adaptedData = otakuData.map(adaptAnimeFromOtakudesuAPI);
      apiCache = adaptedData;
      cacheTimestamp = now;
      console.log("✅ Using Otakudesu API data:", adaptedData.length, "animes");
      return adaptedData;
    }
  } catch (error) {
    console.warn("❌ Otakudesu API also failed:", error instanceof Error ? error.message : String(error));
  }
  
  console.log("⚠️ All APIs failed, using fallback data");
  return [];
}

export async function getTrendingAnime(): Promise<AnimeWithProgress[]> {
  console.log("🔍 Getting trending anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const trendingAnimes = apiData.slice(0, 8).map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning", trendingAnimes.length, "trending animes from API cache");
    return trendingAnimes;
  }
  
  return getAnimesByCategory('trending');
}

export async function getContinueWatching(): Promise<AnimeWithProgress[]> {
  console.log("🔄 Getting continue watching anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    const continueAnimes = apiData.slice(8, 12).map((anime: any) => {
      // Verificar se os dados são do Jikan API ou Otakudesu
      const isJikanData = anime?.mal_id !== undefined;
      const adaptedAnime = {
        ...(isJikanData ? adaptAnimeFromJikanAPI(anime) : anime),
        progress: {
          id: Math.random().toString(),
          userId: "1",
          animeId: anime.mal_id?.toString() || anime.id?.toString() || Math.random().toString(),
          episodeNumber: Math.floor(Math.random() * 12) + 1,
          progressPercent: Math.floor(Math.random() * 80) + 20,
          updatedAt: new Date()
        }
      };
      console.log("🎯 Continue watching:", adaptedAnime.title, "Image:", adaptedAnime.image?.substring(0, 50) + "...");
      return adaptedAnime;
    });
    console.log("✅ Returning", continueAnimes.length, "continue watching animes from API cache");
    return continueAnimes;
  }
  
  return getAnimesByCategory('continue');
}

export async function getLatestAnime(): Promise<AnimeWithProgress[]> {
  console.log("🆕 Getting latest anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const latestAnimes = apiData.slice(4, 12).map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning", latestAnimes.length, "latest animes from API cache");
    return latestAnimes;
  }
  
  return getAnimesByCategory('latest');
}

export async function getTopAnime(): Promise<AnimeWithProgress[]> {
  console.log("🏆 Getting top 10 anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const topAnimes = apiData.slice(12, 22).map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning", topAnimes.length, "top animes from API cache");
    return topAnimes;
  }
  
  return getAnimesByCategory('trending');
}

export async function getAnimeByIdAPI(id: string): Promise<AnimeWithProgress | undefined> {
  try {
    console.log("📺 Getting anime details for ID:", id);
    
    // Primeiro tentar buscar da API do Otakudesu
    const otakuResponse = await fetch(`${OTAKUDESU_API_BASE}/anime/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (otakuResponse.ok) {
      const otakuData = await otakuResponse.json();
      console.log("✅ Found anime details from Otakudesu API");
      
      if (otakuData) {
        return {
          id: otakuData.id || id,
          title: otakuData.title || "Sem título",
          image: otakuData.thumb || "https://via.placeholder.com/400x600",
          studio: otakuData.studio || "Estúdio desconhecido",
          year: parseInt(otakuData.release_year) || new Date().getFullYear(),
          genres: Array.isArray(otakuData.genre) ? otakuData.genre : [],
          synopsis: otakuData.synopsis || "Sinopse não disponível",
          releaseDate: otakuData.release_date || "",
          status: otakuData.status?.toLowerCase() || "ongoing",
          totalEpisodes: parseInt(otakuData.total_episode) || 0,
          rating: otakuData.rating || "0",
        };
      }
    }
    
    // Fallback para Jikan API se o ID for numérico (MAL ID)
    if (!isNaN(Number(id))) {
      const jikanResponse = await fetch(`${ANINEWS_API_BASE}/anime/${id}`);
      if (jikanResponse.ok) {
        const jikanData = await jikanResponse.json();
        console.log("✅ Found anime details from Jikan API");
        
        if (jikanData?.data) {
          return adaptAnimeFromJikanAPI(jikanData.data);
        }
      }
    }
    
    console.log("⚠️ No anime found in APIs, using mock data fallback");
  } catch (error) {
    console.warn("❌ Error fetching anime details:", error instanceof Error ? error.message : String(error));
  }
  
  // Fallback para dados mock
  return getAnimeById(id);
}

export async function getEpisodesByAnimeIdAPI(animeId: string): Promise<Episode[]> {
  try {
    console.log("🎬 Getting episodes for anime ID:", animeId);
    
    // Tentar buscar da API do Otakudesu
    const otakuResponse = await fetch(`${OTAKUDESU_API_BASE}/anime/${animeId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (otakuResponse.ok) {
      const otakuData = await otakuResponse.json();
      console.log("✅ Found anime data from Otakudesu API for episodes");
      
      if (otakuData?.episode_list && Array.isArray(otakuData.episode_list)) {
        const episodes = otakuData.episode_list.map((ep: any, index: number) => ({
          id: ep.id || `${animeId}-ep-${index + 1}`,
          animeId: animeId,
          number: ep.episode || index + 1,
          title: ep.title || `Episódio ${index + 1}`,
          thumbnail: ep.thumb || "https://via.placeholder.com/600x300",
          duration: ep.duration || "24 min",
          releaseDate: ep.date || new Date().toISOString(),
          streamingUrl: ep.stream_url || "",
          downloadUrl: ep.download_url || "",
        }));
        
        console.log("✅ Returning", episodes.length, "episodes from Otakudesu API");
        return episodes;
      }
    }
    
    console.log("⚠️ No episodes found in API, using mock data fallback");
  } catch (error) {
    console.warn("❌ Error fetching episodes:", error instanceof Error ? error.message : String(error));
  }
  
  // Fallback para dados mock
  return getEpisodesByAnimeId(animeId);
}

// Manga API functions
export async function getLatestManga(): Promise<Manga[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/top/manga?limit=12`);
    if (response.ok) {
      const data = await response.json();
      const adaptedMangas = data.data?.slice(0, 12).map(adaptMangaFromJikanAPI) || [];
      return adaptedMangas.length > 0 ? adaptedMangas : mockMangas;
    }
  } catch (error) {
    console.warn("Failed to fetch latest manga:", error);
  }
  return mockMangas;
}

export async function getMangaCategories() {
  return mockMangaCategories;
}

// News API functions
export async function getLatestNews(): Promise<News[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/top/anime?limit=4`);
    if (response.ok) {
      const data = await response.json();
      const adaptedNews = data.data?.slice(0, 4).map(adaptNewsFromJikanAPI) || [];
      return adaptedNews.length > 0 ? adaptedNews : mockNews;
    }
  } catch (error) {
    console.warn("Failed to fetch latest news:", error);
  }
  return mockNews;
}

export async function getNewsByCategory(category: string): Promise<News[]> {
  return mockNews.filter(news => news.category === category);
}

// Social API functions
export async function getSocialPosts(): Promise<PostWithUser[]> {
  return getPostsWithUsers();
}

export async function getActiveUsers() {
  const { mockUsers } = await import("./mock-data");
  return mockUsers.filter(user => user.online);
}

// Search function
export function searchContent(query: string) {
  const lowercaseQuery = query.toLowerCase();
  
  const animes = mockAnimes.filter(anime =>
    anime.title.toLowerCase().includes(lowercaseQuery) ||
    anime.genres?.some(genre => genre.toLowerCase().includes(lowercaseQuery)) ||
    anime.studio?.toLowerCase().includes(lowercaseQuery)
  );
  
  const mangas = mockMangas.filter(manga =>
    manga.title.toLowerCase().includes(lowercaseQuery) ||
    manga.author?.toLowerCase().includes(lowercaseQuery) ||
    manga.genres?.some(genre => genre.toLowerCase().includes(lowercaseQuery))
  );
  
  const news = mockNews.filter(newsItem =>
    newsItem.title.toLowerCase().includes(lowercaseQuery) ||
    newsItem.summary?.toLowerCase().includes(lowercaseQuery) ||
    newsItem.category.toLowerCase().includes(lowercaseQuery)
  );
  
  return { animes, mangas, news };
}

// Adapter functions to transform API responses to our schema
function adaptAnimeFromAPI(apiAnime: any): AnimeWithProgress {
  return {
    id: apiAnime.id || apiAnime.mal_id?.toString(),
    title: apiAnime.title || apiAnime.name,
    image: apiAnime.image || apiAnime.poster || apiAnime.images?.jpg?.large_image_url,
    studio: apiAnime.studio || apiAnime.studios?.[0]?.name,
    year: apiAnime.year || apiAnime.aired?.prop?.from?.year,
    genres: apiAnime.genres?.map((g: any) => g.name || g) || [],
    synopsis: apiAnime.synopsis || apiAnime.description,
    releaseDate: apiAnime.releaseDate || apiAnime.aired?.string,
    status: apiAnime.status?.toLowerCase() || "unknown",
    totalEpisodes: apiAnime.episodes || apiAnime.episodeCount,
    rating: apiAnime.rating || apiAnime.score?.toString(),
  };
}

// Adapter for Jikan API anime data
// Função para buscar dados da API do Otakudesu
async function getOtakudesuData(): Promise<any[]> {
  try {
    console.log("🌐 Trying Otakudesu API...");
    
    // Primeiro tentar a API da home page que tem todos os animes
    const homeResponse = await fetch(`${OTAKUDESU_API_BASE}/home`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (homeResponse.ok) {
      const homeData = await homeResponse.json();
      console.log("📡 Otakudesu home response status:", homeResponse.status);
      
      // Verificar se tem dados na home
      if (homeData?.ongoing?.length > 0) {
        console.log("✅ Found", homeData.ongoing.length, "ongoing animes from Otakudesu");
        return homeData.ongoing;
      }
      
      if (homeData?.complete?.length > 0) {
        console.log("✅ Found", homeData.complete.length, "complete animes from Otakudesu");
        return homeData.complete;
      }
    } else {
      console.log("📡 Otakudesu home response failed:", homeResponse.status, homeResponse.statusText);
    }
    
    // Fallback: tentar endpoint ongoing diretamente
    const ongoingResponse = await fetch(`${OTAKUDESU_API_BASE}/ongoing`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (ongoingResponse.ok) {
      const ongoingData = await ongoingResponse.json();
      console.log("📡 Otakudesu ongoing response status:", ongoingResponse.status);
      
      if (ongoingData?.results?.length > 0) {
        console.log("✅ Found", ongoingData.results.length, "animes from Otakudesu ongoing");
        return ongoingData.results;
      }
    }
    
    console.log("⚠️ No data found from Otakudesu API");
    return [];
  } catch (error) {
    console.warn("❌ Otakudesu API error:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Função para adaptar dados da API do Otakudesu
function adaptAnimeFromOtakudesuAPI(otakuAnime: any): AnimeWithProgress {
  return {
    id: otakuAnime.id || otakuAnime.slug || Math.random().toString(),
    title: otakuAnime.title || otakuAnime.anime_title || "Sem título",
    image: otakuAnime.thumb || otakuAnime.poster || "https://via.placeholder.com/400x600",
    studio: otakuAnime.studio || "Estúdio desconhecido",
    year: parseInt(otakuAnime.release_year) || new Date().getFullYear(),
    genres: Array.isArray(otakuAnime.genres) ? otakuAnime.genres : [],
    synopsis: otakuAnime.synopsis || otakuAnime.description || "Sinopse não disponível",
    releaseDate: otakuAnime.release_date || otakuAnime.updated_on || "",
    status: otakuAnime.status?.toLowerCase() || "ongoing",
    totalEpisodes: parseInt(otakuAnime.total_episode) || 0,
    rating: otakuAnime.rating || "0",
  };
}

function adaptAnimeFromJikanAPI(jikanAnime: any): AnimeWithProgress {
  return {
    id: jikanAnime.mal_id?.toString() || Math.random().toString(),
    title: jikanAnime.title || jikanAnime.title_english || "Sem título",
    image: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url || "https://via.placeholder.com/400x600",
    studio: jikanAnime.studios?.[0]?.name || "Estúdio desconhecido",
    year: jikanAnime.aired?.prop?.from?.year || new Date().getFullYear(),
    genres: jikanAnime.genres?.map((g: any) => g.name) || [],
    synopsis: jikanAnime.synopsis || "Sinopse não disponível",
    releaseDate: jikanAnime.aired?.string || "",
    status: jikanAnime.status?.toLowerCase() || "unknown",
    totalEpisodes: jikanAnime.episodes || 0,
    rating: jikanAnime.score?.toString() || "0",
  };
}

function adaptEpisodeFromAPI(apiEpisode: any): Episode {
  return {
    id: apiEpisode.id || apiEpisode.mal_id?.toString(),
    animeId: apiEpisode.animeId,
    number: apiEpisode.number || apiEpisode.episode,
    title: apiEpisode.title || apiEpisode.name,
    thumbnail: apiEpisode.thumbnail || apiEpisode.image,
    duration: apiEpisode.duration ? `${apiEpisode.duration} min` : "24 min",
    releaseDate: apiEpisode.releaseDate || null,
    streamingUrl: apiEpisode.url || apiEpisode.video_url || null,
    downloadUrl: apiEpisode.download_url || null,
  };
}

function adaptMangaFromAPI(apiManga: any): Manga {
  return {
    id: apiManga.id || apiManga.mal_id?.toString(),
    title: apiManga.title || apiManga.name,
    image: apiManga.image || apiManga.cover || apiManga.images?.jpg?.large_image_url,
    author: apiManga.author || apiManga.authors?.[0]?.name,
    latestChapter: apiManga.latestChapter || apiManga.chapters,
    genres: apiManga.genres?.map((g: any) => g.name || g) || [],
    synopsis: apiManga.synopsis || apiManga.description,
    status: apiManga.status?.toLowerCase() || "unknown",
    rating: apiManga.rating || apiManga.score?.toString(),
  };
}

// Adapter for Jikan API manga data
function adaptMangaFromJikanAPI(jikanManga: any): Manga {
  return {
    id: jikanManga.mal_id?.toString() || Math.random().toString(),
    title: jikanManga.title || jikanManga.title_english || "Sem título",
    image: jikanManga.images?.jpg?.large_image_url || jikanManga.images?.jpg?.image_url || "https://via.placeholder.com/400x600",
    author: jikanManga.authors?.[0]?.name || "Autor desconhecido",
    latestChapter: jikanManga.chapters || 0,
    genres: jikanManga.genres?.map((g: any) => g.name) || [],
    synopsis: jikanManga.synopsis || "Sinopse não disponível",
    status: jikanManga.status?.toLowerCase() || "unknown",
    rating: jikanManga.score?.toString() || "0",
  };
}

function adaptNewsFromAPI(apiNews: any): News {
  return {
    id: apiNews.id?.toString(),
    title: apiNews.title || apiNews.headline,
    image: apiNews.image || apiNews.thumbnail,
    category: apiNews.category || "general",
    summary: apiNews.summary || apiNews.excerpt,
    content: apiNews.content || apiNews.body,
    source: apiNews.source || "External",
    publishedAt: new Date(apiNews.publishedAt || apiNews.published_at || Date.now()),
  };
}

// Adapter for Jikan API news data (using anime data as news)
function adaptNewsFromJikanAPI(jikanAnime: any): News {
  const categories = ["anime", "manga", "geek", "cosplay"];
  return {
    id: jikanAnime.mal_id?.toString() || Math.random().toString(),
    title: `Novidades sobre ${jikanAnime.title || "Anime"}`,
    image: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url || "https://via.placeholder.com/400x200",
    category: categories[Math.floor(Math.random() * categories.length)],
    summary: `Confira as últimas novidades sobre ${jikanAnime.title}. ${jikanAnime.synopsis?.slice(0, 100) || "Mais detalhes disponíveis"}...`,
    content: jikanAnime.synopsis || "Conteúdo completo da notícia...",
    source: "AnimePulse",
    publishedAt: new Date(jikanAnime.aired?.from || Date.now()),
  };
}
