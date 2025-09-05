import { X, Play, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { markEpisodeWatchedFromPlayer, showAnimeCompletionModal } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { getEpisodeVideoUrl } from "@/lib/animeStreaming";
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buscar URL do vídeo quando episódio muda
  useEffect(() => {
    if (episode && animeTitle && isOpen) {
      loadVideoUrl();
    }
  }, [episode, animeTitle, isOpen]);

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

  const loadVideoUrl = async () => {
    if (!episode || !animeTitle) return;
    
    setIsLoadingVideo(true);
    setVideoError(null);
    
    try {
      console.log(`🎬 Buscando vídeo real para: ${animeTitle} - Episódio ${episode.number}`);
      
      // Tentar extrair ano do título do anime (se houver)
      const yearMatch = animeTitle.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
      
      // Buscar URL do vídeo diretamente
      const url = await getEpisodeVideoUrl(animeTitle, episode.number, year);
      
      if (url) {
        setVideoUrl(url);
        console.log(`✅ URL do vídeo encontrada: ${url.substring(0, 50)}...`);
      } else {
        console.warn('⚠️ Nenhuma URL de vídeo encontrada, usando placeholder');
        setVideoUrl('https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4');
        setVideoError('Usando vídeo de demonstração - APIs de streaming temporariamente indisponíveis');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar vídeo:', error);
      setVideoUrl('https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4');
      setVideoError('Usando vídeo de demonstração');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handlePlayClick = async () => {
    if (!videoUrl && !isLoadingVideo) {
      await loadVideoUrl();
    }
    
    setIsPlaying(true);
    // Aguarda um pouco para o elemento de vídeo ser criado
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
          console.log('▶️ Vídeo iniciado automaticamente!');
        } catch (error) {
          console.log('ℹ️ Autoplay bloqueado pelo navegador, usuário precisa clicar em play');
        }
      }
    }, 100);
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
                    disabled={isLoadingVideo}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] rounded-full flex items-center justify-center anime-glow hover:opacity-90 transition-opacity disabled:opacity-50" 
                    data-testid="button-play-episode"
                  >
                    {isLoadingVideo ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  <p className="text-white text-sm">
                    {isLoadingVideo ? 'Carregando vídeo...' : 'Clique para assistir o episódio'}
                  </p>
                  <p className="text-white/80 text-xs mt-1">Duração: {episode.duration} minutos</p>
                  {videoError && (
                    <p className="text-yellow-400 text-xs mt-2">⚠️ {videoError}</p>
                  )}
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
              key={videoUrl} // Force reload when URL changes
            >
              {videoUrl && (
                <source 
                  src={videoUrl} 
                  type="video/mp4" 
                />
              )}
              Seu navegador não suporta reprodução de vídeo.
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}