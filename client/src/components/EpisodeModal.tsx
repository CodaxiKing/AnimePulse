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
      <DialogContent className="max-w-4xl w-full bg-card border-border p-6" data-testid="modal-episode">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white" data-testid="text-episode-title">
            Episódio {episode.number} - {episode.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
            data-testid="button-close-episode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLES DE NAVEGAÇÃO - SEMPRE VISÍVEIS */}
        <div className="bg-red-900 border-2 border-red-500 p-6 rounded-lg mb-6 z-50 relative">
          <h3 className="text-white text-center mb-4 font-bold">CONTROLES DE EPISÓDIO</h3>
          <div className="flex justify-center items-center gap-8">
            <button
              onClick={handlePreviousEpisode}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold text-lg transition-all ${
                hasPrevious 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                  : 'bg-gray-600 opacity-50 cursor-not-allowed'
              }`}
              data-testid="button-prev-main"
            >
              <ChevronLeft className="w-6 h-6" />
              ANTERIOR
            </button>
            
            <button
              onClick={handleVideoEnd}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-white font-bold text-xl transition-colors shadow-xl border-2 border-green-400"
              data-testid="button-mark-watched"
            >
              ✅ MARCAR ASSISTIDO
            </button>
            
            <button
              onClick={handleNextEpisode}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold text-lg transition-all ${
                hasNext 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                  : 'bg-gray-600 opacity-50 cursor-not-allowed'
              }`}
              data-testid="button-next-main"
            >
              PRÓXIMO
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="w-full h-96 bg-muted flex items-center justify-center relative rounded-lg overflow-hidden border-2 border-gray-600">
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
