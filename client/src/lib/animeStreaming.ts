// Serviço para integração com APIs de streaming de anime
import type { Episode } from '@shared/schema';

interface StreamingSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface StreamingData {
  sources: StreamingSource[];
  subtitles?: {
    lang: string;
    url: string;
  }[];
  headers?: {
    Referer?: string;
    'User-Agent'?: string;
  };
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
  private fallbackAPIs = [
    'https://api.consumet.org',
    // Adicionar mais APIs de fallback se necessário
  ];

  // Cache para evitar múltiplas requisições para o mesmo episódio
  private streamCache = new Map<string, StreamingData>();

  /**
   * Buscar dados do anime no serviço de streaming
   */
  async searchAnime(query: string): Promise<any[]> {
    try {
      console.log(`🔍 Searching anime: ${query}`);
      
      // Tentar múltiplas APIs se a primeira falhar
      const urls = [
        `${this.baseURL}/aniwatch/search?q=${encodeURIComponent(query)}`,
        `https://api.consumet.org/meta/anilist/${encodeURIComponent(query)}`
      ];
      
      for (const url of urls) {
        try {
          console.log(`🌐 Trying API: ${url.split('/')[2]}`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'AnimePulse/1.0',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!response.ok) {
            console.warn(`⚠️ API ${url.split('/')[2]} failed with status: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const results = data.animes || data.results || [];
          
          if (results.length > 0) {
            console.log(`✅ Found ${results.length} anime results from ${url.split('/')[2]}`);
            return results;
          }
        } catch (apiError) {
          console.warn(`⚠️ API ${url.split('/')[2]} error:`, apiError);
          continue;
        }
      }
      
      console.warn('⚠️ All search APIs failed');
      return [];
    } catch (error) {
      console.error('❌ Error searching anime:', error);
      return [];
    }
  }

  /**
   * Buscar servidores disponíveis para um episódio
   */
  async getEpisodeServers(animeId: string, episodeId: string): Promise<ServersResponse | null> {
    try {
      console.log(`🖥️ Getting servers for anime: ${animeId}, episode: ${episodeId}`);
      const response = await fetch(`${this.baseURL}/aniwatch/servers?id=${animeId}&ep=${episodeId}`);
      
      if (!response.ok) {
        throw new Error(`Servers fetch failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found servers:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error getting servers:', error);
      return null;
    }
  }

  /**
   * Buscar link de streaming para um episódio específico
   */
  async getStreamingLink(animeId: string, episodeId: string, serverName: string = 'vidstreaming', category: string = 'sub'): Promise<StreamingData | null> {
    const cacheKey = `${animeId}-${episodeId}-${serverName}-${category}`;
    
    // Verificar cache primeiro
    if (this.streamCache.has(cacheKey)) {
      console.log(`📋 Using cached streaming data for: ${cacheKey}`);
      return this.streamCache.get(cacheKey)!;
    }

    try {
      console.log(`🎬 Getting streaming link for: ${animeId}, episode: ${episodeId}, server: ${serverName}`);
      
      const response = await fetch(
        `${this.baseURL}/aniwatch/episode-srcs?id=${animeId}&ep=${episodeId}&server=${serverName}&category=${category}`
      );
      
      if (!response.ok) {
        throw new Error(`Streaming fetch failed: ${response.status}`);
      }

      const data: StreamingData = await response.json();
      
      if (data.sources && data.sources.length > 0) {
        // Cache os dados por 1 hora
        this.streamCache.set(cacheKey, data);
        setTimeout(() => this.streamCache.delete(cacheKey), 60 * 60 * 1000);
        
        console.log(`✅ Got streaming data:`, data);
        return data;
      } else {
        console.warn('⚠️ No streaming sources found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting streaming link:', error);
      return null;
    }
  }

  /**
   * Buscar streaming com fallback para múltiplos servidores
   */
  async getStreamingWithFallback(animeId: string, episodeId: string): Promise<StreamingData | null> {
    // Primeiro, buscar servidores disponíveis
    const servers = await this.getEpisodeServers(animeId, episodeId);
    
    if (!servers) {
      console.warn('⚠️ No servers found for episode');
      return null;
    }

    // Tentar servers SUB primeiro, depois DUB, depois RAW
    const serverPriority = [
      ...(servers.sub || []),
      ...(servers.dub || []),
      ...(servers.raw || [])
    ];

    for (const server of serverPriority) {
      console.log(`🔄 Trying server: ${server.serverName}`);
      
      const streamData = await this.getStreamingLink(animeId, episodeId, server.serverName, 'sub');
      
      if (streamData && streamData.sources.length > 0) {
        console.log(`✅ Successfully got stream from server: ${server.serverName}`);
        return streamData;
      }
      
      // Pequeno delay entre tentativas para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.error('❌ All servers failed for episode');
    return null;
  }

  /**
   * Mapear anime local para ID do serviço de streaming
   */
  async mapLocalAnimeToStreamingId(animeTitle: string, year?: number): Promise<string | null> {
    try {
      // Limpar o título para busca
      const cleanTitle = animeTitle.replace(/[^\w\s]/gi, '').trim();
      
      const results = await this.searchAnime(cleanTitle);
      
      if (results.length === 0) {
        console.warn(`⚠️ No streaming results found for: ${animeTitle}`);
        return null;
      }

      // Tentar encontrar match exato ou mais próximo
      let bestMatch = results[0];
      
      // Se temos o ano, tentar encontrar match por ano
      if (year) {
        const yearMatch = results.find(anime => {
          const animeYear = anime.releaseDate ? new Date(anime.releaseDate).getFullYear() : null;
          return animeYear === year;
        });
        
        if (yearMatch) {
          bestMatch = yearMatch;
        }
      }

      console.log(`✅ Mapped "${animeTitle}" to streaming ID: ${bestMatch.id}`);
      return bestMatch.id;
    } catch (error) {
      console.error('❌ Error mapping anime to streaming ID:', error);
      return null;
    }
  }

  /**
   * Buscar dados completos de streaming para um episódio local
   */
  async getEpisodeStreamingData(animeTitle: string, episodeNumber: number, year?: number): Promise<StreamingData | null> {
    try {
      console.log(`🎯 Getting episode streaming data for: ${animeTitle} - Episode ${episodeNumber}`);
      
      // 1. Mapear anime local para ID de streaming
      const streamingId = await this.mapLocalAnimeToStreamingId(animeTitle, year);
      
      if (!streamingId) {
        console.warn('⚠️ Could not map anime to streaming service');
        return null;
      }

      // 2. Buscar dados de streaming para o episódio
      const streamData = await this.getStreamingWithFallback(streamingId, episodeNumber.toString());
      
      if (streamData) {
        console.log(`✅ Successfully got streaming data for ${animeTitle} episode ${episodeNumber}`);
      } else {
        console.warn(`⚠️ No streaming data found for ${animeTitle} episode ${episodeNumber}`);
      }

      return streamData;
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