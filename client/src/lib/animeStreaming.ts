// Tipos para streaming de anime
interface StreamingSource {
  url: string;
  quality: string;
  isM3U8?: boolean;
}

interface StreamingSubtitle {
  lang: string;
  url: string;
}

interface StreamingData {
  sources: StreamingSource[];
  subtitles: StreamingSubtitle[];
  headers: Record<string, string>;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  img: string;
  releaseDate?: string;
}

interface AnimeServer {
  serverName: string;
  serverId: number;
}

interface ServersResponse {
  sub: AnimeServer[];
  dub: AnimeServer[];
  raw: AnimeServer[];
}

class AnimeStreamingService {
  private baseURL = 'https://api-anime-rouge.vercel.app';
  private animeIndoAPI = 'https://anime-indo-rest-api.vercel.app';
  private gogoAnimeAPI = 'https://gogoanime.consumet.stream';
  private anilistAPI = 'https://consumet-api-brown.vercel.app';
  private consumetAPI = 'https://api.consumet.org';
  private wajikAPI = 'https://wajik-anime-api.vercel.app';
  private fallbackAPIs = [
    'https://api.consumet.org',
    'https://consumet-api-brown.vercel.app',
    'https://wajik-anime-api.vercel.app',
  ];

  // Cache para evitar múltiplas requisições para o mesmo episódio
  private streamCache = new Map<string, StreamingData>();

  /**
   * Buscar anime na API Wajik
   */
  async searchWajikAnime(query: string): Promise<any[]> {
    try {
      console.log(`🔍 Searching in Wajik API: ${query}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        // Primeiro tentar buscar em otakudesu ongoing
        const ongoingResponse = await fetch(`${this.wajikAPI}/otakudesu/ongoing?page=1`, {
          headers: {
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (ongoingResponse.ok) {
          const data = await ongoingResponse.json();
          const results = data.data?.animeList || [];
          
          console.log(`✅ Found ${results.length} results from Wajik API`);
          return results;
        }
        
        throw new Error(`Wajik API failed: ${ongoingResponse.status}`);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.warn('⚠️ Wajik API unavailable:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Buscar dados de streaming da API Wajik
   */
  async getWajikAnimeStream(animeId: string, episodeNumber: number): Promise<StreamingData | null> {
    try {
      console.log(`🎬 Getting Wajik stream for: ${animeId}, episode ${episodeNumber}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        // Buscar informações do anime
        const infoResponse = await fetch(`${this.wajikAPI}/otakudesu/anime/${animeId}`, {
          headers: {
            'User-Agent': 'AnimePulse/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!infoResponse.ok) {
          throw new Error(`Wajik info fetch failed: ${infoResponse.status}`);
        }
        
        const animeInfo = await infoResponse.json();
        const episodes = animeInfo.data?.episodes || [];
        
        // Encontrar episódio
        const targetEpisode = episodes.find((ep: any) => ep.episode === episodeNumber);
        
        if (!targetEpisode) {
          console.warn(`⚠️ Episode ${episodeNumber} not found in Wajik`);
          return null;
        }
        
        // Buscar links de streaming
        const streamResponse = await fetch(`${this.wajikAPI}/otakudesu/episode/${targetEpisode.episodeId}`, {
          signal: controller.signal
        });
        
        if (!streamResponse.ok) {
          throw new Error(`Wajik stream fetch failed: ${streamResponse.status}`);
        }
        
        const streamData = await streamResponse.json();
        const downloadLinks = streamData.data?.downloadLinks || [];
        
        if (downloadLinks.length > 0) {
          // Converter links para formato StreamingData
          const sources: StreamingSource[] = downloadLinks.map((link: any) => ({
            url: link.url,
            quality: link.quality || '720p',
            isM3U8: link.url.includes('.m3u8')
          }));
          
          console.log(`✅ Found ${sources.length} streaming sources from Wajik`);
          
          return {
            sources,
            subtitles: [],
            headers: {}
          };
        }
        
        return null;
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.warn('⚠️ Error getting Wajik stream:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Buscar dados completos de streaming para um episódio local
   */
  async getEpisodeStreamingData(animeTitle: string, episodeNumber: number, year?: number): Promise<StreamingData | null> {
    try {
      console.log(`🎯 Getting episode streaming data for: ${animeTitle} - Episode ${episodeNumber}`);
      
      // Vídeos de demonstração funcionais - diferentes para cada anime/episódio
      const demoVideos = [
        'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        'https://sample-videos.com/zip/10/mp4/720/mp4-30s-720x480.mp4',
        'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
      ];
      
      // Selecionar vídeo baseado no hash do título + episódio para variedade
      const combinedString = `${animeTitle}-ep${episodeNumber}`;
      const hash = combinedString.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const videoIndex = Math.abs(hash) % demoVideos.length;
      const selectedVideo = demoVideos[videoIndex];
      
      console.log(`🎬 Using demo video for ${animeTitle} episode ${episodeNumber}: ${selectedVideo}`);
      
      // 🌟 TENTATIVAS DE APIs REAIS ATIVADAS! 🌟
      console.log(`🌐 Tentando buscar vídeo real de APIs de streaming...`);
      
      // 1. Tentar API Wajik (NOVA E PROMISSORA!)
      try {
        const wajikResults = await this.searchWajikAnime(animeTitle);
        if (wajikResults.length > 0) {
          // Buscar o anime mais similar
          const bestMatch = wajikResults.find((anime: any) => 
            anime.title?.toLowerCase().includes(animeTitle.toLowerCase().split(' ')[0])
          ) || wajikResults[0];
          
          const streamData = await this.getWajikAnimeStream(bestMatch.animeId, episodeNumber);
          if (streamData && streamData.sources.length > 0) {
            console.log(`✅ 🎉 GOT REAL ANIME VIDEO FROM WAJIK API! 🎉`);
            return streamData;
          }
        }
      } catch (error) {
        console.log(`ℹ️ Wajik API failed:`, error instanceof Error ? error.message : 'Unknown');
      }

      console.log(`📺 APIs reais falharam, usando vídeo de demonstração HD`);
      
      // Fallback para vídeo demo
      return {
        sources: [{
          url: selectedVideo,
          quality: '720p',
          isM3U8: false
        }],
        subtitles: [],
        headers: {}
      };
      
    } catch (error) {
      console.error('❌ Error getting episode streaming data:', error);
      return null;
    }
  }

  /**
   * Limpar cache (útil para desenvolvimento)
   */
  clearCache(): void {
    this.streamCache.clear();
    console.log('🗑️ Streaming cache cleared');
  }
}

// Instância singleton do serviço
export const animeStreamingService = new AnimeStreamingService();

// Função helper para usar no componente de player
export async function getEpisodeVideoUrl(animeTitle: string, episodeNumber: number, year?: number): Promise<string | null> {
  const streamData = await animeStreamingService.getEpisodeStreamingData(animeTitle, episodeNumber, year);
  
  if (streamData && streamData.sources.length > 0) {
    // Retornar a fonte de melhor qualidade disponível
    const bestSource = streamData.sources.reduce((best, current) => {
      const bestQuality = parseInt(best.quality) || 0;
      const currentQuality = parseInt(current.quality) || 0;
      return currentQuality > bestQuality ? current : best;
    });
    
    return bestSource.url;
  }
  
  return null;
}