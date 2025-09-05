import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, ExternalLink, Share2, BookmarkPlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
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

  // Buscar conteúdo completo da notícia
  const { data: fullNews, isLoading: loadingFullNews } = useQuery({
    queryKey: ['news-detail', news?.id],
    queryFn: async () => {
      if (!news?.id) throw new Error('News ID not provided');
      const response = await fetch(`/api/news/${news.id}`);
      if (!response.ok) {
        // Se não encontrar pelo ID, usar os dados já disponíveis
        return news;
      }
      return response.json();
    },
    enabled: !!news?.id && isOpen,
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  const currentNews = fullNews || news;
  
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
    const link = currentNews?.link || news?.link;
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Link não disponível",
        description: "Esta notícia não possui um link externo."
      });
    }
  };

  // Função para limpar e melhorar o conteúdo HTML
  const cleanHtmlContent = (htmlContent: string) => {
    return htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/style="[^"]*"/gi, '') // Remove inline styles
      .replace(/class="[^"]*"/gi, '') // Remove classes
      .replace(/<img([^>]*)>/gi, '<img$1 class="max-w-full h-auto rounded-lg my-4" loading="lazy">') // Melhora imagens
      .replace(/<a([^>]*)>/gi, '<a$1 class="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">') // Melhora links
      .replace(/<p>/gi, '<p class="mb-3">') // Espaçamento de parágrafos
      .replace(/<h([1-6])>/gi, '<h$1 class="font-semibold mt-4 mb-2">'); // Estilos de títulos
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
          {loadingFullNews ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center gap-2 mt-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando conteúdo completo...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Descrição */}
              <p className="text-muted-foreground leading-relaxed">
                {currentNews?.description}
              </p>
              
              {/* Conteúdo completo da notícia */}
              {currentNews?.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Separator className="my-4" />
                  <h4 className="font-semibold mb-3">Conteúdo Completo:</h4>
                  <div 
                    className="text-sm leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ 
                      __html: cleanHtmlContent(currentNews.content) 
                    }}
                  />
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2 text-yellow-400">Debug Info:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Content available: {currentNews?.content ? 'Yes' : 'No'}</p>
                    <p>• Content length: {currentNews?.content?.length || 0}</p>
                    <p>• Description length: {currentNews?.description?.length || 0}</p>
                    <p>• News ID: {currentNews?.id}</p>
                    <p>• Loading full news: {loadingFullNews ? 'Yes' : 'No'}</p>
                    {currentNews?.content && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-yellow-400">Show raw content</summary>
                        <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto max-h-32">
                          {currentNews.content.substring(0, 500)}...
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
              
              {/* Informações da notícia */}
              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold mb-2">Informações da Notícia:</h4>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• Fonte: {currentNews?.author || 'Anime News Network'}</li>
                  <li>• Categoria: {currentNews?.category || 'Geral'}</li>
                  <li>• Publicado em: {formatDate(currentNews?.publishedDate || '')}</li>
                  {currentNews?.link && currentNews.link !== '#' && (
                    <li>• Link original: <a href={currentNews.link} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Ver no ANN</a></li>
                  )}
                </ul>
              </div>
            </div>
          )}
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

          {currentNews?.link && currentNews.link !== '#' && (
            <Button
              onClick={openOriginalArticle}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              data-testid="button-read-full-article"
            >
              <ExternalLink className="w-4 h-4" />
              Ler no site original
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}