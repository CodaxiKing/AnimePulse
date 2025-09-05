import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  trailerUrl: string;
}

export default function TrailerModal({ isOpen, onClose, animeTitle, trailerUrl }: TrailerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card border-border" data-testid="modal-trailer">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold" data-testid="text-trailer-title">
            🎬 Trailer Oficial - {animeTitle}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-muted rounded-lg transition-colors"
            data-testid="button-close-trailer"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className="aspect-video bg-muted flex items-center justify-center relative rounded-lg overflow-hidden">
          <iframe
            src={trailerUrl}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${animeTitle} - Trailer Oficial`}
            data-testid="youtube-trailer-player"
            onLoad={() => {
              console.log(`✅ Trailer oficial carregado: ${animeTitle}`);
            }}
          />
        </div>
        
        <div className="flex justify-center gap-4 pt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              🎥 Trailer oficial do YouTube
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Qualidade: 1080p HD | Legendas disponíveis
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}