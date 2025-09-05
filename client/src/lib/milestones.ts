export interface MilestoneData {
  id: string;
  name: string;
  description: string;
  requirement: number;
  type: 'episodes' | 'animes' | 'genres' | 'consecutive_days';
  theme: 'anime' | 'milestone' | 'completion' | 'achievement';
  intensity: 'low' | 'medium' | 'high';
  icon: string;
  reward?: {
    points: number;
    badge?: string;
  };
}

export const MILESTONES: MilestoneData[] = [
  // Marcos de episódios assistidos
  {
    id: 'first_episode',
    name: 'Primeira Jornada',
    description: 'Assistiu seu primeiro episódio!',
    requirement: 1,
    type: 'episodes',
    theme: 'anime',
    intensity: 'medium',
    icon: '🎬',
    reward: { points: 10 }
  },
  {
    id: 'episodes_10',
    name: 'Maratonista Iniciante',
    description: 'Assistiu 10 episódios',
    requirement: 10,
    type: 'episodes',
    theme: 'milestone',
    intensity: 'medium',
    icon: '📺',
    reward: { points: 50 }
  },
  {
    id: 'episodes_50',
    name: 'Otaku em Treinamento',
    description: 'Assistiu 50 episódios',
    requirement: 50,
    type: 'episodes',
    theme: 'milestone',
    intensity: 'high',
    icon: '🏃‍♂️',
    reward: { points: 150, badge: 'otaku_trainee' }
  },
  {
    id: 'episodes_100',
    name: 'Maratonista Veterano',
    description: 'Assistiu 100 episódios',
    requirement: 100,
    type: 'episodes',
    theme: 'achievement',
    intensity: 'high',
    icon: '🏆',
    reward: { points: 300, badge: 'veteran_watcher' }
  },
  {
    id: 'episodes_250',
    name: 'Lenda dos Animes',
    description: 'Assistiu 250 episódios',
    requirement: 250,
    type: 'episodes',
    theme: 'achievement',
    intensity: 'high',
    icon: '👑',
    reward: { points: 500, badge: 'anime_legend' }
  },

  // Marcos de animes completos
  {
    id: 'first_anime',
    name: 'Primeiro Anime Completo',
    description: 'Completou seu primeiro anime!',
    requirement: 1,
    type: 'animes',
    theme: 'completion',
    intensity: 'high',
    icon: '🎯',
    reward: { points: 100 }
  },
  {
    id: 'animes_5',
    name: 'Colecionador',
    description: 'Completou 5 animes',
    requirement: 5,
    type: 'animes',
    theme: 'completion',
    intensity: 'high',
    icon: '📚',
    reward: { points: 250, badge: 'collector' }
  },
  {
    id: 'animes_10',
    name: 'Explorador de Mundos',
    description: 'Completou 10 animes',
    requirement: 10,
    type: 'animes',
    theme: 'achievement',
    intensity: 'high',
    icon: '🌍',
    reward: { points: 500, badge: 'world_explorer' }
  },
  {
    id: 'animes_25',
    name: 'Mestre dos Animes',
    description: 'Completou 25 animes',
    requirement: 25,
    type: 'animes',
    theme: 'achievement',
    intensity: 'high',
    icon: '🧙‍♂️',
    reward: { points: 1000, badge: 'anime_master' }
  },

  // Marcos especiais
  {
    id: 'genre_explorer',
    name: 'Explorador de Gêneros',
    description: 'Assistiu animes de 5 gêneros diferentes',
    requirement: 5,
    type: 'genres',
    theme: 'milestone',
    intensity: 'medium',
    icon: '🎭',
    reward: { points: 200, badge: 'genre_explorer' }
  },
  {
    id: 'consecutive_7_days',
    name: 'Maratonista Semanal',
    description: 'Assistiu animes por 7 dias consecutivos',
    requirement: 7,
    type: 'consecutive_days',
    theme: 'milestone',
    intensity: 'medium',
    icon: '📅',
    reward: { points: 300, badge: 'weekly_marathoner' }
  }
];

// Função para calcular estatísticas do usuário
export function calculateUserStats(): {
  totalEpisodes: number;
  completedAnimes: number;
  watchedGenres: Set<string>;
  consecutiveDays: number;
} {
  // Buscar dados do localStorage
  const watchedEpisodes = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
  const completedAnimes = JSON.parse(localStorage.getItem('completedAnimes') || '[]');
  const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');

  // Calcular total de episódios
  const totalEpisodes = Object.values(watchedEpisodes).reduce((total: number, episodes: any) => {
    return total + (Array.isArray(episodes) ? episodes.length : 0);
  }, 0);

  // Calcular gêneros únicos assistidos
  const watchedGenres = new Set<string>();
  const continueWatching = JSON.parse(localStorage.getItem('continueWatching') || '[]');
  
  continueWatching.forEach((anime: any) => {
    if (anime.genres) {
      anime.genres.forEach((genre: string) => watchedGenres.add(genre));
    }
  });

  // Calcular dias consecutivos (simplificado)
  const consecutiveDays = calculateConsecutiveDays(watchHistory);

  return {
    totalEpisodes,
    completedAnimes: completedAnimes.length,
    watchedGenres,
    consecutiveDays
  };
}

function calculateConsecutiveDays(watchHistory: any[]): number {
  if (!watchHistory.length) return 0;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let consecutiveDays = 0;
  let currentDate = today;
  
  for (let i = 0; i < 30; i++) { // Verificar últimos 30 dias
    const dateStr = currentDate.toDateString();
    const hasWatchedOnDate = watchHistory.some(entry => 
      new Date(entry.date).toDateString() === dateStr
    );
    
    if (hasWatchedOnDate) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return consecutiveDays;
}

// Função para verificar marcos alcançados
export function checkMilestones(): MilestoneData[] {
  const stats = calculateUserStats();
  const achievedMilestones = JSON.parse(localStorage.getItem('achievedMilestones') || '[]');
  const newMilestones: MilestoneData[] = [];

  MILESTONES.forEach(milestone => {
    // Verificar se o marco já foi alcançado
    if (achievedMilestones.includes(milestone.id)) return;

    let achieved = false;

    switch (milestone.type) {
      case 'episodes':
        achieved = stats.totalEpisodes >= milestone.requirement;
        break;
      case 'animes':
        achieved = stats.completedAnimes >= milestone.requirement;
        break;
      case 'genres':
        achieved = stats.watchedGenres.size >= milestone.requirement;
        break;
      case 'consecutive_days':
        achieved = stats.consecutiveDays >= milestone.requirement;
        break;
    }

    if (achieved) {
      newMilestones.push(milestone);
      achievedMilestones.push(milestone.id);
    }
  });

  // Salvar marcos alcançados
  if (newMilestones.length > 0) {
    localStorage.setItem('achievedMilestones', JSON.stringify(achievedMilestones));
  }

  return newMilestones;
}

// Função para registrar atividade de visualização
export function trackWatchActivity(animeId: string, episodeNumber: number) {
  const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Adicionar entrada do histórico
  watchHistory.push({
    animeId,
    episodeNumber,
    date: new Date().toISOString(),
    day: today
  });
  
  localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
  
  // Verificar novos marcos
  return checkMilestones();
}