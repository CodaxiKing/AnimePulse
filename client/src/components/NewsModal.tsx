import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, ExternalLink, Share2, BookmarkPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedDate: string;
  category?: string;
  thumbnail?: string;
  author?: string;
}

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsModal({ news, isOpen, onClose }: NewsModalProps) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!news) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.description,
          url: news.link
        });
      } catch (err) {
        // Fallback para copiar para o clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(news.link);
    toast({
      title: "Link copiado!",
      description: "O link da notícia foi copiado para a área de transferência."
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Marcador removido" : "Notícia salva!",
      description: isBookmarked ? "A notícia foi removida dos seus salvos." : "A notícia foi salva na sua lista de leitura."
    });
  };

  const openOriginalArticle = () => {
    window.open(news.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl md:text-2xl leading-tight pr-8">
              {news.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
              data-testid="button-close-news-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Meta informações */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(news.publishedDate)}</span>
            </div>
            {news.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{news.author}</span>
              </div>
            )}
            {news.category && (
              <Badge variant="secondary" className="text-xs">
                {news.category}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Imagem da notícia */}
        {news.thumbnail && (
          <div className="flex-shrink-0 mb-4">
            <img
              src={news.thumbnail}
              alt={news.title}
              className="w-full max-h-64 object-cover rounded-lg"
              data-testid="img-news-modal-thumbnail"
            />
          </div>
        )}

        {/* Conteúdo da notícia */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {news.description}
            </p>
            
            {/* Placeholder para conteúdo expandido */}
            <div className="space-y-4 text-sm">
              <p>
                Esta é uma prévia da notícia. Para ler o artigo completo, 
                clique no botão "Ler artigo completo" abaixo para ser redirecionado 
                ao site original do Anime News Network.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Sobre esta notícia:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Fonte: Anime News Network</li>
                  <li>• Categoria: {news.category || 'Geral'}</li>
                  <li>• Publicado em: {formatDate(news.publishedDate)}</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        {/* Ações */}
        <div className="flex-shrink-0 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              onClick={handleBookmark}
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-bookmark-news"
            >
              <BookmarkPlus className="w-4 h-4" />
              {isBookmarked ? "Salvo" : "Salvar"}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-share-news"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>

          <Button
            onClick={openOriginalArticle}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            data-testid="button-read-full-article"
          >
            <ExternalLink className="w-4 h-4" />
            Ler artigo completo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}