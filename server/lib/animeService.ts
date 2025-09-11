interface AnimeData {
  id: string;
  title: string;
  image: string;
  studio?: string;
  year?: number;
  genres: string[];
  synopsis: string;
  releaseDate: string;
  status: string;
  totalEpisodes: number;
  rating: string;
  viewCount?: number;
  type?: string;
  subOrDub?: string;
  url?: string;
}

interface EpisodeData {
  id: string;
  animeId: string;
  number: number;
  title: string;
  thumbnail: string;
  duration: string;
  releaseDate: string;
  streamingUrl?: string;
  downloadUrl?: string;
  subOrDub?: string;
  url?: string;
}

export class AnimeStreamingService {
  // URLs das principais APIs de anime
  private readonly CONSUMET_API = 'https://api.consumet.org';
  private readonly ANBU_API = 'https://anbuanime.onrender.com';
  private readonly BACKUP_API = 'https://gogoanime.consumet.stream';

  // Timeout para requisições
  private readonly REQUEST_TIMEOUT = 15000;

  private async fetchWithTimeout(url: string, timeout: number = this.REQUEST_TIMEOUT): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AnimePulse/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Buscar anime por nome
  async searchAnime(query: string, page: number = 1): Promise<AnimeData[]> {
    const searchEndpoints = [
      `${this.CONSUMET_API}/anime/gogoanime/${encodeURIComponent(query)}?page=${page}`,
      `${this.ANBU_API}/search/${encodeURIComponent(query)}?page=${page}`,
      `${this.BACKUP_API}/search/${encodeURIComponent(query)}?page=${page}`
    ];

    console.log(`🔍 Searching for: "${query}" on page ${page}`);

    for (const endpoint of searchEndpoints) {
      try {
        console.log(`🔥 Tentando buscar em: ${endpoint}`);
        const data = await this.fetchWithTimeout(endpoint);
        
        if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
          console.log(`✅ Encontrados ${data.results.length} animes na pesquisa`);
          return data.results.map((item: any) => this.adaptAnimeData(item));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Falha no endpoint ${endpoint}: ${errorMessage}`);
      }
    }

    console.log(`⚠️ Nenhum resultado encontrado para "${query}", retornando dados mock`);
    return this.getMockAnimeData().filter(anime => 
      anime.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Buscar animes em alta (trending/airing)
  async getTrendingAnime(page: number = 1): Promise<AnimeData[]> {
    // Usar API do Jikan para buscar TODOS os animes disponíveis
    const jikanEndpoints = [
      // Top animes (muitas páginas)
      ...Array.from({length: 100}, (_, i) => `https://api.jikan.moe/v4/top/anime?limit=25&page=${i + 1}`),
      // Ordenação por popularidade
      ...Array.from({length: 100}, (_, i) => `https://api.jikan.moe/v4/anime?order_by=popularity&limit=25&page=${i + 1}`),
      // Ordenação por score
      ...Array.from({length: 50}, (_, i) => `https://api.jikan.moe/v4/anime?order_by=score&limit=25&page=${i + 1}`),
      // Temporadas atuais
      ...Array.from({length: 10}, (_, i) => `https://api.jikan.moe/v4/seasons/now?limit=25&page=${i + 1}`),
    ];

    let allAnimes: AnimeData[] = [];
    let processedCount = 0;
    const maxEndpoints = 20; // REDUZIR dramaticamente para melhor performance
    
    console.log(`🚀 Buscando animes da API do Jikan (otimizado para velocidade)...`);

    // Usar apenas os endpoints mais eficientes
    const priorityEndpoints = jikanEndpoints.slice(0, maxEndpoints);

    for (const endpoint of priorityEndpoints) {
      try {
        const data = await this.fetchWithTimeout(endpoint, 8000);
        
        if (data?.data && Array.isArray(data.data)) {
          // Converter dados do Jikan para formato interno
          const animes = data.data.map((anime: any) => this.adaptJikanAnimeData(anime));
          
          // Adicionar apenas animes únicos
          animes.forEach(anime => {
            if (!allAnimes.find(existing => existing.id === anime.id)) {
              allAnimes.push(anime);
            }
          });
          
          processedCount++;
          console.log(`⚡ Endpoint ${processedCount}: +${animes.length} animes (Total: ${allAnimes.length})`);
          
          // PARAR MAIS CEDO se já temos animes suficientes
          if (allAnimes.length >= 300) {
            console.log(`🎯 Atingido limite de 300+ animes, parando busca para otimizar velocidade`);
            break;
          }
        }
        
        // Rate limiting mais conservador para evitar 429 errors
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (errorMsg.includes('429')) {
          console.warn(`⏳ Rate limit atingido, aguardando mais tempo...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar mais se for rate limit
        } else {
          console.warn(`❌ Erro no endpoint:`, errorMsg);
        }
      }
    }

    if (allAnimes.length > 0) {
      console.log(`🎉 SUCESSO! Coletados ${allAnimes.length} animes únicos da API do Jikan`);
      return allAnimes;
    }

    console.log('⚠️ Fallback para dados mock');
    return this.getMockAnimeData();
  }

  // Buscar episódios recentes
  async getRecentEpisodes(page: number = 1, type: number = 1): Promise<EpisodeData[]> {
    const endpoints = [
      `${this.CONSUMET_API}/anime/gogoanime/recent-episodes?page=${page}&type=${type}`,
      `${this.ANBU_API}/recent-release?type=${type}&page=${page}`,
      `${this.BACKUP_API}/recent-release?type=${type}&page=${page}`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📺 Tentando buscar episódios recentes de: ${endpoint}`);
        
        const data = await this.fetchWithTimeout(endpoint);
        
        if (data && (data.results || Array.isArray(data))) {
          const results = data.results || data;
          const episodes = results.map((episode: any) => this.adaptEpisodeData(episode));
          
          console.log(`✅ Sucesso! Encontrados ${episodes.length} episódios recentes`);
          return episodes;
        }
      } catch (error) {
        console.warn(`❌ Falha no endpoint ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log('⚠️ Todos os endpoints falharam, retornando dados mock de episódios');
    return this.getMockEpisodeData();
  }

  // Buscar anime por ID
  async getAnimeById(id: string): Promise<AnimeData | null> {
    const endpoints = [
      `${this.CONSUMET_API}/anime/gogoanime/info/${id}`,
      `${this.ANBU_API}/anime-details/${id}`,
      `${this.BACKUP_API}/anime-details/${id}`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Buscando detalhes do anime ${id} em: ${endpoint}`);
        
        const data = await this.fetchWithTimeout(endpoint);
        
        if (data && (data.id || data.animeTitle)) {
          const anime = this.adaptAnimeData(data);
          console.log(`✅ Detalhes do anime ${id} encontrados`);
          return anime;
        }
      } catch (error) {
        console.warn(`❌ Falha no endpoint ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`⚠️ Não foi possível encontrar detalhes para o anime ${id}`);
    return null;
  }


  // Buscar episódios de um anime
  async getAnimeEpisodes(animeId: string): Promise<EpisodeData[]> {
    try {
      const animeInfo = await this.getAnimeById(animeId);
      
      if (animeInfo && (animeInfo as any).episodes) {
        const episodes = (animeInfo as any).episodes.map((episode: any) => this.adaptEpisodeData(episode, animeId));
        console.log(`✅ Encontrados ${episodes.length} episódios para ${animeId}`);
        return episodes;
      }
    } catch (error) {
      console.warn(`❌ Erro ao buscar episódios de ${animeId}:`, error);
    }

    console.log(`⚠️ Usando episódios mock para ${animeId}`);
    return this.getMockEpisodeData(animeId);
  }

  // Obter link de streaming de um episódio
  async getEpisodeStreamingUrl(episodeId: string): Promise<string | null> {
    const endpoints = [
      `${this.CONSUMET_API}/anime/gogoanime/watch/${episodeId}`,
      `${this.ANBU_API}/vidcdn/watch/${episodeId}`,
      `${this.BACKUP_API}/vidcdn/watch/${episodeId}`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🎬 Buscando streaming para episódio ${episodeId} em: ${endpoint}`);
        
        const data = await this.fetchWithTimeout(endpoint);
        
        if (data && data.sources && data.sources.length > 0) {
          // Buscar a melhor qualidade disponível
          const bestSource = data.sources.find((s: any) => s.quality === '1080p') ||
                            data.sources.find((s: any) => s.quality === '720p') ||
                            data.sources[0];
          
          if (bestSource && bestSource.url) {
            console.log(`✅ Link de streaming encontrado: ${bestSource.quality || 'unknown'}`);
            return bestSource.url;
          }
        }
      } catch (error) {
        console.warn(`❌ Falha ao obter streaming de ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`⚠️ Não foi possível obter link de streaming para ${episodeId}`);
    return null;
  }

  // Adaptar dados de anime de diferentes APIs para formato padrão
  private adaptAnimeData(apiData: any): AnimeData {
    return {
      id: apiData.id || apiData.animeId || Math.random().toString(),
      title: apiData.title || apiData.animeTitle || 'Título não disponível',
      image: apiData.image || apiData.animeImg || apiData.cover || 'https://via.placeholder.com/400x600',
      studio: apiData.studio || 'Estúdio não informado',
      year: apiData.year || (apiData.releaseDate ? new Date(apiData.releaseDate).getFullYear() : new Date().getFullYear()),
      genres: apiData.genres || apiData.genre || [],
      synopsis: apiData.description || apiData.synopsis || apiData.plot || 'Sinopse não disponível',
      releaseDate: apiData.releaseDate || apiData.releasedDate || '',
      status: apiData.status || 'unknown',
      totalEpisodes: parseInt(apiData.totalEpisodes) || parseInt(apiData.episodesList?.length) || 0,
      rating: apiData.rating || apiData.otherName || '0',
      viewCount: apiData.viewCount || Math.floor(Math.random() * 100000),
      type: apiData.type || 'TV',
      subOrDub: apiData.subOrDub || 'SUB',
      url: apiData.url || apiData.animeUrl
    };
  }

  // Adaptar dados específicos da API do Jikan (MyAnimeList)
  private adaptJikanAnimeData(jikanData: any): AnimeData {
    return {
      id: jikanData.mal_id?.toString() || Math.random().toString(),
      title: jikanData.title || jikanData.title_english || 'Título não disponível',
      image: jikanData.images?.jpg?.large_image_url || jikanData.images?.jpg?.image_url || 'https://via.placeholder.com/400x600',
      studio: jikanData.studios?.[0]?.name || 'Estúdio não informado',
      year: jikanData.year || (jikanData.aired?.from ? new Date(jikanData.aired.from).getFullYear() : new Date().getFullYear()),
      genres: jikanData.genres?.map((g: any) => g.name) || [],
      synopsis: jikanData.synopsis || 'Sinopse não disponível',
      releaseDate: jikanData.aired?.from || '',
      status: jikanData.status?.toLowerCase() || 'unknown',
      totalEpisodes: jikanData.episodes || 0,
      rating: jikanData.score?.toString() || '0',
      viewCount: jikanData.members || Math.floor(Math.random() * 100000),
      type: jikanData.type || 'TV',
      subOrDub: 'SUB',
      url: jikanData.url || ''
    };
  }

  // Adaptar dados de episódio de diferentes APIs para formato padrão
  private adaptEpisodeData(apiData: any, animeId?: string): EpisodeData {
    return {
      id: apiData.id || apiData.episodeId || Math.random().toString(),
      animeId: animeId || apiData.animeId || apiData.id || '1',
      number: parseInt(apiData.number) || parseInt(apiData.episodeNum) || 1,
      title: apiData.title || apiData.animeTitle || `Episódio ${apiData.number || apiData.episodeNum || 1}`,
      thumbnail: apiData.image || apiData.animeImg || 'https://via.placeholder.com/400x225',
      duration: apiData.duration || '24 min',
      releaseDate: apiData.releaseDate || new Date().toISOString().split('T')[0],
      streamingUrl: apiData.streamingUrl,
      downloadUrl: apiData.downloadUrl,
      subOrDub: apiData.subOrDub || 'SUB',
      url: apiData.url || apiData.episodeUrl
    };
  }

  // Dados mock para fallback
  private getMockAnimeData(): AnimeData[] {
    return [
      {
        id: 'one-piece',
        title: 'One Piece',
        image: 'https://cdn.myanimelist.net/images/anime/1244/138851l.jpg',
        studio: 'Toei Animation',
        year: 1999,
        genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Shounen'],
        synopsis: 'Gol D. Roger foi conhecido como o "Rei dos Piratas", o mais forte e infame a navegar pelos Grand Line.',
        releaseDate: '1999-10-20',
        status: 'ongoing',
        totalEpisodes: 1000,
        rating: '9.0',
        viewCount: 500000,
        type: 'TV',
        subOrDub: 'SUB'
      },
      {
        id: 'demon-slayer',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        image: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
        studio: 'Ufotable',
        year: 2019,
        genres: ['Action', 'Historical', 'Supernatural', 'Shounen'],
        synopsis: 'Tanjiro é um gentil jovem que ganha a vida vendendo carvão. Um dia, sua família é morta por demônios.',
        releaseDate: '2019-04-06',
        status: 'completed',
        totalEpisodes: 44,
        rating: '8.7',
        viewCount: 300000,
        type: 'TV',
        subOrDub: 'SUB'
      }
    ];
  }

  private getMockEpisodeData(animeId?: string): EpisodeData[] {
    return [
      {
        id: `${animeId || 'mock'}-episode-1`,
        animeId: animeId || 'mock-anime',
        number: 1,
        title: 'Episódio 1',
        thumbnail: 'https://via.placeholder.com/400x225',
        duration: '24 min',
        releaseDate: '2024-01-01',
        subOrDub: 'SUB'
      }
    ];
  }
}

export const animeStreamingService = new AnimeStreamingService();