import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScrapedEpisodeStream, type ScrapedEpisode, type StreamingData } from "../lib/scrapingApi";
import { X, ExternalLink, Play, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

interface ScrapedEpisodePlayerProps {
  episode: ScrapedEpisode;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function ScrapedEpisodePlayer({ 
  episode, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious 
}: ScrapedEpisodePlayerProps) {
  const [playerError, setPlayerError] = useState<string | null>(null);

  const { 
    data: streamingData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['scraped-episode-stream', episode.siteId, episode.id],
    queryFn: () => getScrapedEpisodeStream(episode.siteId, episode.id, episode.url),
    enabled: isOpen && !!episode.url,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    if (isOpen) {
      setPlayerError(null);
    }
  }, [isOpen]);

  const handleVideoError = () => {
    setPlayerError('Erro ao carregar o vídeo. Tente assistir no site original.');
  };

  const handleExternalView = () => {
    window.open(episode.url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-background rounded-xl w-full h-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="font-semibold text-base sm:text-lg truncate" data-testid="text-episode-title">
              {episode.title}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>Episódio {episode.number}</span>
              <span>•</span>
              <span>{episode.duration || '24 min'}</span>
              <span>•</span>
              <span className="capitalize">{episode.siteId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation buttons */}
            {onPrevious && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                className="hidden sm:flex"
              >
                ← Anterior
              </Button>
            )}
            {onNext && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                className="hidden sm:flex"
              >
                Próximo →
              </Button>
            )}
            
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
        </div>
        
        {/* Video Player Area */}
        <div className="flex-1 bg-black relative min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Carregando episódio...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Buscando URL de streaming do site {episode.siteId}
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center max-w-md">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <Alert className="mb-4">
                  <AlertDescription>
                    Não foi possível carregar o episódio automaticamente. 
                    {error instanceof Error ? ` Erro: ${error.message}` : ''}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleExternalView}
                  className="bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Assistir no Site Original
                </Button>
              </div>
            </div>
          )}
          
          {streamingData && !error && (
            <div className="w-full h-full">
              {streamingData.external || !streamingData.streamingUrl.includes('.mp4') && !streamingData.streamingUrl.includes('.m3u8') ? (
                // External link or embed
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-white" />
                    <p className="text-white mb-4">
                      Este episódio precisa ser assistido no site original
                    </p>
                    <Button
                      onClick={handleExternalView}
                      className="bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Assistir no Site Original
                    </Button>
                  </div>
                </div>
              ) : (
                // Direct video stream
                <video
                  src={streamingData.streamingUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  onError={handleVideoError}
                  data-testid="video-player"
                >
                  Seu navegador não suporta a tag de vídeo.
                </video>
              )}
            </div>
          )}
          
          {playerError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Alert className="max-w-md mb-4">
                  <AlertDescription>{playerError}</AlertDescription>
                </Alert>
                <Button
                  onClick={handleExternalView}
                  className="bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Assistir no Site Original
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile navigation */}
        <div className="sm:hidden flex items-center justify-between p-3 border-t border-border bg-background/95 backdrop-blur">
          {onPrevious ? (
            <Button variant="outline" size="sm" onClick={onPrevious}>
              ← Anterior
            </Button>
          ) : (
            <div />
          )}
          
          {onNext ? (
            <Button variant="outline" size="sm" onClick={onNext}>
              Próximo →
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}