import type { Anime, Episode, Manga, Chapter, News, AnimeWithProgress, PostWithUser } from "@shared/schema";
import { getJikanTrendingAnime, getJikanTopAnime, getJikanTopManga, getJikanAnimeById, getJikanMangaById, searchJikanAnime, searchJikanManga, getJikanSeasonalAnime } from './jikanApi';
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

// Using only Jikan API for anime and manga data
const JIKAN_API_BASE = "https://api.jikan.moe/v4";




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
const CACHE_DURATION = 300000; // 5 minutos (cache mais longo para tantos dados)

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
  
  // Buscar TODOS os animes disponíveis na API do Jikan - expandindo para CENTENAS de páginas
  const apiEndpoints = [
    // Top animes (MUITAS páginas - até 100 páginas)
    ...Array.from({length: 100}, (_, i) => `${JIKAN_API_BASE}/top/anime?limit=25&page=${i + 1}`),
    
    // Temporadas atuais (mais páginas)
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/now?limit=25&page=${i + 1}`),
    
    // Ordenação por popularidade (MUITO mais páginas)
    ...Array.from({length: 200}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=popularity&limit=25&page=${i + 1}`),
    
    // Ordenação por score (mais páginas)
    ...Array.from({length: 100}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=score&limit=25&page=${i + 1}`),
    
    // Ordenação por membros (mais páginas)
    ...Array.from({length: 100}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=members&limit=25&page=${i + 1}`),
    
    // Ordenação por ranking (MUITAS páginas)
    ...Array.from({length: 300}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=rank&limit=25&page=${i + 1}`),
    
    // Ordenação por favoritos
    ...Array.from({length: 50}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=favorites&limit=25&page=${i + 1}`),
    
    // Temporadas completas de múltiplos anos (2024)
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2024/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2024/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2024/spring?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2024/winter?limit=25&page=${i + 1}`),
    
    // Temporadas de 2023 (mais páginas)
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2023/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2023/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2023/spring?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2023/winter?limit=25&page=${i + 1}`),
    
    // Temporadas de 2022 (mais páginas)
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2022/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2022/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2022/spring?limit=25&page=${i + 1}`),
    ...Array.from({length: 15}, (_, i) => `${JIKAN_API_BASE}/seasons/2022/winter?limit=25&page=${i + 1}`),
    
    // Temporadas de anos anteriores
    ...Array.from({length: 12}, (_, i) => `${JIKAN_API_BASE}/seasons/2021/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 12}, (_, i) => `${JIKAN_API_BASE}/seasons/2021/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 12}, (_, i) => `${JIKAN_API_BASE}/seasons/2021/spring?limit=25&page=${i + 1}`),
    ...Array.from({length: 12}, (_, i) => `${JIKAN_API_BASE}/seasons/2021/winter?limit=25&page=${i + 1}`),
    
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2020/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2020/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2020/spring?limit=25&page=${i + 1}`),
    ...Array.from({length: 10}, (_, i) => `${JIKAN_API_BASE}/seasons/2020/winter?limit=25&page=${i + 1}`),
    
    // Temporadas de 2019-2015 (para pegar animes clássicos)
    ...Array.from({length: 8}, (_, i) => `${JIKAN_API_BASE}/seasons/2019/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 8}, (_, i) => `${JIKAN_API_BASE}/seasons/2019/summer?limit=25&page=${i + 1}`),
    ...Array.from({length: 8}, (_, i) => `${JIKAN_API_BASE}/seasons/2018/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 8}, (_, i) => `${JIKAN_API_BASE}/seasons/2017/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 6}, (_, i) => `${JIKAN_API_BASE}/seasons/2016/fall?limit=25&page=${i + 1}`),
    ...Array.from({length: 6}, (_, i) => `${JIKAN_API_BASE}/seasons/2015/fall?limit=25&page=${i + 1}`),
    
    // Diferentes tipos de ordenação (mais páginas)
    ...Array.from({length: 50}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=start_date&limit=25&page=${i + 1}`),
    ...Array.from({length: 50}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=end_date&limit=25&page=${i + 1}`),
    ...Array.from({length: 30}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=episodes&limit=25&page=${i + 1}`),
    ...Array.from({length: 30}, (_, i) => `${JIKAN_API_BASE}/anime?order_by=title&limit=25&page=${i + 1}`)
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
      
      // Rate limiting ajustado para grande volume de dados
      await new Promise(resolve => setTimeout(resolve, 250));
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
  
  console.log("⚠️ All Jikan API endpoints failed, using fallback data");
  return [];
}





export async function getTrendingAnime(): Promise<AnimeWithProgress[]> {
  console.log("🔍 Getting TODOS os animes disponíveis da API do Jikan...");
  
  // SEMPRE usar a função que busca de TODOS os endpoints para obter o catálogo completo
  console.log("📥 Forçando busca de TODOS os animes disponíveis...");
  clearAnimeCache();
  const apiData = await getAnimeDataFromAPI();
  
  if (apiData.length > 0) {
    // Verificar se os dados são do Jikan API ou Otakudesu
    const isJikanData = apiData[0]?.mal_id !== undefined;
    // Usar TODOS os animes disponíveis do catálogo completo
    const allAnimes = apiData.map(anime => 
      isJikanData ? adaptAnimeFromJikanAPI(anime) : anime
    );
    console.log("✅ Returning TOTAL of", allAnimes.length, "animes from complete Jikan catalog");
    return getAnimesWithProgress(allAnimes);
  }
  
  // Só usar fallback se realmente não conseguir buscar nada
  try {
    console.log("⚠️ Fallback: Trying limited Jikan trending...");
    const jikanAnimes = await getJikanTrendingAnime(25);
    if (jikanAnimes.length > 0) {
      console.log(`⚠️ Using limited fallback: ${jikanAnimes.length} trending animes from Jikan`);
      return getAnimesWithProgress(jikanAnimes);
    }
  } catch (error) {
    console.log("❌ Even fallback Jikan API failed:", error);
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
    
    // Rastrear marcos de progresso
    let newMilestones: any[] = [];
    try {
      const { trackWatchActivity } = await import('./milestones');
      newMilestones = trackWatchActivity(animeId, episodeNumber);
      
      if (newMilestones.length > 0) {
        console.log('🏆 Novos marcos alcançados:', newMilestones.map(m => m.name));
        // Disparar evento para mostrar marcos
        const milestoneEvent = new CustomEvent('milestonesAchieved', { 
          detail: { milestones: newMilestones } 
        });
        window.dispatchEvent(milestoneEvent);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar marcos:', error);
    }

    // Atualizar estatísticas do usuário se logado
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        // Usuário está logado, atualizar estatísticas
        await fetch('/api/auth/update-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            episodesWatched: 1,
            lastWatchDate: new Date().toISOString()
          })
        });
        console.log('📈 Estatísticas do usuário atualizadas');
        
        // Invalidar cache das estatísticas - importar o queryClient corretamente
        const { queryClient } = await import('@/lib/queryClient');
        queryClient.invalidateQueries({ queryKey: ['/api/auth/stats'] });
        console.log('🔄 Cache de estatísticas invalidado');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao atualizar estatísticas:', error);
    }

    // Notificar que um episódio foi assistido
    const episodeEvent = new CustomEvent('episodeWatched');
    window.dispatchEvent(episodeEvent);
    console.log('📡 Evento episodeWatched disparado');

    if (watchedCount >= totalEpisodes) {
      const points = calculateAnimePoints(totalEpisodes);
      console.log(`🎉 Anime completado: ${animeTitle}! Pontos calculados: ${points}`);
      
      // Marcar anime como completado no backend
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          // Usuário está logado, marcar anime como completado
          const completeResponse = await fetch('/api/anime/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              animeId,
              animeTitle,
              animeImage,
              totalEpisodes
            })
          });
          
          if (completeResponse.ok) {
            console.log(`✅ Anime ${animeTitle} marcado como completado no backend!`);
            
            // Invalidar caches relacionados
            const { queryClient } = await import('@/lib/queryClient');
            queryClient.invalidateQueries({ queryKey: ['/api/auth/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/completed-animes'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
            console.log('🔄 Caches invalidados após completar anime');
          } else {
            console.error('❌ Erro ao marcar anime como completado no backend');
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao completar anime no backend:', error);
      }
      
      // Disparar evento de anime completado
      const animeCompletedEvent = new CustomEvent('animeCompleted', {
        detail: { animeTitle, points }
      });
      window.dispatchEvent(animeCompletedEvent);
      
      return { completed: true, points, milestones: newMilestones };
    }
    
    return { completed: false, points: 0, milestones: newMilestones };
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
  
  // Filtrar apenas animes que NÃO foram completados (não assistiu todos os episódios)
  const uncompletedProgress = localProgress.filter(progress => {
    const isCompleted = progress.episodeNumber >= progress.totalEpisodes;
    if (isCompleted) {
      console.log(`🏁 Anime completado removido de "Continue Assistindo": ${progress.animeTitle} (${progress.episodeNumber}/${progress.totalEpisodes})`);
    }
    return !isCompleted;
  });
  
  // Converter progresso local para formato AnimeWithProgress
  const continueWatching: AnimeWithProgress[] = uncompletedProgress.map(progress => {
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
  console.log("🏆 Getting top anime with Jikan API...");
  
  try {
    // Use Jikan API for top anime
    const jikanAnimes = await getJikanTopAnime(10);
    if (jikanAnimes.length > 0) {
      console.log(`✅ Got ${jikanAnimes.length} top animes from Jikan`);
      return getAnimesWithProgress(jikanAnimes);
    }
  } catch (error) {
    console.log("⚠️ Jikan API failed, using fallback APIs...");
  }
  
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
    
    console.log("✅ Returning top 10 animes ordered by viewCount from fallback");
    return getAnimesWithProgress(topAnimes);
  }
  
  // Fallback: ordenar dados mock por viewCount
  const mockData = getAnimesByCategory('trending');
  return mockData.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);
}

export async function getAnimeByIdAPI(id: string): Promise<AnimeWithProgress> {
  try {
    console.log("📺 Getting anime details for ID:", id);
    
    // Se o ID for numérico, tentar primeiro no Jikan API
    if (!isNaN(Number(id))) {
      try {
        const jikanAnime = await getJikanAnimeById(id);
        if (jikanAnime) {
          console.log("✅ Found anime details from Jikan API");
          return jikanAnime;
        }
      } catch (error) {
        console.warn("⚠️ Jikan API failed, trying fallback APIs");
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
  console.log("📚 Getting latest manga with MyAnimeList integration...");
  
  try {
    // Use Jikan API for top manga
    const jikanMangas = await getJikanTopManga(25);
    if (jikanMangas.length > 0) {
      console.log(`✅ Got ${jikanMangas.length} latest mangas from Jikan`);
      return jikanMangas;
    }
  } catch (error) {
    console.log("⚠️ Jikan API failed, using fallback sources...");
  }
  
  console.log("📚 Getting latest manga from fallback sources...");
  
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

export async function getMangaByIdAPI(id: string): Promise<Manga> {
  try {
    console.log("📚 Getting manga details for ID:", id);
    
    // Use Jikan API for manga details
    const jikanManga = await getJikanMangaById(id);
    if (jikanManga) {
      console.log(`✅ Found manga details from Jikan: ${jikanManga.title}`);
      return jikanManga;
    }
    
    // Fallback: tentar buscar da API do Jikan se for ID numérico
    if (!isNaN(Number(id))) {
      const jikanResponse = await fetch(`${JIKAN_API_BASE}/manga/${id}`);
      if (jikanResponse.ok) {
        const jikanData = await jikanResponse.json();
        console.log("✅ Found manga details from Jikan fallback");
        
        if (jikanData?.data) {
          return adaptMangaFromJikanAPI(jikanData.data);
        }
      }
    }
    
    console.log("⚠️ No manga found in APIs, using mock data fallback");
  } catch (error) {
    console.warn("❌ Error fetching manga details:", error instanceof Error ? error.message : String(error));
  }
  
  // Fallback para dados mock - buscar primeiro por ID exato
  const mockManga = mockMangas.find(manga => manga.id === id);
  if (mockManga) {
    return mockManga;
  }
  
  // Se não encontrar por ID, retornar o primeiro manga mock como fallback
  if (mockMangas.length > 0) {
    return mockMangas[0];
  }
  
  // Se nem os dados mock existem, retorna um manga padrão
  return {
    id: id,
    title: "Mangá não encontrado",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    rating: "0",
    status: "unknown",
    genres: ["Desconhecido"],
    latestChapter: 0,
    author: "Desconhecido",
    synopsis: "Detalhes do mangá não disponíveis no momento."
  };
}

// Função para gerar capítulos mock para um mangá
function generateMockChapters(mangaId: string, totalChapters: number = 50): Chapter[] {
  const chapters: Chapter[] = [];
  
  for (let i = 1; i <= totalChapters; i++) {
    chapters.push({
      id: `chapter-${mangaId}-${i}`,
      mangaId: mangaId,
      number: i,
      title: `Capítulo ${i}`,
      pages: [
        `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1200&fit=crop&auto=format&q=60&page=${i}&p=1`,
        `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1200&fit=crop&auto=format&q=60&page=${i}&p=2`,
        `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1200&fit=crop&auto=format&q=60&page=${i}&p=3`,
        `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1200&fit=crop&auto=format&q=60&page=${i}&p=4`,
        `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1200&fit=crop&auto=format&q=60&page=${i}&p=5`,
      ],
      releaseDate: `2024-${String(Math.ceil(i / 4)).padStart(2, '0')}-${String(((i - 1) % 4) * 7 + 1).padStart(2, '0')}`,
      readingUrl: null
    });
  }
  
  return chapters;
}

// API para buscar capítulos de um mangá
export async function getChaptersByMangaId(mangaId: string): Promise<Chapter[]> {
  console.log("📖 Getting chapters for manga ID:", mangaId);
  
  // Por enquanto, usar dados mock já que APIs de mangá raramente fornecem capítulos completos
  // No futuro pode integrar com APIs de mangá ou usar dados reais da base de dados
  
  // Gerar número aleatório de capítulos baseado no ID (para consistência)
  const seed = parseInt(mangaId) || mangaId.length;
  const totalChapters = Math.min(Math.max(seed % 200, 10), 500); // Entre 10 e 500 capítulos
  
  const chapters = generateMockChapters(mangaId, totalChapters);
  console.log(`✅ Generated ${chapters.length} chapters for manga ${mangaId}`);
  
  return chapters;
}

// API para buscar um capítulo específico com suas páginas
export async function getChapterById(mangaId: string, chapterNumber: number): Promise<Chapter | null> {
  console.log(`📄 Getting chapter ${chapterNumber} for manga ${mangaId}`);
  
  const chapters = await getChaptersByMangaId(mangaId);
  const chapter = chapters.find(c => c.number === chapterNumber);
  
  if (chapter) {
    console.log(`✅ Found chapter ${chapterNumber}`);
    return chapter;
  }
  
  console.log(`⚠️ Chapter ${chapterNumber} not found`);
  return null;
}

export async function getMangaCategories() {
  return mockMangaCategories;
}

// News API functions - Updated to use Anime News Network
export async function getLatestNews(): Promise<News[]> {
  try {
    const response = await fetch('/api/news/latest?limit=20');
    if (response.ok) {
      const data = await response.json();
      console.log('📰 Latest news from ANN:', data.data?.length || 0, 'items');
      
      // Converter para o formato esperado pelo frontend
      const adaptedNews = data.data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        image: item.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
        category: item.category || 'anime',
        summary: item.description,
        content: item.description,
        source: item.author || 'Anime News Network',
        publishedAt: new Date(item.publishedDate)
      })) || [];
      
      return adaptedNews.length > 0 ? adaptedNews : mockNews;
    }
  } catch (error) {
    console.warn("Failed to fetch latest news from ANN:", error);
  }
  
  console.log("⚠️ Using fallback mock news");
  return mockNews;
}

export async function getNewsByCategory(category: string): Promise<News[]> {
  try {
    const response = await fetch(`/api/news/category/${category}?limit=20`);
    if (response.ok) {
      const data = await response.json();
      console.log(`📰 ${category} news from ANN:`, data.data?.length || 0, 'items');
      
      // Converter para o formato esperado pelo frontend
      const adaptedNews = data.data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        image: item.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
        category: item.category || category,
        summary: item.description,
        content: item.description,
        source: item.author || 'Anime News Network',
        publishedAt: new Date(item.publishedDate)
      })) || [];
      
      return adaptedNews.length > 0 ? adaptedNews : mockNews.filter(news => news.category === category);
    }
  } catch (error) {
    console.warn(`Failed to fetch ${category} news from ANN:`, error);
  }
  
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




// Função para buscar dados completos dos animes em progresso
export async function getProgressAnimesWithDetails() {
  console.log('🔄 Getting progress animes with full details...');
  try {
    const response = await fetch("/api/user/progress");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const progressData = await response.json();
    
    console.log('📋 Progress data:', progressData.length, 'animes');
    
    // Buscar detalhes completos de cada anime
    const animesWithDetails = await Promise.all(
      progressData.map(async (progress: any) => {
        try {
          // Use Jikan API for anime details
          const animeDetails = await getJikanAnimeById(progress.animeId.toString());
          
          if (animeDetails) {
            return {
              ...animeDetails,
              progress: {
                episodesWatched: progress.episodesWatched,
                totalEpisodes: progress.totalEpisodes,
                progressPercent: Math.round((progress.episodesWatched / progress.totalEpisodes) * 100),
                status: progress.status,
                updatedAt: progress.updatedAt
              }
            };
          } else {
            // Fallback com dados básicos se não conseguir buscar detalhes
            return {
              id: progress.animeId,
              title: `Anime ${progress.animeId}`,
              image: "https://via.placeholder.com/400x600",
              progress: {
                episodesWatched: progress.episodesWatched,
                totalEpisodes: progress.totalEpisodes,
                progressPercent: Math.round((progress.episodesWatched / progress.totalEpisodes) * 100),
                status: progress.status,
                updatedAt: progress.updatedAt
              }
            };
          }
        } catch (error) {
          console.warn(`❌ Erro ao buscar detalhes do anime ${progress.animeId}:`, error);
          return {
            id: progress.animeId,
            title: `Anime ${progress.animeId}`,
            image: "https://via.placeholder.com/400x600",
            progress: {
              episodesWatched: progress.episodesWatched,
              totalEpisodes: progress.totalEpisodes,
              progressPercent: Math.round((progress.episodesWatched / progress.totalEpisodes) * 100),
              status: progress.status,
              updatedAt: progress.updatedAt
            }
          };
        }
      })
    );
    
    console.log('✅ Returning', animesWithDetails.length, 'animes with full details');
    return animesWithDetails;
  } catch (error) {
    console.error('❌ Error fetching progress animes with details:', error);
    return [];
  }
}

// Função para buscar animes completados
export async function getCompletedAnimes() {
  console.log('🏆 Getting completed animes...');
  try {
    const response = await fetch("/api/user/completed-animes");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const completedAnimes = await response.json();
    
    console.log('✅ Returning', completedAnimes.length, 'completed animes');
    
    // Os dados já vêm no formato correto do banco de dados
    // Apenas precisamos mapear para garantir consistência no frontend
    return completedAnimes.map((anime: any) => ({
      id: anime.id,
      animeId: anime.animeId,
      animeTitle: anime.animeTitle,
      animeImage: anime.animeImage,
      totalEpisodes: anime.totalEpisodes,
      pointsEarned: anime.pointsEarned,
      completedAt: anime.completedAt
    }));
  } catch (error) {
    console.error('❌ Error fetching completed animes:', error);
    return [];
  }
}
