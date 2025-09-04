import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Clock, Calendar, X } from "lucide-react";
import type { Episode } from "@shared/schema";

interface EpisodeGridProps {
  episodes: Episode[];
  animeTitle?: string;
}

interface VideoPlayerProps {
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({ episode, isOpen, onClose }: VideoPlayerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg" data-testid="text-episode-title">
              {episode.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Episódio {episode.number} • {episode.duration || '24 min'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            data-testid="button-close-player"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="aspect-video bg-black relative">
          {episode.streamingUrl ? (
            <video
              src={episode.streamingUrl}
              controls
              autoPlay
              className="w-full h-full"
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

const EpisodeCard = ({ episode, onClick }: { episode: Episode; onClick: () => void }) => {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/20 transition-all duration-200">
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
            onClick={onClick}
            size="lg"
            className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4 anime-glow"
            data-testid={`button-play-episode-${episode.number}`}
          >
            <Play className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Número do episódio */}
        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium">
          EP {episode.number}
        </div>
        
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
        
        <Button
          onClick={onClick}
          variant="outline"
          size="sm"
          className="w-full mt-3 text-xs"
          data-testid={`button-watch-episode-${episode.number}`}
        >
          <Play className="w-3 h-3 mr-1" />
          Assistir
        </Button>
      </div>
    </div>
  );
};

export default function EpisodeGrid({ episodes, animeTitle }: EpisodeGridProps) {
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
          {episodes.length} episódio{episodes.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-episodes">
        {episodes.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            onClick={() => handleEpisodeClick(episode)}
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