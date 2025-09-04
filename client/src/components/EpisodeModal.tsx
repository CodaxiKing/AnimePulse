import { X, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Episode } from "@shared/schema";

interface EpisodeModalProps {
  episode: Episode | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EpisodeModal({ episode, isOpen, onClose }: EpisodeModalProps) {
  if (!episode) return null;

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
        
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          <img
            src={episode.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop"}
            alt={episode.title}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <button className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] rounded-full flex items-center justify-center anime-glow hover:opacity-90 transition-opacity" data-testid="button-play-episode">
                <Play className="w-8 h-8 text-white ml-1" />
              </button>
              <p className="text-white text-sm">Player de vídeo seria integrado aqui</p>
              <p className="text-white/80 text-xs mt-1">Duração: {episode.duration} minutos</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
