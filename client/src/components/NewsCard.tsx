interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedDate: string;
  category?: string;
  thumbnail?: string;
  author?: string;
  // Campos do banco de dados também suportados
  image?: string | null;
  summary?: string | null;
  content?: string | null;
  source?: string | null;
  publishedAt?: Date | null;
}

import { Link } from 'wouter';

interface NewsCardProps {
  news: NewsItem;
  onClick?: (news: NewsItem) => void;
}

export default function NewsCard({ news, onClick }: NewsCardProps) {
  // Se há onClick definido, usar comportamento original (modal)
  // Senão, navegar para a página de detalhes
  const hasCustomClick = !!onClick;
  
  const handleClick = () => {
    if (onClick) {
      onClick(news);
    }
  };

  const cardContent = (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
      <img
        src={news.thumbnail || news.image || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop"}
        alt={news.title}
        className="w-full h-32 object-cover"
        data-testid={`img-news-${news.id}`}
      />
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`text-news-title-${news.id}`}>
          {news.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-news-summary-${news.id}`}>
          {news.description || news.summary}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{news.author || news.source || 'Anime News Network'}</span>
          <span>{new Date(news.publishedDate || news.publishedAt || new Date()).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );

  // Se há onClick definido, usar comportamento original (modal)
  if (hasCustomClick) {
    return (
      <div onClick={handleClick} data-testid={`card-news-${news.id}`}>
        {cardContent}
      </div>
    );
  }

  // Senão, navegar para a página de detalhes
  return (
    <Link href={`/noticias/${news.id}`} data-testid={`card-news-${news.id}`}>
      {cardContent}
    </Link>
  );
}
