import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NewsCard from "@/components/NewsCard";
import CreateNewsModal from "@/components/CreateNewsModal";
import { getLatestNews, getNewsByCategory } from "@/lib/api";
import { Newspaper, TrendingUp, Star, Film, Plus } from "lucide-react";

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

const newsCategories = [
  { key: 'all', label: 'Todas', icon: Newspaper },
  { key: 'news', label: 'Notícias', icon: TrendingUp },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'features', label: 'Especiais', icon: Film },
];

export default function News() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: news, isLoading, error } = useQuery({
    queryKey: ["anime-news", activeCategory],
    queryFn: () => {
      if (activeCategory === 'all') {
        return getLatestNews();
      }
      return getNewsByCategory(activeCategory);
    },
    retry: 3,
    retryDelay: 1000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-news-page-title">
              Notícias de Anime
            </h1>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            data-testid="button-create-news"
          >
            <Plus className="w-4 h-4" />
            Criar Notícia
          </Button>
        </div>
        <p className="text-muted-foreground mb-6" data-testid="text-news-page-subtitle">
          As últimas notícias direto do Anime News Network - Fique por dentro de tudo que acontece no mundo dos animes
        </p>

        {/* Filtros por categoria */}
        <div className="flex flex-wrap gap-2 mb-6">
          {newsCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.key}
                variant={activeCategory === category.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.key)}
                className="flex items-center gap-2"
                data-testid={`button-filter-${category.key}`}
              >
                <IconComponent className="h-4 w-4" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Indicador da fonte */}
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="secondary" className="text-xs">
            Fonte: Anime News Network
          </Badge>
          <Badge variant="outline" className="text-xs">
            {news?.length || 0} notícias
          </Badge>
        </div>
      </div>

      {/* Estado de erro */}
      {error && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            Erro ao carregar notícias. Usando dados de fallback.
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/2] rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid de notícias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news?.map((newsItem) => {
              // Mapear dados do backend para o formato NewsItem
              const newsItemFormatted: NewsItem = {
                id: newsItem.id,
                title: newsItem.title,
                description: newsItem.summary || newsItem.content || '',
                link: newsItem.source || '#',
                publishedDate: newsItem.publishedAt?.toISOString() || new Date().toISOString(),
                category: newsItem.category,
                thumbnail: newsItem.image || undefined,
                author: newsItem.source || 'MyAnimeList'
              };
              
              return (
                <NewsCard 
                  key={newsItem.id} 
                  news={newsItemFormatted}
                />
              );
            })}
          </div>

          {/* Mensagem quando não há notícias */}
          {(!news || news.length === 0) && !isLoading && (
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma notícia encontrada
              </h3>
              <p className="text-muted-foreground">
                Não há notícias disponíveis para esta categoria no momento.
              </p>
            </div>
          )}
        </>
      )}


      <CreateNewsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onNewsCreated={(newNews: NewsItem) => {
          // Aqui você pode atualizar a lista de notícias ou fazer refresh
          console.log('Nova notícia criada:', newNews);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
