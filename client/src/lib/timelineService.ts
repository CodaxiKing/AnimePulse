/**
 * Timeline Service - Gerencia dados da timeline interativa de animes
 * Inclui integração com progresso do usuário e marcos históricos
 */

export interface TimelineAnime {
  id: number;
  title: string;
  year: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  releaseDate: string;
  image: string;
  synopsis: string;
  genres: string[];
  studio: string;
  score: number;
  popularity: number;
  episodes: number;
  status: 'completed' | 'airing' | 'upcoming';
}

export interface TimelineYear {
  year: number;
  seasons: {
    winter: TimelineAnime[];
    spring: TimelineAnime[];
    summer: TimelineAnime[];
    fall: TimelineAnime[];
  };
  totalAnimes: number;
}

export interface TimelineFilter {
  genres: string[];
  studios: string[];
  minScore: number;
  status: string[];
  decade?: string;
  userStatus?: ('watching' | 'completed' | 'plan_to_watch' | 'dropped')[];
}

export interface HistoricalMilestone {
  year: number;
  title: string;
  description: string;
  type: 'technology' | 'cultural' | 'industry' | 'awards';
  animeIds?: number[];
}

export interface TimelineStats {
  totalAnimes: number;
  completedAnimes: number;
  watchingAnimes: number;
  plannedAnimes: number;
  droppedAnimes: number;
  totalWatchTime: number; // em horas
  averageScore: number;
}

/**
 * Converte dados do MAL para formato de timeline
 */
export function convertMalToTimelineAnime(malAnime: any): TimelineAnime {
  const releaseDate = malAnime.start_date || '2024-01-01';
  const year = new Date(releaseDate).getFullYear();
  const month = new Date(releaseDate).getMonth();
  
  // Determinar temporada baseada no mês
  let season: 'winter' | 'spring' | 'summer' | 'fall';
  if (month >= 0 && month <= 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'fall';

  return {
    id: malAnime.id,
    title: malAnime.title,
    year,
    season,
    releaseDate,
    image: malAnime.main_picture?.large || malAnime.main_picture?.medium || '',
    synopsis: malAnime.synopsis || 'Sinopse não disponível',
    genres: malAnime.genres?.map((g: any) => g.name) || [],
    studio: malAnime.studios?.[0]?.name || 'Estúdio desconhecido',
    score: malAnime.mean || 0,
    popularity: malAnime.popularity || 0,
    episodes: malAnime.num_episodes || 12,
    status: malAnime.status === 'currently_airing' ? 'airing' : 
            malAnime.status === 'not_yet_aired' ? 'upcoming' : 'completed'
  };
}

/**
 * Organiza animes por anos e temporadas
 */
export function organizeAnimesByTimeline(animes: TimelineAnime[]): TimelineYear[] {
  const timelineMap = new Map<number, TimelineYear>();

  animes.forEach(anime => {
    if (!timelineMap.has(anime.year)) {
      timelineMap.set(anime.year, {
        year: anime.year,
        seasons: {
          winter: [],
          spring: [],
          summer: [],
          fall: []
        },
        totalAnimes: 0
      });
    }

    const yearData = timelineMap.get(anime.year)!;
    yearData.seasons[anime.season].push(anime);
    yearData.totalAnimes++;
  });

  return Array.from(timelineMap.values()).sort((a, b) => b.year - a.year);
}

/**
 * Filtra animes da timeline baseado nos critérios
 */
export function filterTimelineAnimes(
  timelineData: TimelineYear[], 
  filters: TimelineFilter
): TimelineYear[] {
  return timelineData.map(yearData => {
    const filteredSeasons = {
      winter: filterSeasonAnimes(yearData.seasons.winter, filters),
      spring: filterSeasonAnimes(yearData.seasons.spring, filters),
      summer: filterSeasonAnimes(yearData.seasons.summer, filters),
      fall: filterSeasonAnimes(yearData.seasons.fall, filters)
    };

    const totalFiltered = Object.values(filteredSeasons).reduce(
      (sum, season) => sum + season.length, 0
    );

    return {
      ...yearData,
      seasons: filteredSeasons,
      totalAnimes: totalFiltered
    };
  }).filter(yearData => yearData.totalAnimes > 0);
}

function filterSeasonAnimes(animes: TimelineAnime[], filters: TimelineFilter): TimelineAnime[] {
  return animes.filter(anime => {
    // Filtro por gênero
    if (filters.genres.length > 0) {
      const hasGenre = filters.genres.some(genre => 
        anime.genres.some(animeGenre => 
          animeGenre.toLowerCase().includes(genre.toLowerCase())
        )
      );
      if (!hasGenre) return false;
    }

    // Filtro por estúdio
    if (filters.studios.length > 0) {
      const hasStudio = filters.studios.some(studio => 
        anime.studio.toLowerCase().includes(studio.toLowerCase())
      );
      if (!hasStudio) return false;
    }

    // Filtro por score mínimo
    if (anime.score < filters.minScore) return false;

    // Filtro por status
    if (filters.status.length > 0 && !filters.status.includes(anime.status)) {
      return false;
    }

    return true;
  });
}

/**
 * Obtém anos disponíveis para navegação rápida
 */
export function getAvailableYears(timelineData: TimelineYear[]): number[] {
  return timelineData.map(data => data.year).sort((a, b) => b - a);
}

/**
 * Obtém décadas disponíveis
 */
export function getAvailableDecades(timelineData: TimelineYear[]): string[] {
  const decades = new Set<string>();
  timelineData.forEach(data => {
    const decade = `${Math.floor(data.year / 10) * 10}s`;
    decades.add(decade);
  });
  return Array.from(decades).sort().reverse();
}

/**
 * Tradução de temporadas
 */
export const seasonNames = {
  winter: 'Inverno',
  spring: 'Primavera', 
  summer: 'Verão',
  fall: 'Outono'
} as const;

/**
 * Cores das temporadas
 */
export const seasonColors = {
  winter: 'from-blue-400 to-cyan-300',
  spring: 'from-green-400 to-emerald-300',
  summer: 'from-yellow-400 to-orange-300',
  fall: 'from-orange-400 to-red-300'
} as const;

/**
 * Ícones das temporadas
 */
export const seasonIcons = {
  winter: '❄️',
  spring: '🌸',
  summer: '☀️',
  fall: '🍂'
} as const;

/**
 * Marcos históricos do anime
 */
export const historicalMilestones: HistoricalMilestone[] = [
  {
    year: 2024,
    title: 'Era do Streaming Global',
    description: 'Plataformas de streaming dominam a distribuição de anime mundialmente.',
    type: 'technology'
  },
  {
    year: 2023,
    title: 'Boom dos Animes Isekai',
    description: 'Gênero isekai atinge pico de popularidade com dezenas de novos títulos.',
    type: 'cultural'
  },
  {
    year: 2020,
    title: 'Demon Slayer Phänomen',
    description: 'Demon Slayer quebra recordes de bilheteria e popularidade global.',
    type: 'cultural',
    animeIds: [38000]
  },
  {
    year: 2019,
    title: 'Your Name Global Impact',
    description: 'Your Name se torna o anime de maior sucesso comercial da década.',
    type: 'cultural'
  },
  {
    year: 2016,
    title: 'Ascensão do Studio Trigger',
    description: 'Studio Trigger ganha reconhecimento mundial com Kill la Kill e Little Witch Academia.',
    type: 'industry'
  },
  {
    year: 2013,
    title: 'Attack on Titan Revolution',
    description: 'Attack on Titan redefine o que significa um anime de sucesso global.',
    type: 'cultural'
  },
  {
    year: 2009,
    title: 'Era Digital Madura',
    description: 'Transição completa para animação digital em todos os grandes estúdios.',
    type: 'technology'
  },
  {
    year: 2003,
    title: 'Toonami e Globalização',
    description: 'Toonami populariza anime no Ocidente com Dragon Ball Z e Naruto.',
    type: 'cultural'
  },
  {
    year: 1997,
    title: 'Princess Mononoke Época',
    description: 'Studio Ghibli atinge maturidade artística com Princess Mononoke.',
    type: 'cultural'
  },
  {
    year: 1995,
    title: 'Evangelion Impact',
    description: 'Neon Genesis Evangelion revoluciona narrativa e psicologia no anime.',
    type: 'cultural'
  },
  {
    year: 1988,
    title: 'Akira Milestone',
    description: 'Akira estabelece o anime como forma de arte séria mundialmente.',
    type: 'cultural'
  }
];

/**
 * Obtém marcos históricos para um ano específico
 */
export function getMilestonesForYear(year: number): HistoricalMilestone[] {
  return historicalMilestones.filter(milestone => milestone.year === year);
}

/**
 * Calcula estatísticas da timeline baseado no progresso do usuário
 */
export function calculateTimelineStats(animes: TimelineAnime[], userProgress: any[]): TimelineStats {
  const progressMap = new Map(userProgress.map(p => [p.animeId, p]));
  
  let totalWatchTime = 0;
  let totalScore = 0;
  let scoredCount = 0;
  
  const stats = {
    totalAnimes: animes.length,
    completedAnimes: 0,
    watchingAnimes: 0,
    plannedAnimes: 0,
    droppedAnimes: 0,
    totalWatchTime: 0,
    averageScore: 0
  };
  
  animes.forEach(anime => {
    const progress = progressMap.get(anime.id);
    if (progress) {
      switch (progress.status) {
        case 'completed':
          stats.completedAnimes++;
          totalWatchTime += anime.episodes * 24; // 24min por episódio
          break;
        case 'watching':
          stats.watchingAnimes++;
          totalWatchTime += progress.episodesWatched * 24;
          break;
        case 'plan_to_watch':
          stats.plannedAnimes++;
          break;
        case 'dropped':
          stats.droppedAnimes++;
          totalWatchTime += progress.episodesWatched * 24;
          break;
      }
      
      if (progress.score) {
        totalScore += progress.score;
        scoredCount++;
      }
    }
  });
  
  stats.totalWatchTime = Math.round(totalWatchTime / 60); // converter para horas
  stats.averageScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : 0;
  
  return stats;
}

/**
 * Busca animes por década
 */
export function getAnimesByDecade(timelineData: TimelineYear[], decade: string): TimelineAnime[] {
  const startYear = parseInt(decade.replace('s', ''));
  const endYear = startYear + 9;
  
  return timelineData
    .filter(yearData => yearData.year >= startYear && yearData.year <= endYear)
    .flatMap(yearData => [
      ...yearData.seasons.winter,
      ...yearData.seasons.spring,
      ...yearData.seasons.summer,
      ...yearData.seasons.fall
    ]);
}

/**
 * Gera cores dinâmicas para gêneros
 */
export function getGenreColor(genre: string): string {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
    'bg-orange-500', 'bg-teal-500'
  ];
  
  const hash = genre.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}