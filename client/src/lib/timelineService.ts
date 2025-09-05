/**
 * Timeline Service - Gerencia dados da timeline interativa de animes
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