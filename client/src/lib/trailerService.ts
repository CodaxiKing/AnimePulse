// Serviço para gerenciar trailers de anime

interface AnimeTrailer {
  trailerUrl: string;
  title: string;
  duration: string;
  quality: string;
}

// Base de trailers oficiais do YouTube
const OFFICIAL_TRAILERS: Record<string, AnimeTrailer> = {
  'One Piece': {
    trailerUrl: 'https://www.youtube.com/embed/MCb13lbVGE0',
    title: 'One Piece - Official Trailer',
    duration: '2:15',
    quality: '1080p HD'
  },
  'Demon Slayer': {
    trailerUrl: 'https://www.youtube.com/embed/VQGCKyvzIM4',
    title: 'Demon Slayer - Official Trailer',
    duration: '1:45',
    quality: '1080p HD'
  },
  'Kimetsu no Yaiba': {
    trailerUrl: 'https://www.youtube.com/embed/VQGCKyvzIM4',
    title: 'Kimetsu no Yaiba - Official Trailer',
    duration: '1:45',
    quality: '1080p HD'
  },
  'Attack on Titan': {
    trailerUrl: 'https://www.youtube.com/embed/LHtdKWJdif4',
    title: 'Attack on Titan Final Season - Official Trailer',
    duration: '2:30',
    quality: '1080p HD'
  },
  'My Hero Academia': {
    trailerUrl: 'https://www.youtube.com/embed/D5fYOnwYkj4',
    title: 'My Hero Academia - Official Trailer',
    duration: '1:55',
    quality: '1080p HD'
  },
  'Naruto': {
    trailerUrl: 'https://www.youtube.com/embed/1dy2zPPrKD0',
    title: 'Naruto - Official Trailer',
    duration: '2:10',
    quality: '1080p HD'
  },
  'Jujutsu Kaisen': {
    trailerUrl: 'https://www.youtube.com/embed/4A_X-Dvl0ws',
    title: 'Jujutsu Kaisen - Official Trailer',
    duration: '1:50',
    quality: '1080p HD'
  },
  'Dragon Ball': {
    trailerUrl: 'https://www.youtube.com/embed/2pYhM8OcQJs',
    title: 'Dragon Ball Super - Official Trailer',
    duration: '2:00',
    quality: '1080p HD'
  },
  'Solo Leveling': {
    trailerUrl: 'https://www.youtube.com/embed/hBLBJmm4dYs',
    title: 'Solo Leveling - Official Trailer',
    duration: '1:32',
    quality: '1080p HD'
  },
  'Chainsaw Man': {
    trailerUrl: 'https://www.youtube.com/embed/dFlDRhvM4L0',
    title: 'Chainsaw Man - Official Trailer',
    duration: '1:48',
    quality: '1080p HD'
  },
  'Kaoru Hana wa Rin to Saku': {
    trailerUrl: 'https://www.youtube.com/embed/3qhKBiC3aDU',
    title: 'Kaoru Hana wa Rin to Saku - Official Trailer',
    duration: '1:30',
    quality: '1080p HD'
  },
  'Romance': {
    trailerUrl: 'https://www.youtube.com/embed/3qhKBiC3aDU',
    title: 'Romance Anime - Official Trailer',
    duration: '1:30',
    quality: '1080p HD'
  }
};

/**
 * Buscar trailer oficial para um anime
 */
export function getAnimeTrailer(animeTitle: string): AnimeTrailer | null {
  console.log(`🎬 Buscando trailer para: "${animeTitle}"`);
  
  // Busca exata primeiro
  for (const [dbTitle, trailer] of Object.entries(OFFICIAL_TRAILERS)) {
    if (animeTitle.toLowerCase().includes(dbTitle.toLowerCase())) {
      console.log(`🎥 TRAILER ENCONTRADO: "${dbTitle}" -> ${trailer.title}`);
      return trailer;
    }
  }

  // Busca por palavras-chave
  const titleWords = animeTitle.toLowerCase().split(' ');
  for (const word of titleWords) {
    if (word.length < 4) continue;
    
    for (const [dbTitle, trailer] of Object.entries(OFFICIAL_TRAILERS)) {
      if (dbTitle.toLowerCase().includes(word)) {
        console.log(`🔍 PALAVRA-CHAVE MATCH: "${word}" -> "${dbTitle}"`);
        return trailer;
      }
    }
  }

  console.log(`❌ Nenhum trailer encontrado para "${animeTitle}"`);
  return null;
}

/**
 * Verificar se um anime tem trailer disponível
 */
export function hasTrailer(animeTitle: string): boolean {
  return getAnimeTrailer(animeTitle) !== null;
}

/**
 * Listar todos os animes com trailers disponíveis
 */
export function getAvailableTrailers(): string[] {
  return Object.keys(OFFICIAL_TRAILERS);
}