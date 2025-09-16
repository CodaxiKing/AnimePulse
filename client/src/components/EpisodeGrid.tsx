import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Clock, Calendar, X, Check, CheckCheck } from "lucide-react";
import { isEpisodeWatched, unmarkEpisodeAsWatched } from "@/lib/api";
import type { Episode } from "@shared/schema";

interface EpisodeGridProps {
  episodes: Episode[];
  animeTitle?: string;
  animeId?: string;
  totalEpisodes?: number;
  onMarkAsWatched?: (episode: Episode) => void;
  onEpisodeClick?: (episode: Episode) => void;
}

interface VideoPlayerProps {
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({ episode, isOpen, onClose }: VideoPlayerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-background rounded-xl w-full h-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="font-semibold text-base sm:text-lg truncate" data-testid="text-episode-title">
              {episode.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Episódio {episode.number} • {episode.duration || '24 min'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full flex-shrink-0"
            data-testid="button-close-player"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 bg-black relative min-h-0">
          {episode.streamingUrl ? (
            <video
              src={episode.streamingUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              data-testid="video-player"
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Stream não disponível no momento</p>
                <p className="text-sm mt-2">Tentando conectar com servidores de streaming...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EpisodeCard = ({ episode, onClick, handleMarkAsWatched, animeId, totalEpisodes }: { episode: Episode; onClick: () => void; handleMarkAsWatched?: (episode: Episode) => void; animeId?: string; totalEpisodes?: number }) => {
  const [, setLocation] = useLocation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const isWatched = animeId ? isEpisodeWatched(animeId, episode.number) : false;

  useEffect(() => {
    const handleEpisodeUnwatched = (event: CustomEvent) => {
      if (event.detail.animeId === animeId && event.detail.episodeNumber === episode.number) {
        setForceUpdate(prev => prev + 1); // Força re-renderização
      }
    };

    const handleEpisodeWatched = (event: CustomEvent) => {
      if (event.detail.animeId === animeId && event.detail.episodeNumber === episode.number) {
        setForceUpdate(prev => prev + 1); // Força re-renderização
      }
    };

    window.addEventListener('episodeUnwatched', handleEpisodeUnwatched as EventListener);
    window.addEventListener('episodeWatched', handleEpisodeWatched as EventListener);

    return () => {
      window.removeEventListener('episodeUnwatched', handleEpisodeUnwatched as EventListener);
      window.removeEventListener('episodeWatched', handleEpisodeWatched as EventListener);
    };
  }, [animeId, episode.number]);
  
  return (
    <div className={`group relative bg-card rounded-xl overflow-hidden border transition-all duration-200 ${
      isWatched 
        ? 'border-green-500/50 bg-green-50/10 dark:bg-green-900/10' 
        : 'border-border hover:border-primary/20'
    }`}>
      <div className="aspect-video relative overflow-hidden">
        <img
          src={episode.thumbnail || "https://via.placeholder.com/400x225"}
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid={`img-episode-${episode.number}`}
        />
        
        {/* Overlay com botão de play */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            onClick={() => {
              onClick();
              // Marcar como assistindo quando clicar no botão play do grid
              if (!isWatched) {
                handleMarkAsWatched?.(episode);
              }
            }}
            size="lg"
            className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4 anime-glow"
            data-testid={`button-play-episode-${episode.number}`}
          >
            <Play className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Número do episódio */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${
          isWatched 
            ? 'bg-green-500/90 text-white' 
            : 'bg-black/80 text-white'
        }`}>
          EP {episode.number}
        </div>
        
        {/* Indicador de assistido */}
        {isWatched && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
        )}
        
        {/* Duração */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {episode.duration || '24 min'}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm mb-2 line-clamp-2" data-testid={`text-episode-title-${episode.number}`}>
          {episode.title}
        </h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Calendar className="w-3 h-3 mr-1" />
          {episode.releaseDate ? new Date(episode.releaseDate).toLocaleDateString('pt-BR') : 'Em breve'}
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => {
              // Navegar para a nova página de assistir episódio
              if (animeId) {
                setLocation(`/animes/${animeId}/episodes/${episode.number}`);
              }
              // Marcar como assistindo quando clicar no botão Assistir
              if (!isWatched) {
                handleMarkAsWatched?.(episode);
              }
            }}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            data-testid={`button-watch-episode-${episode.number}`}
          >
            <Play className="w-3 h-3 mr-1" />
            Assistir
          </Button>
          {isWatched && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (animeId) {
                  // Desmarcar como assistido E remover da seção Continue Assistindo
                  unmarkEpisodeAsWatched(
                    animeId, 
                    episode.number, 
                    episode.title || "Episódio " + episode.number,
                    episode.thumbnail || "",
                    totalEpisodes || 1
                  );
                  console.log(`Desmarcado episódio ${episode.number}!`);
                  // Reforce a atualização do estado
                  window.dispatchEvent(new CustomEvent('episodeUnwatched', { 
                    detail: { animeId, episodeNumber: episode.number } 
                  }));
                  // Disparar evento para invalidar cache da seção Continue Assistindo
                  window.dispatchEvent(new CustomEvent('continueWatchingUpdated'));
                }
              }}
              variant="default"
              size="sm"
              className="px-2 text-xs transition-all duration-200 bg-green-500 hover:bg-red-500 text-white"
              title="Desmarcar como assistido"
              data-testid={`button-unwatch-episode-${episode.number}`}
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function EpisodeGrid({ episodes, animeTitle, animeId, totalEpisodes, onMarkAsWatched, onEpisodeClick }: EpisodeGridProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const handleEpisodeClick = (episode: Episode) => {
    setSelectedEpisode(episode);
  };

  const handleClosePlayer = () => {
    setSelectedEpisode(null);
  };

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Nenhum episódio disponível</h3>
        <p className="text-muted-foreground">
          Os episódios serão adicionados em breve.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          Episódios {animeTitle && `de ${animeTitle}`}
        </h2>
        <span className="text-sm text-muted-foreground">
          {totalEpisodes || episodes.length} episódio{(totalEpisodes || episodes.length) !== 1 ? 's' : ''} {totalEpisodes ? 'disponíveis' : 'encontrados'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-episodes">
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            onClick={() => onEpisodeClick?.(episode)}
            handleMarkAsWatched={onMarkAsWatched}
            animeId={animeId}
            totalEpisodes={totalEpisodes || episodes.length}
          />
        ))}
      </div>
      
      {selectedEpisode && (
        <VideoPlayer
          episode={selectedEpisode}
          isOpen={!!selectedEpisode}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}