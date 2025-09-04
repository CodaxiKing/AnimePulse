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
const HIANIME_API_BASE = import.meta.env.VITE_HIANIME_API || "https://hianime-api.vercel.app";
const ANINEWS_API_BASE = import.meta.env.VITE_ANINEWS_API || "https://api.aninews.in";
const MANGAHOOK_API_BASE = import.meta.env.VITE_MANGAHOOK_API || "https://api.mangahook.de";

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
  return getAnimesByCategory('trending');
}

export async function getContinueWatching(): Promise<AnimeWithProgress[]> {
  // This would typically require user authentication
  return getAnimesByCategory('continue');
}

export async function getLatestAnime(): Promise<AnimeWithProgress[]> {
  return getAnimesByCategory('latest');
}

export async function getTopAnime(): Promise<AnimeWithProgress[]> {
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
  return mockMangas;
}

export async function getMangaCategories() {
  return mockMangaCategories;
}

// News API functions
export async function getLatestNews(): Promise<News[]> {
  // Para evitar erros de CORS e manter a aplicação funcionando,
  // retornamos diretamente os dados mock
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
