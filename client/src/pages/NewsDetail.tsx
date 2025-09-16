import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  ExternalLink, 
  Share2, 
  BookmarkPlus,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface JikanNewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  forum_url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  excerpt: string;
}

interface NewsDetailData extends JikanNewsItem {
  content?: string;
}

// Função para buscar uma notícia específica do backend
async function fetchNewsById(id: string): Promise<NewsDetailData | null> {
  try {
    console.log(`🔍 Buscando notícia do backend - ID: ${id}`);
    const response = await fetch(`/api/news/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`❌ Notícia não encontrada para ID: ${id}`);
        return null;
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const news = await response.json();
    console.log(`✅ Notícia encontrada: ${news.title}`);
    
    // Adaptar para o formato esperado, mantendo compatibilidade
    return {
      mal_id: parseInt(news.id.replace(/\D/g, '')) || 0, // Extrair números do ID
      url: news.link || '#',
      title: news.title || 'Título não disponível',
      date: news.publishedDate || new Date().toISOString(),
      author_username: news.author || 'MyAnimeList',
      author_url: '#',
      forum_url: news.link || '#',
      images: {
        jpg: {
          image_url: news.thumbnail || ''
        }
      },
      excerpt: news.description || '',
      content: news.content || news.description || 'Conteúdo completo não disponível.'
    };
  } catch (error) {
    console.error("❌ Erro ao buscar notícia por ID:", error);
    return null;
  }
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const navigate = (url: string) => setLocation(url);

  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news-detail', id],
    queryFn: () => fetchNewsById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  useEffect(() => {
    // Verificar se a notícia está salva
    const bookmarkedNews = JSON.parse(localStorage.getItem('bookmarkedNews') || '[]');
    setIsBookmarked(bookmarkedNews.some((item: any) => item.mal_id?.toString() === id));
  }, [id]);

  const handleBookmark = () => {
    if (!news) return;
    
    const bookmarkedNews = JSON.parse(localStorage.getItem('bookmarkedNews') || '[]');
    
    if (isBookmarked) {
      // Remover do bookmark
      const updated = bookmarkedNews.filter((item: any) => item.mal_id?.toString() !== id);
      localStorage.setItem('bookmarkedNews', JSON.stringify(updated));
      setIsBookmarked(false);
    } else {
      // Adicionar ao bookmark
      bookmarkedNews.push(news);
      localStorage.setItem('bookmarkedNews', JSON.stringify(bookmarkedNews));
      setIsBookmarked(true);
    }
  };

  const handleShare = async () => {
    if (!news) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.excerpt,
          url: window.location.href
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(window.location.href);
      // Aqui você poderia mostrar um toast/notification
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Notícia não encontrada
          </h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar a notícia solicitada.
          </p>
          <Button onClick={() => navigate('/noticias')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para notícias
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header de navegação */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/noticias')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para notícias
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleBookmark}
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <BookmarkPlus className="w-4 h-4" />
            {isBookmarked ? "Salvo" : "Salvar"}
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Conteúdo da notícia */}
      <article className="space-y-6">
        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          {news.title}
        </h1>

        {/* Meta informações */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(news.date)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{news.author_username}</span>
          </div>
          
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Anime News
          </Badge>
        </div>

        <Separator />

        {/* Imagem da notícia */}
        {news.images?.jpg?.image_url && (
          <div className="relative">
            <img
              src={news.images.jpg.image_url}
              alt={news.title}
              className="w-full max-h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div 
            className="text-lg leading-relaxed" 
            dangerouslySetInnerHTML={{ 
              __html: news.content || news.excerpt || 'Conteúdo não disponível.' 
            }}
          />
        </div>

        {/* Navegação adicional */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-4">Explorar mais:</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/noticias">
              <Button variant="outline" size="sm">
                Todas as notícias
              </Button>
            </Link>
            <Link to="/animes">
              <Button variant="outline" size="sm">
                Explorar animes
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">
                Página inicial
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}