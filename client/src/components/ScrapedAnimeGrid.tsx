import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchScrapedAnimes, type ScrapedAnime } from "../lib/webScrapingApi";
import { Search, ExternalLink, Play, Calendar, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import ScrapedEpisodesList from "./ScrapedEpisodesList";

interface ScrapedAnimeGridProps {
  initialQuery?: string;
  className?: string;
}

const AnimeCard = ({ anime, onClick }: { anime: ScrapedAnime; onClick: () => void }) => {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative h-full flex flex-col">
        <div className="absolute top-2 right-2 z-10 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-lg">
          <Eye className="w-3 h-3" />
          {anime.totalEpisodes || '?'} eps
        </div>
        
        <img
          src={anime.thumbnail || `https://via.placeholder.com/400x600/8A2BE2/FFFFFF?text=${encodeURIComponent(anime.title.slice(0, 20))}`}
          alt={anime.title}
          className="w-full h-[70%] object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/400x600/8A2BE2/FFFFFF?text=${encodeURIComponent(anime.title.slice(0, 20))}`;
          }}
        />
        
        <div className="p-3 h-[30%] flex flex-col justify-between">
          <h4 className="font-semibold text-sm line-clamp-2 leading-tight" title={anime.title}>
            {anime.title}
          </h4>
          
          <div className="mt-auto space-y-2">
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {anime.genres.slice(0, 2).map((genre, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {anime.year || 'N/A'}
              </div>
              <Badge variant="outline" className="text-xs">
                {anime.status === 'available' ? 'Disponível' : anime.status || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4"
          >
            <Play className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ScrapedAnimeGrid({ initialQuery = "", className }: ScrapedAnimeGridProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedAnime, setSelectedAnime] = useState<ScrapedAnime | null>(null);

  const { data: animes, isLoading, error, refetch } = useQuery({
    queryKey: ['scraped-animes', searchQuery],
    queryFn: () => searchScrapedAnimes(searchQuery || undefined),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleAnimeClick = (anime: ScrapedAnime) => {
    setSelectedAnime(anime);
  };

  const handleBackToGrid = () => {
    setSelectedAnime(null);
  };

  if (selectedAnime) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToGrid}
            className="mb-4"
          >
            ← Voltar para a lista
          </Button>
          
          <div className="flex items-start gap-6 p-6 bg-card rounded-2xl border">
            <img
              src={selectedAnime.thumbnail || `https://via.placeholder.com/200x300/8A2BE2/FFFFFF?text=${encodeURIComponent(selectedAnime.title.slice(0, 20))}`}
              alt={selectedAnime.title}
              className="w-48 h-72 object-cover rounded-xl"
            />
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{selectedAnime.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedAnime.genres?.map((genre, index) => (
                  <Badge key={index} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ano:</span>
                  <span className="ml-2">{selectedAnime.year || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Episódios:</span>
                  <span className="ml-2">{selectedAnime.totalEpisodes || '?'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">{selectedAnime.status || 'N/A'}</span>
                </div>
              </div>
              
              {selectedAnime.synopsis && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Sinopse:</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedAnime.synopsis}
                  </p>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => window.open(selectedAnime.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver no Site Original
              </Button>
            </div>
          </div>
        </div>
        
        <ScrapedEpisodesList anime={selectedAnime} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Animes dos Sites de Streaming</h2>
          <Badge variant="outline" className="text-xs">
            Web Scraping
          </Badge>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <Input
            type="text"
            placeholder="Buscar animes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4.5] w-full rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert>
          <AlertDescription>
            Erro ao buscar animes: {error instanceof Error ? error.message : 'Erro desconhecido'}
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && animes && animes.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum anime encontrado</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `Não encontramos animes para "${searchQuery}". Tente uma busca diferente.`
              : 'Faça uma busca para ver animes disponíveis nos sites de streaming.'
            }
          </p>
        </div>
      )}

      {!isLoading && !error && animes && animes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {animes.length} anime{animes.length !== 1 ? 's' : ''} encontrado{animes.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {animes.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onClick={() => handleAnimeClick(anime)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}