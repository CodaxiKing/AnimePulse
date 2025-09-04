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
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < episodes.length - 1;

  const handleVideoEnd = async () => {
    console.log(`🎬 Video terminou! Dados:`, { animeId, animeTitle, episode: episode.number });
    
    if (!animeId || !animeTitle) {
      console.error('❌ Dados do anime não encontrados:', { animeId, animeTitle });
      return;
    }
    
    console.log(`📺 Marcando episódio ${episode.number} de ${animeTitle} como assistido...`);
    
    try {
      const result = await markEpisodeWatchedFromPlayer(
        animeId,
        episode.number,
        animeTitle,
        animeImage,
        totalEpisodes
      );
      
      console.log('✅ Resultado da marcação:', result);
      
      if (result.completed) {
        console.log('🎉 Anime completado! Mostrando modal de parabéns...');
        showAnimeCompletionModal(animeTitle, result.points);
      } else if (hasNext) {
        // Auto avançar para o próximo episódio após marcar como assistido
        setTimeout(() => {
          handleNextEpisode();
        }, 2000); // Aguardar 2 segundos antes de ir para o próximo
      }
    } catch (error) {
      console.error('❌ Erro ao marcar episódio:', error);
    }
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleNextEpisode = () => {
    if (hasNext && onEpisodeChange) {
      const nextEpisode = episodes[currentIndex + 1];
      onEpisodeChange(nextEpisode);
      setIsPlaying(false); // Reset player state
    }
  };

  const handlePreviousEpisode = () => {
    if (hasPrevious && onEpisodeChange) {
      const previousEpisode = episodes[currentIndex - 1];
      onEpisodeChange(previousEpisode);
      setIsPlaying(false); // Reset player state
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
        
        {/* Botão de teste bem visível */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleVideoEnd}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium transition-colors shadow-lg"
            data-testid="button-test-visible"
          >
            ✅ TESTE: Marcar Episódio como Assistido
          </button>
        </div>
        
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
                </div>
              </div>
            </>
          ) : (
            <div className="relative w-full h-full group">
              <video
                ref={videoRef}
                className="w-full h-full"
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
              
              {/* Controles de navegação de episódios */}
              <div className="absolute inset-y-0 left-4 flex items-center">
                <button
                  onClick={handlePreviousEpisode}
                  disabled={!hasPrevious}
                  className={`p-3 rounded-full bg-black/60 text-white transition-all ${
                    hasPrevious 
                      ? 'hover:bg-black/80 cursor-pointer' 
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  data-testid="button-previous-episode"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
              
              <div className="absolute inset-y-0 right-4 flex items-center">
                <button
                  onClick={handleNextEpisode}
                  disabled={!hasNext}
                  className={`p-3 rounded-full bg-black/60 text-white transition-all ${
                    hasNext 
                      ? 'hover:bg-black/80 cursor-pointer' 
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  data-testid="button-next-episode"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Botão de teste para simular fim do episódio */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <button
                  onClick={handleVideoEnd}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-lg"
                  data-testid="button-simulate-end"
                >
                  ✅ Marcar Assistido
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
