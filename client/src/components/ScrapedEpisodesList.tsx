import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScrapedEpisodes, getScrapedStreamingUrl, type ScrapedEpisode, type ScrapedAnime } from "../lib/webScrapingApi";
import { Play, ExternalLink, Clock, Calendar, Download, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

interface ScrapedEpisodesListProps {
  anime: ScrapedAnime;
  className?: string;
}

interface EpisodePlayerProps {
  episode: ScrapedEpisode;
  isOpen: boolean;
  onClose: () => void;
}

const EpisodePlayer = ({ episode, isOpen, onClose }: EpisodePlayerProps) => {
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStreamingUrl = async () => {
    if (!episode.url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getScrapedStreamingUrl(episode.id, episode.url);
      setStreamingUrl(response.streamingUrl);
    } catch (err) {
      setError('Não foi possível carregar o vídeo. Tente assistir no site original.');
      console.error('Error loading streaming URL:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-semibold text-lg truncate">
              {episode.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Episódio {episode.number} • {episode.duration || '24 min'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 bg-black relative">
          {!streamingUrl && !loading && !error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <Button onClick={loadStreamingUrl} className="mb-4">
                  Carregar Episódio
                </Button>
                <p className="text-sm text-muted-foreground">
                  Ou assista diretamente no site:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(episode.url, '_blank')}
                  className="mt-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir no Site Original
                </Button>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Carregando episódio...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Alert className="max-w-md">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(episode.url, '_blank')}
                  className="mt-4"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Assistir no Site Original
                </Button>
              </div>
            </div>
          )}
          
          {streamingUrl && (
            <video
              src={streamingUrl}
              controls
              autoPlay
              className="w-full h-full"
              onError={() => setError('Erro ao reproduzir o vídeo')}
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

const EpisodeCard = ({ episode, onClick }: { episode: ScrapedEpisode; onClick: () => void }) => {
  return (
    <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/20 transition-all duration-200">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={episode.thumbnail || "https://via.placeholder.com/400x225/8A2BE2/FFFFFF?text=Episódio+" + episode.number}
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/400x225/8A2BE2/FFFFFF?text=EP+${episode.number}`;
          }}
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            onClick={onClick}
            size="lg"
            className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4"
          >
            <Play className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium">
          EP {episode.number}
        </div>
        
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {episode.duration || '24 min'}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm mb-2 line-clamp-2">
          {episode.title}
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3 mr-1" />
          {episode.releaseDate ? new Date(episode.releaseDate).toLocaleDateString('pt-BR') : 'Disponível'}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onClick}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            Assistir
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              window.open(episode.url, '_blank');
            }}
            variant="ghost"
            size="sm"
            className="px-2 text-xs"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ScrapedEpisodesList({ anime, className }: ScrapedEpisodesListProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<ScrapedEpisode | null>(null);

  const { data: episodes, isLoading, error } = useQuery({
    queryKey: ['scraped-episodes', anime.id],
    queryFn: () => getScrapedEpisodes(anime.id, anime.url),
    enabled: !!anime.url,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleEpisodeClick = (episode: ScrapedEpisode) => {
    setSelectedEpisode(episode);
  };

  const handleClosePlayer = () => {
    setSelectedEpisode(null);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertDescription>
          Erro ao buscar episódios: {error instanceof Error ? error.message : 'Erro desconhecido'}
          <br />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(anime.url, '_blank')}
            className="mt-2"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver no Site Original
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Play className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Nenhum episódio encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Não conseguimos encontrar episódios para este anime nos sites de streaming.
        </p>
        <Button
          variant="outline"
          onClick={() => window.open(anime.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver no Site Original
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            Episódios de {anime.title}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{episodes.length} episódio{episodes.length !== 1 ? 's' : ''}</span>
            <Badge variant="outline" className="text-xs">
              Web Scraping
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(anime.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Site Original
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            onClick={() => handleEpisodeClick(episode)}
          />
        ))}
      </div>
      
      {selectedEpisode && (
        <EpisodePlayer
          episode={selectedEpisode}
          isOpen={!!selectedEpisode}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}