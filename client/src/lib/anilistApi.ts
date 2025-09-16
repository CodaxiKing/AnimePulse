// AniList GraphQL API Integration - API principal para dados de anime/manga
import type { Anime, Manga } from "@shared/schema";

// Base URL da AniList GraphQL API
const ANILIST_API_BASE = "https://graphql.anilist.co";

// Tipos específicos da API AniList
interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage: {
    large: string;
    medium: string;
    color?: string;
  };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  duration?: number;
  status: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  season?: string;
  seasonYear?: number;
  genres?: string[];
  studios?: {
    nodes: Array<{
      name: string;
      isAnimationStudio: boolean;
    }>;
  };
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  format?: string;
  source?: string;
  isAdult?: boolean;
  trending?: number;
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring: number;
  };
  trailer?: {
    id?: string;
    site?: string;
    thumbnail?: string;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english?: string;
        };
        coverImage: {
          medium: string;
        };
        type: string;
        format?: string;
        status: string;
      };
    }>;
  };
  characters?: {
    edges: Array<{
      role: string;
      node: {
        id: number;
        name: {
          full: string;
        };
        image: {
          medium: string;
        };
      };
      voiceActors?: Array<{
        id: number;
        name: {
          full: string;
        };
        image: {
          medium: string;
        };
      }>;
    }>;
  };
}

interface AniListManga {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage: {
    large: string;
    medium: string;
    color?: string;
  };
  bannerImage?: string;
  description?: string;
  chapters?: number;
  volumes?: number;
  status: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  genres?: string[];
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  format?: string;
  source?: string;
  isAdult?: boolean;
  staff?: {
    nodes: Array<{
      name: {
        full: string;
      };
    }>;
  };
}

interface AniListResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    status?: number;
  }>;
}

// Função auxiliar para fazer requisições GraphQL
async function anilistRequest<T>(query: string, variables: any = {}): Promise<T> {
  try {
    const response = await fetch(ANILIST_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AnimePulse/1.0'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
    }

    const result: AniListResponse<T> = await response.json();
    
    if (result.errors) {
      throw new Error(`AniList GraphQL error: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // Rate limiting preventivo (1 requisição por segundo)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return result.data;
  } catch (error) {
    console.error(`Error fetching from AniList API:`, error);
    throw error;
  }
}

// GraphQL Queries
const TRENDING_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description
        episodes
        duration
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        season
        seasonYear
        genres
        studios {
          nodes {
            name
            isAnimationStudio
          }
        }
        averageScore
        meanScore
        popularity
        favourites
        format
        source
        trending
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
        trailer {
          id
          site
          thumbnail
        }
      }
    }
  }
`;

const TOP_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description
        episodes
        duration
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        season
        seasonYear
        genres
        studios {
          nodes {
            name
            isAnimationStudio
          }
        }
        averageScore
        meanScore
        popularity
        favourites
        format
        source
        trailer {
          id
          site
          thumbnail
        }
      }
    }
  }
`;

const ANIME_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
        color
      }
      bannerImage
      description
      episodes
      duration
      status
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      genres
      studios {
        nodes {
          name
          isAnimationStudio
        }
      }
      averageScore
      meanScore
      popularity
      favourites
      format
      source
      nextAiringEpisode {
        episode
        timeUntilAiring
      }
      trailer {
        id
        site
        thumbnail
      }
      relations {
        edges {
          relationType
          node {
            id
            title {
              romaji
              english
            }
            coverImage {
              medium
            }
            type
            format
            status
          }
        }
      }
      characters(sort: ROLE, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              medium
            }
          }
          voiceActors(language: JAPANESE, sort: FAVOURITES_DESC) {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
    }
  }
`;

const SEARCH_ANIME_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, search: $search, isAdult: false, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description
        episodes
        duration
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        season
        seasonYear
        genres
        studios {
          nodes {
            name
            isAnimationStudio
          }
        }
        averageScore
        meanScore
        popularity
        favourites
        format
        source
        trailer {
          id
          site
          thumbnail
        }
      }
    }
  }
`;

const TOP_MANGA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description
        chapters
        volumes
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        genres
        averageScore
        meanScore
        popularity
        favourites
        format
        source
        staff {
          nodes {
            name {
              full
            }
          }
        }
      }
    }
  }
`;

const MANGA_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
        color
      }
      bannerImage
      description
      chapters
      volumes
      status
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      genres
      averageScore
      meanScore
      popularity
      favourites
      format
      source
      staff {
        nodes {
          name {
            full
          }
        }
      }
    }
  }
`;

const SEARCH_MANGA_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, search: $search, isAdult: false, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        bannerImage
        description
        chapters
        volumes
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        genres
        averageScore
        meanScore
        popularity
        favourites
        format
        source
        staff {
          nodes {
            name {
              full
            }
          }
        }
      }
    }
  }
`;

// Função para converter anime AniList para formato interno
function convertAniListAnimeToAnime(anilistAnime: AniListAnime): Anime {
  const title = anilistAnime.title.english || anilistAnime.title.romaji || 'Título não disponível';
  const studio = anilistAnime.studios?.nodes?.find(s => s.isAnimationStudio)?.name || 'Estúdio não informado';
  const year = anilistAnime.startDate?.year || anilistAnime.seasonYear || new Date().getFullYear();
  const releaseDate = anilistAnime.startDate 
    ? `${anilistAnime.startDate.year}-${String(anilistAnime.startDate.month || 1).padStart(2, '0')}-${String(anilistAnime.startDate.day || 1).padStart(2, '0')}`
    : '';

  // Construir URL do trailer se disponível
  let trailerUrl = null;
  if (anilistAnime.trailer?.id && anilistAnime.trailer?.site) {
    if (anilistAnime.trailer.site.toLowerCase() === 'youtube') {
      trailerUrl = `https://www.youtube.com/embed/${anilistAnime.trailer.id}`;
    }
  }

  // Processar relations
  const relations = anilistAnime.relations?.edges?.map(edge => JSON.stringify({
    type: edge.relationType,
    id: edge.node.id,
    title: edge.node.title.english || edge.node.title.romaji,
    image: edge.node.coverImage.medium,
    mediaType: edge.node.type,
    format: edge.node.format,
    status: edge.node.status
  })) || [];

  // Processar characters
  const characters = anilistAnime.characters?.edges?.map(edge => JSON.stringify({
    role: edge.role,
    id: edge.node.id,
    name: edge.node.name.full,
    image: edge.node.image.medium,
    voiceActor: edge.voiceActors?.[0] ? {
      id: edge.voiceActors[0].id,
      name: edge.voiceActors[0].name.full,
      image: edge.voiceActors[0].image.medium
    } : null
  })) || [];

  return {
    id: anilistAnime.id.toString(),
    title,
    image: anilistAnime.coverImage.large || anilistAnime.coverImage.medium,
    studio,
    year,
    genres: anilistAnime.genres || [],
    synopsis: anilistAnime.description?.replace(/<[^>]*>/g, '') || 'Sinopse não disponível',
    releaseDate,
    status: anilistAnime.status?.toLowerCase() || 'unknown',
    totalEpisodes: anilistAnime.episodes || 0,
    rating: (anilistAnime.averageScore || anilistAnime.meanScore || 0).toString(),
    viewCount: anilistAnime.popularity || 0,
    trailerUrl,
    relations,
    characters
  };
}

// Função para converter manga AniList para formato interno
function convertAniListMangaToManga(anilistManga: AniListManga): Manga {
  const title = anilistManga.title.english || anilistManga.title.romaji || 'Título não disponível';
  const author = anilistManga.staff?.nodes?.[0]?.name?.full || 'Autor não informado';
  const year = anilistManga.startDate?.year || new Date().getFullYear();

  return {
    id: anilistManga.id.toString(),
    title,
    image: anilistManga.coverImage.large || anilistManga.coverImage.medium,
    author,
    latestChapter: anilistManga.chapters || 0,
    genres: anilistManga.genres || [],
    synopsis: anilistManga.description?.replace(/<[^>]*>/g, '') || 'Sinopse não disponível',
    status: anilistManga.status?.toLowerCase() || 'unknown',
    rating: (anilistManga.averageScore || anilistManga.meanScore || 0).toString()
  };
}

// Buscar animes trending/populares
export async function getAniListTrendingAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🔥 Fetching trending anime from AniList API...");
    
    const response = await anilistRequest<{ Page: { media: AniListAnime[] } }>(
      TRENDING_ANIME_QUERY,
      { page: 1, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const animes = response.Page.media.map(convertAniListAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} trending anime from AniList`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching trending anime from AniList:", error);
    throw error; // Re-throw para permitir fallback
  }
}

// Buscar top animes
export async function getAniListTopAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🏆 Fetching top anime from AniList API...");
    
    const response = await anilistRequest<{ Page: { media: AniListAnime[] } }>(
      TOP_ANIME_QUERY,
      { page: 1, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const animes = response.Page.media.map(convertAniListAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} top anime from AniList`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching top anime from AniList:", error);
    throw error;
  }
}

// Buscar anime por ID
export async function getAniListAnimeById(id: string): Promise<Anime | null> {
  try {
    console.log(`🎯 Fetching anime details for ID: ${id} from AniList...`);
    
    const response = await anilistRequest<{ Media: AniListAnime }>(
      ANIME_BY_ID_QUERY,
      { id: parseInt(id) }
    );
    
    if (response.Media) {
      const anime = convertAniListAnimeToAnime(response.Media);
      console.log(`✅ Found anime details from AniList: ${anime.title}`);
      return anime;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching anime ${id} from AniList:`, error);
    throw error;
  }
}

// Buscar animes por termo
export async function searchAniListAnime(query: string, limit: number = 25): Promise<Anime[]> {
  try {
    console.log(`🔍 Searching anime on AniList: "${query}"`);
    
    const response = await anilistRequest<{ Page: { media: AniListAnime[] } }>(
      SEARCH_ANIME_QUERY,
      { search: query, page: 1, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const animes = response.Page.media.map(convertAniListAnimeToAnime);
      console.log(`✅ Found ${animes.length} anime results from AniList`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Error searching anime on AniList:`, error);
    throw error;
  }
}

// Buscar top mangas
export async function getAniListTopManga(limit: number = 25): Promise<Manga[]> {
  try {
    console.log("📚 Fetching top manga from AniList API...");
    
    const response = await anilistRequest<{ Page: { media: AniListManga[] } }>(
      TOP_MANGA_QUERY,
      { page: 1, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const mangas = response.Page.media.map(convertAniListMangaToManga);
      console.log(`✅ Fetched ${mangas.length} top manga from AniList`);
      return mangas;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching top manga from AniList:", error);
    throw error;
  }
}

// Buscar manga por ID
export async function getAniListMangaById(id: string): Promise<Manga | null> {
  try {
    console.log(`📖 Fetching manga details for ID: ${id} from AniList...`);
    
    const response = await anilistRequest<{ Media: AniListManga }>(
      MANGA_BY_ID_QUERY,
      { id: parseInt(id) }
    );
    
    if (response.Media) {
      const manga = convertAniListMangaToManga(response.Media);
      console.log(`✅ Found manga details from AniList: ${manga.title}`);
      return manga;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching manga ${id} from AniList:`, error);
    throw error;
  }
}

// Buscar mangas por termo
export async function searchAniListManga(query: string, limit: number = 25): Promise<Manga[]> {
  try {
    console.log(`🔍 Searching manga on AniList: "${query}"`);
    
    const response = await anilistRequest<{ Page: { media: AniListManga[] } }>(
      SEARCH_MANGA_QUERY,
      { search: query, page: 1, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const mangas = response.Page.media.map(convertAniListMangaToManga);
      console.log(`✅ Found ${mangas.length} manga results from AniList`);
      return mangas;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Error searching manga on AniList:`, error);
    throw error;
  }
}

// Buscar animes da temporada atual (usando SEASON_NOW do AniList)
export async function getAniListSeasonalAnime(limit: number = 25): Promise<Anime[]> {
  try {
    console.log("🌸 Fetching seasonal anime from AniList API...");
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Determinar temporada atual
    const month = currentDate.getMonth() + 1;
    let season = 'SPRING';
    if (month >= 12 || month <= 2) season = 'WINTER';
    else if (month >= 3 && month <= 5) season = 'SPRING';
    else if (month >= 6 && month <= 8) season = 'SUMMER';
    else if (month >= 9 && month <= 11) season = 'FALL';
    
    const seasonQuery = `
      query ($season: MediaSeason, $year: Int, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(type: ANIME, season: $season, seasonYear: $year, isAdult: false, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
              color
            }
            bannerImage
            description
            episodes
            duration
            status
            startDate {
              year
              month
              day
            }
            season
            seasonYear
            genres
            studios {
              nodes {
                name
                isAnimationStudio
              }
            }
            averageScore
            meanScore
            popularity
            favourites
            format
            source
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
          }
        }
      }
    `;
    
    const response = await anilistRequest<{ Page: { media: AniListAnime[] } }>(
      seasonQuery,
      { season, year: currentYear, perPage: limit }
    );
    
    if (response.Page.media && Array.isArray(response.Page.media)) {
      const animes = response.Page.media.map(convertAniListAnimeToAnime);
      console.log(`✅ Fetched ${animes.length} seasonal anime from AniList`);
      return animes;
    }
    
    return [];
  } catch (error) {
    console.error("❌ Error fetching seasonal anime from AniList:", error);
    throw error;
  }
}

// Função auxiliar para obter detalhes completos do anime para exibição
export async function getAniListAnimeDetails(id: string): Promise<Anime | null> {
  return await getAniListAnimeById(id);
}

// Função auxiliar para obter detalhes completos do manga para exibição  
export async function getAniListMangaDetails(id: string): Promise<Manga | null> {
  return await getAniListMangaById(id);
}

// Função para buscar múltiplas páginas de animes trending (para coletar mais dados)
export async function getAniListTrendingAnimeMultiPage(pages: number = 5, perPage: number = 25): Promise<Anime[]> {
  try {
    console.log(`🚀 Fetching ${pages} pages of trending anime from AniList...`);
    
    const allAnimes: Anime[] = [];
    
    for (let page = 1; page <= pages; page++) {
      try {
        const response = await anilistRequest<{ Page: { media: AniListAnime[] } }>(
          TRENDING_ANIME_QUERY,
          { page, perPage }
        );
        
        if (response.Page.media && Array.isArray(response.Page.media)) {
          const animes = response.Page.media.map(convertAniListAnimeToAnime);
          allAnimes.push(...animes);
          console.log(`✅ Page ${page}: +${animes.length} animes (Total: ${allAnimes.length})`);
        }
        
        // Rate limiting entre páginas
        if (page < pages) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.warn(`❌ Error on page ${page}:`, error);
        // Continuar com as próximas páginas mesmo se uma falhar
      }
    }
    
    console.log(`🎉 Collected ${allAnimes.length} trending animes from AniList`);
    return allAnimes;
  } catch (error) {
    console.error("❌ Error fetching multi-page trending anime from AniList:", error);
    throw error;
  }
}