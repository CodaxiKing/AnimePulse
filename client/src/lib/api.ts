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
const KITSU_API_BASE = "https://kitsu.io/api/edge";
const ANIME_TV_API_BASE = "https://appanimeplus.tk/api-achance.php";
const OTAKUDESU_API_BASE = import.meta.env.VITE_OTAKUDESU_API || "https://unofficial-otakudesu-api-ruang-kreatif.vercel.app/api";
const JIKAN_API_BASE = "https://api.jikan.moe/v4"; // Fallback

// Dicionário de traduções comuns de sinopses de anime
const synopsisTranslations: Record<string, string> = {
  "Humanity fights for survival against giant humanoid Titans": "A humanidade luta pela sobrevivência contra Titãs humanoides gigantes que ameaçam a existência da civilização.",
  "Students battle cursed spirits to protect humanity": "Estudantes lutam contra espíritos amaldiçoados para proteger a humanidade.",
  "A young boy becomes a demon slayer to save his sister": "Um jovem garoto se torna um caçador de demônios para salvar sua irmã.",
  "Two teenagers share a profound, magical connection": "Dois adolescentes compartilham uma conexão profunda e mágica.",
  "A high school student discovers a supernatural notebook": "Um estudante do ensino médio descobre um caderno sobrenatural.",
  "A young ninja seeks recognition and dreams of becoming Hokage": "Um jovem ninja busca reconhecimento e sonha em se tornar Hokage.",
  "In a world of superpowers, a quirkless boy dreams of becoming a hero": "Em um mundo de superpoderes, um garoto sem habilidades sonha em se tornar um herói.",
  "A young devil hunter with chainsaw powers fights demons": "Um jovem caçador de demônios com poderes de motosserra luta contra demônios."
};

// Função para traduzir e melhorar sinopses em português
function improveSynopsisInPortuguese(synopsis: string | null | undefined): string {
  if (!synopsis || synopsis.trim() === '') {
    return 'Sinopse não disponível';
  }
  
  // Verifica se há tradução direta disponível
  const directTranslation = synopsisTranslations[synopsis.trim()];
  if (directTranslation) {
    return directTranslation;
  }
  
  // Limpeza e melhorias básicas
  let improved = synopsis
    .replace(/\[.*?\]/g, '') // Remove colchetes
    .replace(/\(.*?\)/g, '') // Remove parênteses informativos  
    .replace(/Source:.*$/gim, '') // Remove "Source: ..."
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
  
  // Traduções básicas de termos comuns
  improved = improved
    .replace(/\bHigh School\b/gi, 'Ensino Médio')
    .replace(/\bMiddle School\b/gi, 'Ensino Fundamental')
    .replace(/\bstudent\b/gi, 'estudante')
    .replace(/\bstudents\b/gi, 'estudantes')
    .replace(/\byoung\b/gi, 'jovem')
    .replace(/\bboy\b/gi, 'garoto')
    .replace(/\bgirl\b/gi, 'garota')
    .replace(/\bworld\b/gi, 'mundo')
    .replace(/\bfight\b/gi, 'luta')
    .replace(/\bfights\b/gi, 'luta')
    .replace(/\bbattle\b/gi, 'batalha')
    .replace(/\bbattles\b/gi, 'batalha')
    .replace(/\bpower\b/gi, 'poder')
    .replace(/\bpowers\b/gi, 'poderes')
    .replace(/\bmagic\b/gi, 'magia')
    .replace(/\bmagical\b/gi, 'mágico')
    .replace(/\bhero\b/gi, 'herói')
    .replace(/\bheroes\b/gi, 'heróis')
    .replace(/\bvillain\b/gi, 'vilão')
    .replace(/\bvillains\b/gi, 'vilões')
    .replace(/\bfriend\b/gi, 'amigo')
    .replace(/\bfriends\b/gi, 'amigos')
    .replace(/\bfamily\b/gi, 'família')
    .replace(/\bschool\b/gi, 'escola')
    .replace(/\bteacher\b/gi, 'professor')
    .replace(/\bteachers\b/gi, 'professores');
  
  // Se ainda está em inglês e é muito longo, usa fallback genérico
  if (improved.length > 100 && /^[a-zA-Z\s.,!?]+$/.test(improved)) {
    return 'Uma emocionante história de aventura, amizade e superação que cativa espectadores de todas as idades.';
  }
  
  return improved;
}

// Função para buscar animes via Kitsu API
export async function getAnimesFromKitsuAPI(endpoint: string, limit: number = 25): Promise<Anime[]> {
  const kitsuUrl = `${KITSU_API_BASE}/${endpoint}?page[limit]=${limit}`;
  console.log('🌐 Trying Kitsu endpoint:', kitsuUrl);
  
  try {
    const response = await fetch(kitsuUrl, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📡 Kitsu API Response status:', response.status);
      
      if (data.data && Array.isArray(data.data)) {
        const animes = data.data.map(adaptAnimeFromKitsuAPI);
        console.log(`✅ Retrieved ${animes.length} animes from Kitsu API`);
        return animes;
      }
    }
  } catch (error) {
    console.error('❌ Kitsu API Error:', error);
  }
  
  return [];
}

// Função para buscar episódios com streaming do Anime TV API
export async function getEpisodesWithStreamingAPI(animeId: string): Promise<Episode[]> {
  try {
    console.log('🎬 Getting episodes with streaming for anime:', animeId);
    
    // Busca informações do anime no Anime TV API
    const searchUrl = `${ANIME_TV_API_BASE}?search=${encodeURIComponent(animeId)}`;
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0) {
        const animeData = data[0]; // Pega o primeiro resultado
        
        // Busca episódios
        const episodesUrl = `${ANIME_TV_API_BASE}?episodios=${animeData.id}`;
        const episodesResponse = await fetch(episodesUrl);
        
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          const episodes = episodesData.map(adaptEpisodeFromAnimeTVAPI);
          
          console.log(`✅ Retrieved ${episodes.length} episodes with streaming`);
          return episodes;
        }
      }
    }
  } catch (error) {
    console.error('❌ Anime TV API Error:', error);
  }
  
  // Fallback para dados mock
  console.log('⚠️ Using fallback episodes for anime:', animeId);
  return getEpisodesByAnimeId(animeId);
}

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
    `${JIKAN_API_BASE}/top/anime?limit=25`,
    `${JIKAN_API_BASE}/seasons/now?limit=25`,
    `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25`
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
    return getAnimesWithProgress(trendingAnimes);
  }
  
  return getAnimesByCategory('trending');
}

export async function getContinueWatching(): Promise<AnimeWithProgress[]> {
  console.log("🔄 Getting continue watching anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const continueAnimes = apiData.slice(8, 12).map((anime: any) => {
      const adaptedAnime = isJikanData ? adaptAnimeFromJikanAPI(anime) : anime;
      // Garantir que a imagem seja preservada
      console.log("🎯 Continue watching anime:", adaptedAnime.title, "Image URL:", adaptedAnime.image?.substring(0, 50) + "...");
      return {
        ...adaptedAnime,
        progress: {
          id: Math.random().toString(),
          userId: "1",
          animeId: anime.mal_id?.toString() || anime.id?.toString() || Math.random().toString(),
          episodeNumber: Math.floor(Math.random() * 12) + 1,
          progressPercent: Math.floor(Math.random() * 80) + 20,
          updatedAt: new Date()
        }
      };
    });
    console.log("✅ Returning", continueAnimes.length, "continue watching animes from API cache with images");
    return continueAnimes;
  }
  
  console.log("⚠️ No API data found, using trending data as fallback for continue watching");
  // Se não tiver dados da API, usar os mesmos dados do trending
  const trendingData = await getTrendingAnime();
  return trendingData.slice(0, 4).map(anime => ({
    ...anime,
    progress: {
      id: Math.random().toString(),
      userId: "1",
      animeId: anime.id,
      episodeNumber: Math.floor(Math.random() * 12) + 1,
      progressPercent: Math.floor(Math.random() * 80) + 20,
      updatedAt: new Date()
    }
  }));
}

export async function getLatestAnime(): Promise<AnimeWithProgress[]> {
  console.log("🆕 Getting latest anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const latestAnimes = apiData.slice(16, 24).map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning", latestAnimes.length, "latest animes from API cache with images");
    return getAnimesWithProgress(latestAnimes);
  }
  
  console.log("⚠️ No API data found, using trending data as fallback for latest");
  // Se não tiver dados da API, usar os mesmos dados do trending
  const trendingData = await getTrendingAnime();
  return getAnimesWithProgress(trendingData.slice(4, 8));
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

export async function getAnimeByIdAPI(id: string): Promise<AnimeWithProgress> {
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
      const jikanResponse = await fetch(`${JIKAN_API_BASE}/anime/${id}`);
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
  
  // Fallback para dados mock - sempre retorna um anime válido
  const mockAnime = getAnimeById(id);
  if (mockAnime) {
    return mockAnime;
  }
  
  // Se nem os dados mock existem, retorna um anime padrão
  return {
    id: id,
    title: "Anime não encontrado",
    image: "https://via.placeholder.com/400x600",
    studio: "Desconhecido",
    year: new Date().getFullYear(),
    genres: ["Desconhecido"],
    synopsis: "Detalhes do anime não disponíveis no momento.",
    releaseDate: "",
    status: "unknown",
    totalEpisodes: 0,
    rating: "0",
  };
}

export async function getEpisodesByAnimeIdAPI(animeId: string): Promise<Episode[]> {
  try {
    console.log("🎬 Getting episodes for anime ID:", animeId);
    
    // Primeiro, buscar dados do anime para obter informações como número total de episódios
    const anime = await getAnimeByIdAPI(animeId);
    const totalEpisodes = anime.totalEpisodes || 12;
    
    // Lista de títulos realistas para episódios
    const episodeTitles = [
      "O Início da Jornada",
      "Primeiros Passos",
      "O Despertar do Poder",
      "Encontro Fatídico",
      "Revelações",
      "Batalha Decisiva",
      "Novos Aliados",
      "O Segredo Revelado",
      "Confronto Final",
      "Uma Nova Esperança",
      "Lágrimas e Sorrisos",
      "O Verdadeiro Inimigo",
      "Força Interior",
      "Sacrifício",
      "O Passado Revelado",
      "Coração Partido",
      "Renascimento",
      "A Verdade Oculta",
      "Última Chance",
      "Destino Selado",
      "Luz na Escuridão",
      "Farewell",
      "Novo Começo",
      "Para Sempre"
    ];

    // Gerar episódios realistas com base nos dados do anime
    const episodes: Episode[] = [];
    
    for (let i = 1; i <= Math.min(totalEpisodes, 24); i++) {
      const episodeTitle = episodeTitles[i - 1] || `Aventura Continua`;
      episodes.push({
        id: `${animeId}-ep-${i}`,
        animeId: animeId,
        number: i,
        title: `Episódio ${i} - ${episodeTitle}`,
        thumbnail: anime.image || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop",
        duration: "24 min",
        releaseDate: new Date(Date.now() - (totalEpisodes - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        // URLs de vídeo de demonstração (Big Buck Bunny - vídeo de teste público)
        streamingUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        downloadUrl: `https://example.com/download/${animeId}-ep-${i}.mp4`,
      });
    }
    
    console.log("✅ Generated", episodes.length, "realistic episodes with streaming URLs");
    return episodes;
    
  } catch (error) {
    console.warn("❌ Error generating episodes:", error instanceof Error ? error.message : String(error));
  }
  
  // Fallback para dados mock
  return getEpisodesByAnimeId(animeId);
}

// Manga API functions
export async function getLatestManga(): Promise<Manga[]> {
  try {
    const response = await fetch(`${JIKAN_API_BASE}/top/manga?limit=12`);
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
    const response = await fetch(`${JIKAN_API_BASE}/top/anime?limit=4`);
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
    synopsis: improveSynopsisInPortuguese(otakuAnime.synopsis || otakuAnime.description),
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
    synopsis: improveSynopsisInPortuguese(jikanAnime.synopsis),
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

// Adapter para dados da Kitsu API
function adaptAnimeFromKitsuAPI(kitsuAnime: any): Anime {
  const attributes = kitsuAnime.attributes || {};
  return {
    id: kitsuAnime.id || Math.random().toString(),
    title: attributes.titles?.en || attributes.titles?.en_jp || attributes.canonicalTitle || "Sem título",
    image: attributes.posterImage?.large || attributes.posterImage?.medium || "https://via.placeholder.com/400x600",
    studio: "Estúdios Diversos", // Kitsu não tem campo direto para estúdio
    year: attributes.startDate ? new Date(attributes.startDate).getFullYear() : new Date().getFullYear(),
    genres: attributes.categories?.data?.map((cat: any) => cat.attributes?.title) || [],
    synopsis: improveSynopsisInPortuguese(attributes.synopsis),
    releaseDate: attributes.startDate || "",
    status: attributes.status?.toLowerCase() || "unknown",
    totalEpisodes: attributes.episodeCount || 0,
    rating: attributes.averageRating || "0",
  };
}

// Adapter para episódios da Anime TV API
function adaptEpisodeFromAnimeTVAPI(episodeData: any): Episode {
  return {
    id: episodeData.id?.toString() || Math.random().toString(),
    animeId: episodeData.anime_id?.toString() || "1",
    number: parseInt(episodeData.episode_number) || 1,
    title: episodeData.title || `Episódio ${episodeData.episode_number || 1}`,
    thumbnail: episodeData.image || "https://via.placeholder.com/400x225",
    duration: episodeData.duration || "24 min",
    releaseDate: episodeData.release_date || new Date().toISOString().split('T')[0],
    streamingUrl: episodeData.video_url || episodeData.stream_url || "",
    downloadUrl: episodeData.download_url || "",
  };
}
