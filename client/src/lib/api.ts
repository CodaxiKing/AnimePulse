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
export async function getTrendingAnime(): Promise<AnimeWithProgress[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/top/anime`);
    if (response.ok) {
      const data = await response.json();
      const adaptedAnimes = data.data?.slice(0, 8).map(adaptAnimeFromJikanAPI) || [];
      return adaptedAnimes.length > 0 ? adaptedAnimes : getAnimesByCategory('trending');
    }
  } catch (error) {
    console.warn("Failed to fetch trending anime:", error);
  }
  return getAnimesByCategory('trending');
}

export async function getContinueWatching(): Promise<AnimeWithProgress[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/seasons/now?limit=8`);
    if (response.ok) {
      const data = await response.json();
      const adaptedAnimes = data.data?.slice(0, 8).map((anime: any) => ({
        ...adaptAnimeFromJikanAPI(anime),
        progress: {
          id: Math.random().toString(),
          userId: "1",
          animeId: anime.mal_id?.toString(),
          episodeNumber: Math.floor(Math.random() * 12) + 1,
          progressPercent: Math.floor(Math.random() * 80) + 20,
          updatedAt: new Date()
        }
      })) || [];
      return adaptedAnimes.length > 0 ? adaptedAnimes : getAnimesByCategory('continue');
    }
  } catch (error) {
    console.warn("Failed to fetch continue watching:", error);
  }
  return getAnimesByCategory('continue');
}

export async function getLatestAnime(): Promise<AnimeWithProgress[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/seasons/now`);
    if (response.ok) {
      const data = await response.json();
      const adaptedAnimes = data.data?.slice(0, 8).map(adaptAnimeFromJikanAPI) || [];
      return adaptedAnimes.length > 0 ? adaptedAnimes : getAnimesByCategory('latest');
    }
  } catch (error) {
    console.warn("Failed to fetch latest anime:", error);
  }
  return getAnimesByCategory('latest');
}

export async function getTopAnime(): Promise<AnimeWithProgress[]> {
  try {
    const response = await fetch(`${ANINEWS_API_BASE}/top/anime?type=tv&limit=10`);
    if (response.ok) {
      const data = await response.json();
      const adaptedAnimes = data.data?.slice(0, 10).map(adaptAnimeFromJikanAPI) || [];
      return adaptedAnimes.length > 0 ? adaptedAnimes : getAnimesByCategory('trending');
    }
  } catch (error) {
    console.warn("Failed to fetch top anime:", error);
  }
  return getAnimesByCategory('trending');
}

export async function getAnimeByIdAPI(id: string): Promise<AnimeWithProgress | undefined> {
  return getAnimeById(id);
}

export async function getEpisodesByAnimeIdAPI(animeId: string): Promise<Episode[]> {
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
    url: apiEpisode.url || apiEpisode.video_url,
    duration: apiEpisode.duration || 24,
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
