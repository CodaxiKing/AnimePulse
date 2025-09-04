import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import NewsCard from "@/components/NewsCard";
import { getLatestNews } from "@/lib/api";

export default function News() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["all-news"],
    queryFn: getLatestNews,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-news-page-title">
          Notícias
        </h1>
        <p className="text-muted-foreground" data-testid="text-news-page-subtitle">
          Fique por dentro das últimas novidades do mundo dos animes e mangás
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/2] rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news?.map((newsItem) => (
            <NewsCard key={newsItem.id} news={newsItem} />
          ))}
        </div>
      )}
    </div>
  );
}
