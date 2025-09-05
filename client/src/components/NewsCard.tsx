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

interface NewsCardProps {
  news: NewsItem;
  onClick?: (news: NewsItem) => void;
}

export default function NewsCard({ news, onClick }: NewsCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(news);
    }
  };

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
      onClick={handleClick}
      data-testid={`card-news-${news.id}`}
    >
      <img
        src={news.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop"}
        alt={news.title}
        className="w-full h-32 object-cover"
        data-testid={`img-news-${news.id}`}
      />
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`text-news-title-${news.id}`}>
          {news.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-news-summary-${news.id}`}>
          {news.description}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{news.author || 'Anime News Network'}</span>
          <span>{new Date(news.publishedDate).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
