import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { markEpisodeWatchedFromPlayer, showAnimeCompletionModal } from "@/lib/api";
import { useState, useRef } from "react";
import type { Episode } from "@shared/schema";

interface EpisodeModalProps {
  episode: Episode | null;
  isOpen: boolean;
  onClose: () => void;
  animeTitle?: string;
  animeImage?: string;
  animeId?: string;
  totalEpisodes?: number;
  episodes?: Episode[];
  onEpisodeChange?: (episode: Episode) => void;
}

export default function EpisodeModal({ 
  episode, 
  isOpen, 
  onClose, 
  animeTitle = "", 
  animeImage = "", 
  animeId = "", 
  totalEpisodes = 12,
  episodes = [],
  onEpisodeChange
}: EpisodeModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!episode) return null;

  const currentIndex = episodes.findIndex(ep => ep.number === episode.number);
  const hasNext = currentIndex < episodes.length - 1;

  const handleVideoEnd = async () => {
    console.log(`🎬 Video terminou! Marcando episódio ${episode.number} como assistido...`);
    
    if (!animeId || !animeTitle) {
      console.error('❌ Dados do anime não encontrados:', { animeId, animeTitle });
      return;
    }
    
    try {
      const result = await markEpisodeWatchedFromPlayer(
        animeId,
        episode.number,
        animeTitle,
        animeImage,
        totalEpisodes
      );
      
      console.log('✅ Episódio marcado como assistido automaticamente!', result);
      
      if (result.completed) {
        console.log('🎉 Anime completado! Mostrando parabéns...');
        showAnimeCompletionModal(animeTitle, result.points);
      } else if (hasNext && onEpisodeChange) {
        // Auto avançar para o próximo episódio após 2 segundos
        setTimeout(() => {
          const nextEpisode = episodes[currentIndex + 1];
          onEpisodeChange(nextEpisode);
          setIsPlaying(false);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Erro ao marcar episódio automaticamente:', error);
    }
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card border-border" data-testid="modal-episode">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold" data-testid="text-episode-title">
            Episódio {episode.number} - {episode.title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-muted rounded-lg transition-colors"
            data-testid="button-close-episode"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className="aspect-video bg-muted flex items-center justify-center relative rounded-lg overflow-hidden">
          {!isPlaying ? (
            <>
              <img
                src={episode.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop"}
                alt={episode.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center">
                  <button 
                    onClick={handlePlayClick}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] rounded-full flex items-center justify-center anime-glow hover:opacity-90 transition-opacity" 
                    data-testid="button-play-episode"
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                  <p className="text-white text-sm">Clique para assistir o episódio</p>
                  <p className="text-white/80 text-xs mt-1">Duração: {episode.duration} minutos</p>
                  <p className="text-green-400 text-xs mt-2">✅ Será marcado automaticamente quando terminar</p>
                </div>
              </div>
            </>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full rounded-lg"
              controls
              autoPlay
              onEnded={handleVideoEnd}
              data-testid="video-player"
            >
              <source 
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                type="video/mp4" 
              />
              Seu navegador não suporta reprodução de vídeo.
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}