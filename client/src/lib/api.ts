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

// APIs de streaming real
const ANIME_STREAMING_API = 'https://api-anime-rouge.vercel.app';
const ANBU_API = 'https://anbuanime.onrender.com';

// Função removida temporariamente para evitar erros de rede
// As APIs de streaming externas estão causando problemas de CORS e fetch
// Futuramente pode ser reimplementada com um proxy backend
async function searchAnimeInStreamingAPI(title: string): Promise<any> {
  // Retornar null para evitar erros
  return null;
}

// Função para buscar episódios reais com streaming
async function getStreamingEpisodes(animeId: string, streamingAnimeId?: string): Promise<any[]> {
  if (!streamingAnimeId) {
    console.log('📭 No streaming anime ID provided');
    return [];
  }
  
  try {
    console.log('🎬 Getting streaming episodes for:', streamingAnimeId);
    
    const episodesUrl = `${ANIME_STREAMING_API}/aniwatch/episodes/${streamingAnimeId}`;
    console.log('🌐 Fetching episodes from:', episodesUrl);
    
    const response = await fetch(episodesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Found', data.episodes?.length || 0, 'streaming episodes');
      return data.episodes || [];
    } else {
      console.warn('⚠️ Episodes API returned status:', response.status);
    }
    
  } catch (error) {
    console.warn('❌ Error fetching streaming episodes:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  return [];
}

// Função para buscar link de streaming de um episódio
async function getEpisodeStreamingLink(episodeId: string): Promise<string | null> {
  try {
    console.log('🔗 Getting streaming link for episode:', episodeId);
    
    const streamUrl = `${ANIME_STREAMING_API}/aniwatch/episode-srcs?id=${episodeId}&server=vidstreaming&category=sub`;
    console.log('🌐 Fetching stream from:', streamUrl);
    
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const sources = data.sources || [];
      
      // Buscar a melhor qualidade disponível
      const bestSource = sources.find((s: any) => s.quality === '1080p') || 
                          sources.find((s: any) => s.quality === '720p') || 
                          sources[0];
      
      if (bestSource) {
        console.log('✅ Found streaming link:', bestSource.quality);
        return bestSource.url;
      }
    } else {
      console.warn('⚠️ Streaming sources API returned status:', response.status);
    }
    
  } catch (error) {
    console.warn('❌ Error fetching streaming link:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  return null;
}

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

// Função para limpar cache e forçar nova busca
export function clearAnimeCache() {
  apiCache = null;
  cacheTimestamp = 0;
  console.log("🗑️ Anime cache cleared, will fetch fresh data");
}

// Função para buscar animes com múltiplas fontes
async function getAnimeDataFromAPI(): Promise<any[]> {
  const now = Date.now();
  
  // Se o cache ainda é válido, usar ele
  if (apiCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log("📦 Using cached API data");
    return apiCache;
  }
  
  // Tentar MUITOS endpoints diferentes para obter o máximo de animes possível
  const apiEndpoints = [
    // Top animes (múltiplas páginas)
    `${JIKAN_API_BASE}/top/anime?limit=25&page=1`,
    `${JIKAN_API_BASE}/top/anime?limit=25&page=2`,
    `${JIKAN_API_BASE}/top/anime?limit=25&page=3`,
    `${JIKAN_API_BASE}/top/anime?limit=25&page=4`,
    `${JIKAN_API_BASE}/top/anime?limit=25&page=5`,
    
    // Temporadas atuais
    `${JIKAN_API_BASE}/seasons/now?limit=25&page=1`,
    `${JIKAN_API_BASE}/seasons/now?limit=25&page=2`,
    `${JIKAN_API_BASE}/seasons/now?limit=25&page=3`,
    
    // Ordenação por popularidade
    `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25&page=2`,
    `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25&page=3`,
    `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25&page=4`,
    
    // Ordenação por score
    `${JIKAN_API_BASE}/anime?order_by=score&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=score&limit=25&page=2`,
    `${JIKAN_API_BASE}/anime?order_by=score&limit=25&page=3`,
    
    // Ordenação por membros
    `${JIKAN_API_BASE}/anime?order_by=members&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=members&limit=25&page=2`,
    `${JIKAN_API_BASE}/anime?order_by=members&limit=25&page=3`,
    
    // Diferentes temporadas de 2024
    `${JIKAN_API_BASE}/seasons/2024/fall?limit=25&page=1`,
    `${JIKAN_API_BASE}/seasons/2024/fall?limit=25&page=2`,
    `${JIKAN_API_BASE}/seasons/2024/summer?limit=25&page=1`,
    `${JIKAN_API_BASE}/seasons/2024/summer?limit=25&page=2`,
    `${JIKAN_API_BASE}/seasons/2024/spring?limit=25&page=1`,
    `${JIKAN_API_BASE}/seasons/2024/spring?limit=25&page=2`,
    `${JIKAN_API_BASE}/seasons/2024/winter?limit=25&page=1`,
    
    // Temporadas de 2023
    `${JIKAN_API_BASE}/seasons/2023/fall?limit=25`,
    `${JIKAN_API_BASE}/seasons/2023/summer?limit=25`,
    `${JIKAN_API_BASE}/seasons/2023/spring?limit=25`,
    `${JIKAN_API_BASE}/seasons/2023/winter?limit=25`,
    
    // Temporadas de 2022
    `${JIKAN_API_BASE}/seasons/2022/fall?limit=25`,
    `${JIKAN_API_BASE}/seasons/2022/summer?limit=25`,
    `${JIKAN_API_BASE}/seasons/2022/spring?limit=25`,
    `${JIKAN_API_BASE}/seasons/2022/winter?limit=25`,
    
    // Diferentes tipos de ordenação
    `${JIKAN_API_BASE}/anime?order_by=start_date&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=end_date&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=episodes&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=rank&limit=25&page=1`,
    `${JIKAN_API_BASE}/anime?order_by=rank&limit=25&page=2`
  ];
  
  let allAnimeData: any[] = [];
  
  // Buscar dados de TODOS os endpoints e combiná-los
  for (const endpoint of apiEndpoints) {
    try {
      console.log("🌐 Trying endpoint:", endpoint);
      const response = await fetch(endpoint);
      console.log("📡 API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.data && data.data.length > 0) {
          // Adicionar dados únicos baseados no mal_id
          data.data.forEach((anime: any) => {
            const existingAnime = allAnimeData.find(existing => existing.mal_id === anime.mal_id);
            if (!existingAnime) {
              allAnimeData.push(anime);
            }
          });
          console.log("✅ Added", data.data.length, "animes from", endpoint);
          console.log("📊 Total unique animes so far:", allAnimeData.length);
        }
      }
      
      // Aguardar menos tempo para acelerar o carregamento
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn("❌ Failed endpoint:", endpoint, error);
    }
  }
  
  // Se coletamos dados de algum endpoint, usar eles
  if (allAnimeData.length > 0) {
    apiCache = allAnimeData;
    cacheTimestamp = now;
    console.log("✅ Successfully cached", allAnimeData.length, "unique animes from multiple sources");
    return apiCache;
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
  
  // Forçar nova busca com mais dados sempre
  clearAnimeCache();
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    // Usar TODOS os animes disponíveis, não apenas 8
    const trendingAnimes = apiData.map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning", trendingAnimes.length, "trending animes from API cache");
    return getAnimesWithProgress(trendingAnimes);
  }
  
  // Fallback: usar TODOS os dados mock disponíveis para maximizar a coleção
  const mockCategories = [
    'trending', 'action', 'adventure', 'comedy', 'drama', 'fantasy', 'romance', 
    'sci-fi', 'slice-of-life', 'supernatural', 'thriller', 'mystery', 'horror',
    'sports', 'music', 'school', 'military', 'historical', 'mecha', 'magic',
    'demons', 'vampire', 'martial-arts', 'super-power', 'game', 'parody',
    'psychological', 'seinen', 'shoujo', 'shounen', 'josei', 'kids'
  ];
  let allMockAnimes: AnimeWithProgress[] = [];
  
  // Buscar animes de TODAS as categorias disponíveis
  mockCategories.forEach(category => {
    try {
      const categoryAnimes = getAnimesByCategory(category);
      categoryAnimes.forEach(anime => {
        // Evitar duplicatas baseado no ID
        const existingAnime = allMockAnimes.find(existing => existing.id === anime.id);
        if (!existingAnime) {
          allMockAnimes.push(anime);
        }
      });
    } catch (error) {
      // Se a categoria não existe, ignorar
      console.log(`Category ${category} not found, skipping`);
    }
  });
  
  console.log("✅ Using", allMockAnimes.length, "mock animes as comprehensive fallback");
  return allMockAnimes;
}

// Sistema de armazenamento local para progresso de animes
const WATCH_PROGRESS_KEY = 'animepulse_watch_progress';

interface LocalWatchProgress {
  animeId: string;
  animeTitle: string;
  animeImage: string;
  episodeNumber: number;
  totalEpisodes: number;
  progressPercent: number;
  lastWatched: string;
}

export function getLocalWatchProgress(): LocalWatchProgress[] {
  try {
    const stored = localStorage.getItem(WATCH_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(animeId: string, animeTitle: string, animeImage: string, episodeNumber: number, totalEpisodes: number, progressPercent: number = 0) {
  const progress = getLocalWatchProgress();
  const existingIndex = progress.findIndex(p => p.animeId === animeId);
  
  const newProgress: LocalWatchProgress = {
    animeId,
    animeTitle,
    animeImage,
    episodeNumber,
    totalEpisodes,
    progressPercent: Math.round(progressPercent),
    lastWatched: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    progress[existingIndex] = newProgress;
  } else {
    progress.unshift(newProgress); // Adicionar no início
  }
  
  // Manter apenas os 10 mais recentes
  const recentProgress = progress.slice(0, 10);
  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(recentProgress));
}

export function removeWatchProgress(animeId: string) {
  const progress = getLocalWatchProgress();
  const filtered = progress.filter(p => p.animeId !== animeId);
  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(filtered));
}

// Função para remover progresso de um episódio específico ou ajustar para episódio anterior
export function removeEpisodeProgress(animeId: string, episodeNumber: number, animeTitle: string, animeImage: string, totalEpisodes: number) {
  const progress = getLocalWatchProgress();
  const animeIndex = progress.findIndex(p => p.animeId === animeId);
  
  if (animeIndex >= 0) {
    const animeProgress = progress[animeIndex];
    
    if (episodeNumber === 1) {
      // Se for o episódio 1, remover completamente o progresso
      progress.splice(animeIndex, 1);
    } else if (animeProgress.episodeNumber >= episodeNumber) {
      // Se o episódio atual é maior ou igual ao que queremos remover,
      // ajustar para o episódio anterior
      progress[animeIndex] = {
        ...animeProgress,
        episodeNumber: episodeNumber - 1,
        progressPercent: Math.round(((episodeNumber - 1) / totalEpisodes) * 100),
        lastWatched: new Date().toISOString()
      };
    }
    // Se o episódio atual é menor que o que queremos remover, não fazer nada
    
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
  }
}

// Lista de episódios assistidos individualmente (mantida para compatibilidade com localStorage)
const WATCHED_EPISODES_KEY = 'animepulse_watched_episodes';

interface WatchedEpisode {
  animeId: string;
  episodeNumber: number;
  watchedAt: string;
}

export function getWatchedEpisodesList(): WatchedEpisode[] {
  try {
    const stored = localStorage.getItem(WATCHED_EPISODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Função para marcar episódio como assistido quando termina no player
export async function markEpisodeWatchedFromPlayer(
  animeId: string, 
  episodeNumber: number, 
  animeTitle: string, 
  animeImage: string,
  totalEpisodes: number
) {
  console.log('🎯 markEpisodeWatchedFromPlayer chamado com:', {
    animeId, episodeNumber, animeTitle, totalEpisodes
  });
  
  try {
    // Marcar no localStorage temporariamente
    const watchedEpisodes = getWatchedEpisodesList();
    console.log('📋 Episódios assistidos antes:', watchedEpisodes);
    
    const existingIndex = watchedEpisodes.findIndex(
      ep => ep.animeId === animeId && ep.episodeNumber === episodeNumber
    );
    
    if (existingIndex === -1) {
      const newEpisode = {
        animeId,
        episodeNumber,
        watchedAt: new Date().toISOString()
      };
      watchedEpisodes.push(newEpisode);
      localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(watchedEpisodes));
      console.log('✅ Episódio adicionado:', newEpisode);
    } else {
      console.log('ℹ️ Episódio já estava marcado como assistido');
    }

    // Verificar se completou todos os episódios para dar pontos
    const animeWatchedEpisodes = watchedEpisodes.filter(ep => ep.animeId === animeId);
    const watchedCount = animeWatchedEpisodes.length;
    
    console.log(`📊 Progresso: ${watchedCount}/${totalEpisodes} episódios assistidos`);
    
    // Notificar que um episódio foi assistido
    const episodeEvent = new CustomEvent('episodeWatched');
    window.dispatchEvent(episodeEvent);
    console.log('📡 Evento episodeWatched disparado');

    if (watchedCount >= totalEpisodes) {
      const points = calculateAnimePoints(totalEpisodes);
      console.log(`🎉 Anime completado: ${animeTitle}! Pontos calculados: ${points}`);
      return { completed: true, points };
    }
    
    return { completed: false, points: 0 };
  } catch (error) {
    console.error('❌ Erro ao marcar episódio como assistido:', error);
    return { completed: false, points: 0 };
  }
}

// Calcular pontos baseado no número de episódios
export function calculateAnimePoints(totalEpisodes: number): number {
  const basePoints = 100;
  const episodeBonus = Math.floor(totalEpisodes / 5) * 10; // 10 pontos extras a cada 5 episódios
  return basePoints + episodeBonus;
}

// Função para mostrar modal de parabéns com pontos (será chamada pelo player)
export function showAnimeCompletionModal(animeTitle: string, points: number) {
  // Dispatch custom event para notificar a página de detalhes
  const event = new CustomEvent('animeCompleted', { 
    detail: { animeTitle, points } 
  });
  window.dispatchEvent(event);
}

export function removeWatchedEpisode(animeId: string, episodeNumber: number) {
  const watchedEpisodes = getWatchedEpisodesList();
  const filtered = watchedEpisodes.filter(
    ep => !(ep.animeId === animeId && ep.episodeNumber === episodeNumber)
  );
  
  localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(filtered));
}

// Função para verificar se um episódio específico foi assistido
export function isEpisodeWatched(animeId: string, episodeNumber: number): boolean {
  const watchedEpisodes = getWatchedEpisodesList();
  return watchedEpisodes.some(
    ep => ep.animeId === animeId && ep.episodeNumber === episodeNumber
  );
}

// Função para verificar se todos os episódios de um anime foram assistidos
export function areAllEpisodesWatched(animeId: string, totalEpisodes: number): boolean {
  const watchedEpisodes = getWatchedEpisodesList();
  const animeWatchedEpisodes = watchedEpisodes.filter(ep => ep.animeId === animeId);
  
  // Verificar se temos todos os episódios de 1 até totalEpisodes
  for (let i = 1; i <= totalEpisodes; i++) {
    const episodeWatched = animeWatchedEpisodes.some(ep => ep.episodeNumber === i);
    if (!episodeWatched) {
      return false;
    }
  }
  
  return totalEpisodes > 0 && animeWatchedEpisodes.length >= totalEpisodes;
}

// Função para obter lista de episódios assistidos de um anime
export function getWatchedEpisodes(animeId: string): number[] {
  const progress = getLocalWatchProgress();
  const animeProgress = progress.find(p => p.animeId === animeId);
  if (!animeProgress) return [];
  
  // Retornar array com todos os episódios até o episódio atual assistido
  return Array.from({ length: animeProgress.episodeNumber }, (_, i) => i + 1);
}

export async function getContinueWatching(): Promise<AnimeWithProgress[]> {
  console.log("🔄 Getting continue watching anime...");
  
  // Buscar progresso local real do usuário
  const localProgress = getLocalWatchProgress();
  
  if (localProgress.length === 0) {
    console.log("📭 No watch progress found - user hasn't started watching any anime");
    return [];
  }
  
  // Converter progresso local para formato AnimeWithProgress
  const continueWatching: AnimeWithProgress[] = localProgress.map(progress => {
    const calculatedPercent = Math.round((progress.episodeNumber / progress.totalEpisodes) * 100);
    
    return {
      id: progress.animeId,
      title: progress.animeTitle,
      image: progress.animeImage,
      studio: null,
      year: null,
      genres: null,
      synopsis: null,
      releaseDate: null,
      status: "ongoing",
      totalEpisodes: progress.totalEpisodes,
      rating: null,
      viewCount: null,
      progress: {
        id: Math.random().toString(),
        userId: "1",
        animeId: progress.animeId,
        episodeNumber: progress.episodeNumber,
        progressPercent: calculatedPercent,
        updatedAt: new Date(progress.lastWatched)
      }
    };
  });
  
  console.log("✅ Returning", continueWatching.length, "animes from real user progress");
  return continueWatching;
}

// Função para obter temporadas disponíveis
export function getAvailableSeasons() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Mês atual (1-12)
  
  // Determinar temporada atual baseada no mês
  let currentSeason: string;
  if (currentMonth >= 1 && currentMonth <= 3) currentSeason = 'winter';
  else if (currentMonth >= 4 && currentMonth <= 6) currentSeason = 'spring';
  else if (currentMonth >= 7 && currentMonth <= 9) currentSeason = 'summer';
  else currentSeason = 'fall';
  
  const seasons = [
    { value: 'now', label: 'Temporada Atual', year: currentYear, season: currentSeason },
    { value: `${currentYear}/fall`, label: 'Outono 2024', year: currentYear, season: 'fall' },
    { value: `${currentYear}/summer`, label: 'Verão 2024', year: currentYear, season: 'summer' },
    { value: `${currentYear}/spring`, label: 'Primavera 2024', year: currentYear, season: 'spring' },
    { value: `${currentYear}/winter`, label: 'Inverno 2024', year: currentYear, season: 'winter' },
    { value: `${currentYear - 1}/fall`, label: 'Outono 2023', year: currentYear - 1, season: 'fall' },
    { value: `${currentYear - 1}/summer`, label: 'Verão 2023', year: currentYear - 1, season: 'summer' },
  ];
  
  return seasons;
}

export async function getLatestAnime(): Promise<AnimeWithProgress[]> {
  return getAnimesBySeason('now');
}

export async function getAnimesBySeason(season: string = 'now'): Promise<AnimeWithProgress[]> {
  console.log(`🆕 Getting latest anime from season: ${season}...`);
  
  try {
    // Construir URL baseado na temporada selecionada
    let apiUrl = `${JIKAN_API_BASE}/seasons/now?limit=25`;
    if (season !== 'now') {
      apiUrl = `${JIKAN_API_BASE}/seasons/${season}?limit=25`;
    }
    
    const seasonResponse = await fetch(apiUrl);
    if (seasonResponse.ok) {
      const seasonData = await seasonResponse.json();
      if (seasonData?.data && seasonData.data.length > 0) {
        const seasonAnimes = seasonData.data.map(adaptAnimeFromJikanAPI);
        console.log("✅ Returning", seasonAnimes.length, `season animes from ${season}`);
        return getAnimesWithProgress(seasonAnimes);
      }
    }
    
    // Fallback para dados da API geral
    const apiData = await getAnimeDataFromAPI();
    if (apiData.length > 0) {
      // Verificar se os dados são do Jikan API ou Otakudesu
      const isJikanData = apiData[0]?.mal_id !== undefined;
      const latestAnimes = apiData.map(anime => 
        isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
      );
      console.log("✅ Returning", latestAnimes.length, "latest animes from API cache");
      return getAnimesWithProgress(latestAnimes);
    }
  } catch (error) {
    console.warn("❌ Error fetching season anime:", error);
  }
  
  console.log("⚠️ No API data found, using trending data as fallback for latest");
  // Se não tiver dados da API, usar os mesmos dados do trending
  const trendingData = await getTrendingAnime();
  return getAnimesWithProgress(trendingData);
}

export async function getTopAnime(): Promise<AnimeWithProgress[]> {
  console.log("🏆 Getting top 10 anime...");
  
  const apiData = await getAnimeDataFromAPI();
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    const allAnimes = apiData.map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    
    // Ordenar por viewCount em ordem decrescente e pegar apenas os top 10
    const topAnimes = allAnimes
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
    
    console.log("✅ Returning top 10 animes ordered by viewCount");
    return topAnimes;
  }
  
  // Fallback: ordenar dados mock por viewCount
  const mockData = getAnimesByCategory('trending');
  return mockData.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);
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
          viewCount: Math.floor(Math.random() * 400000) + 30000,
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
    viewCount: Math.floor(Math.random() * 50000) + 5000,
  };
}

export async function getEpisodesByAnimeIdAPI(animeId: string, season: string = "1"): Promise<Episode[]> {
  try {
    console.log("🎬 Getting episodes for anime ID:", animeId, "Season:", season);
    
    // Buscar informações da temporada específica da API Jikan
    let streamingAnimeData: any = null;
    try {
      const seasonResponse = await fetch(`${JIKAN_API_BASE}/anime/${animeId}`);
      if (seasonResponse.ok) {
        const animeData = await seasonResponse.json();
        const anime = animeData.data;
        
        // Remover tentativas de buscar APIs externas que estão causando erros
        // streamingAnimeData = await searchAnimeInStreamingAPI(anime.title);
        console.log("📺 Using local episode generation for:", anime.title);
        
        // Buscar temporadas relacionadas
        const relatedResponse = await fetch(`${JIKAN_API_BASE}/anime/${animeId}/relations`);
        let seasonInfo = { episodes: anime.episodes || 12, title: anime.title };
        
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          const sequels = relatedData.data?.filter((rel: any) => 
            rel.relation === 'Sequel' || rel.relation === 'Prequel' || rel.relation === 'Side story'
          ) || [];
          
          // Se é temporada 1, usar anime principal
          if (season === "1") {
            seasonInfo = { episodes: anime.episodes || 12, title: anime.title };
          } else {
            // Para outras temporadas, tentar encontrar nas relações
            const seasonIndex = parseInt(season) - 2; // -2 porque começamos do 0 para a segunda temporada
            if (sequels[seasonIndex]) {
              const relatedAnimeId = sequels[seasonIndex].entry[0]?.mal_id;
              if (relatedAnimeId) {
                const relatedAnimeResponse = await fetch(`${JIKAN_API_BASE}/anime/${relatedAnimeId}`);
                if (relatedAnimeResponse.ok) {
                  const relatedAnime = await relatedAnimeResponse.json();
                  seasonInfo = { 
                    episodes: relatedAnime.data.episodes || 12, 
                    title: relatedAnime.data.title 
                  };
                }
              }
            }
          }
        }
        
        const totalEpisodes = seasonInfo.episodes;
    
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

        // Gerar episódios baseados nos dados reais da API Jikan
        console.log("📺 Generating episodes for", anime.title, "with", totalEpisodes, "episodes");

        // Lista de vídeos de exemplo variados para simular diferentes episódios
        const sampleVideos = [
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        ];

        // Gerar episódios realistas para esta temporada específica
        const episodes: Episode[] = [];
        
        for (let i = 1; i <= totalEpisodes; i++) {
          const episodeIndex = (i - 1) % episodeTitles.length;
          const episodeTitle = episodeTitles[episodeIndex] || `Aventura Continua`;
          
          // Usar vídeo diferente para cada episódio baseado no número do episódio
          const videoIndex = (i - 1) % sampleVideos.length;
          const episodeVideo = sampleVideos[videoIndex];
          
          episodes.push({
            id: `${animeId}-s${season}-ep-${i}`,
            animeId: animeId,
            number: i,
            title: `Episódio ${i} - ${episodeTitle}`,
            thumbnail: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop",
            duration: "24 min",
            releaseDate: new Date(Date.now() - (totalEpisodes - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
            // Usar vídeo específico para este episódio
            streamingUrl: episodeVideo,
            downloadUrl: `https://example.com/download/${animeId}-s${season}-ep-${i}.mp4`,
          });
        }
        
        console.log("✅ Generated", episodes.length, "episodes for season", season, "based on real anime data");
        return episodes;
      }
    } catch (apiError) {
      console.warn("Failed to fetch season-specific data, using fallback");
    }
    
    // Fallback: usar dados do anime principal
    const anime = await getAnimeByIdAPI(animeId);
    const totalEpisodes = Math.min(anime.totalEpisodes || 12, 25); // Máximo 25 episódios por temporada
    
    // Lista de títulos para fallback
    const fallbackTitles = [
      "O Início da Jornada", "Primeiros Passos", "O Despertar do Poder", "Encontro Fatídico", "Revelações",
      "Batalha Decisiva", "Novos Aliados", "O Segredo Revelado", "Confronto Final", "Uma Nova Esperança",
      "Lágrimas e Sorrisos", "O Verdadeiro Inimigo", "Força Interior", "Sacrifício", "O Passado Revelado"
    ];
    
    // Lista de vídeos diversos para fallback também
    const sampleVideos = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    ];

    // Gerar episódios com base no fallback
    const episodes: Episode[] = [];
    
    for (let i = 1; i <= totalEpisodes; i++) {
      const episodeIndex = (i - 1) % fallbackTitles.length;
      const episodeTitle = fallbackTitles[episodeIndex] || `Aventura Continua`;
      
      // Usar vídeo diferente para cada episódio também no fallback
      const videoIndex = (i - 1) % sampleVideos.length;
      const episodeVideo = sampleVideos[videoIndex];
      
      episodes.push({
        id: `${animeId}-s${season}-ep-${i}`,
        animeId: animeId,
        number: i,
        title: `Episódio ${i} - ${episodeTitle}`,
        thumbnail: anime.image || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop",
        duration: "24 min",
        releaseDate: new Date(Date.now() - (totalEpisodes - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        streamingUrl: episodeVideo,
        downloadUrl: `https://example.com/download/${animeId}-s${season}-ep-${i}.mp4`,
      });
    }
    
    console.log("✅ Generated", episodes.length, "episodes for season", season, "with streaming URLs");
    return episodes;
    
  } catch (error) {
    console.warn("❌ Error generating episodes:", error instanceof Error ? error.message : String(error));
  }
  
  // Fallback para dados mock
  return getEpisodesByAnimeId(animeId);
}

// Manga API functions
export async function getLatestManga(): Promise<Manga[]> {
  console.log("📚 Getting latest manga with expanded sources...");
  
  // Múltiplos endpoints para obter MUITOS mangás
  const mangaEndpoints = [
    // Top manga (múltiplas páginas)
    `${JIKAN_API_BASE}/top/manga?limit=25&page=1`,
    `${JIKAN_API_BASE}/top/manga?limit=25&page=2`,
    `${JIKAN_API_BASE}/top/manga?limit=25&page=3`,
    `${JIKAN_API_BASE}/top/manga?limit=25&page=4`,
    `${JIKAN_API_BASE}/top/manga?limit=25&page=5`,
    
    // Manga por popularidade
    `${JIKAN_API_BASE}/manga?order_by=popularity&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=popularity&limit=25&page=2`,
    `${JIKAN_API_BASE}/manga?order_by=popularity&limit=25&page=3`,
    
    // Manga por score
    `${JIKAN_API_BASE}/manga?order_by=score&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=score&limit=25&page=2`,
    `${JIKAN_API_BASE}/manga?order_by=score&limit=25&page=3`,
    
    // Manga por membros
    `${JIKAN_API_BASE}/manga?order_by=members&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=members&limit=25&page=2`,
    `${JIKAN_API_BASE}/manga?order_by=members&limit=25&page=3`,
    
    // Diferentes ordenações
    `${JIKAN_API_BASE}/manga?order_by=chapters&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=start_date&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=end_date&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=rank&limit=25&page=1`,
    `${JIKAN_API_BASE}/manga?order_by=rank&limit=25&page=2`
  ];

  let allMangaData: any[] = [];

  // Buscar dados de TODOS os endpoints
  for (const endpoint of mangaEndpoints) {
    try {
      console.log("📖 Trying manga endpoint:", endpoint);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.data && data.data.length > 0) {
          // Adicionar dados únicos baseados no mal_id
          data.data.forEach((manga: any) => {
            const existingManga = allMangaData.find(existing => existing.mal_id === manga.mal_id);
            if (!existingManga) {
              allMangaData.push(manga);
            }
          });
          console.log("✅ Added", data.data.length, "manga from", endpoint);
          console.log("📊 Total unique manga so far:", allMangaData.length);
        }
      }
      
      // Aguardar menos tempo para acelerar
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn("❌ Failed manga endpoint:", endpoint, error);
    }
  }

  // Se conseguimos dados da API, usar eles
  if (allMangaData.length > 0) {
    const adaptedMangas = allMangaData.map(adaptMangaFromJikanAPI);
    console.log("✅ Successfully fetched", adaptedMangas.length, "unique manga from API");
    return adaptedMangas;
  }

  // Fallback: usar TODOS os dados mock de manga disponíveis  
  const mockMangaCategories = [
    'action', 'adventure', 'comedy', 'drama', 'fantasy', 'romance', 
    'sci-fi', 'slice-of-life', 'supernatural', 'thriller', 'mystery', 'horror',
    'sports', 'music', 'school', 'historical', 'mecha', 'magic',
    'demons', 'vampire', 'martial-arts', 'psychological', 'seinen', 
    'shoujo', 'shounen', 'josei', 'kids', 'ecchi', 'harem'
  ];
  
  let allMockMangas: Manga[] = [];
  
  mockMangaCategories.forEach(category => {
    try {
      // Tentar pegar mangás por categoria dos dados mock
      const categoryMangas = mockMangas.filter((manga: Manga) => 
        manga.genres?.some(genre => 
          genre.toLowerCase().includes(category) || 
          category.includes(genre.toLowerCase())
        )
      );
      
      categoryMangas.forEach(manga => {
        const existingManga = allMockMangas.find(existing => existing.id === manga.id);
        if (!existingManga) {
          allMockMangas.push(manga);
        }
      });
    } catch (error) {
      console.log(`Manga category ${category} processing failed, skipping`);
    }
  });
  
  // Se não conseguiu categorizar bem, usar todos os mock mangás
  if (allMockMangas.length < mockMangas.length / 2) {
    allMockMangas = mockMangas;
  }
  
  console.log("✅ Using", allMockMangas.length, "manga as comprehensive fallback");
  return allMockMangas;
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
    viewCount: apiAnime.members || apiAnime.popularity || Math.floor(Math.random() * 300000) + 20000,
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
    viewCount: Math.floor(Math.random() * 300000) + 25000,
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
    viewCount: jikanAnime.members || jikanAnime.favorites || Math.floor(Math.random() * 500000) + 50000,
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
    viewCount: Math.floor(Math.random() * 300000) + 20000, // Add missing viewCount
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
