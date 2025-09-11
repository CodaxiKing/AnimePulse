import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  searchScrapedAnimes, 
  getScrapedAnimeEpisodes,
  checkScrapingApiHealth,
  type ScrapedAnime, 
  type ScrapedEpisode 
} from "../lib/scrapingApi";
import { Search, Globe, ExternalLink, Info, Wifi, WifiOff } from "lucide-react";
import ScrapedAnimeCard from "./ScrapedAnimeCard";
import ScrapedEpisodePlayer from "./ScrapedEpisodePlayer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ScrapedAnimeGridProps {
  className?: string;
}

const SITE_NAMES = {
  animesdigital: 'AnimesDigital.org',
  animesonlinecc: 'AnimesOnlineCC.to',
  goyabu: 'Goyabu.to'
};

export default function ScrapedAnimeGrid({ className }: ScrapedAnimeGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedAnime, setSelectedAnime] = useState<ScrapedAnime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<ScrapedEpisode | null>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  // Check API health
  const { data: apiOnline } = useQuery({
    queryKey: ['scraping-api-health'],
    queryFn: checkScrapingApiHealth,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1
  });

  // Search animes
  const { 
    data: animes, 
    isLoading: animesLoading, 
    error: animesError,
    refetch: refetchAnimes 
  } = useQuery({
    queryKey: ['scraped-animes', searchQuery, selectedSite],
    queryFn: () => searchScrapedAnimes(
      searchQuery || undefined, 
      selectedSite === 'all' ? undefined : selectedSite
    ),
    enabled: apiOnline === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get episodes for selected anime
  const { 
    data: episodes, 
    isLoading: episodesLoading, 
    error: episodesError 
  } = useQuery({
    queryKey: ['scraped-episodes', selectedAnime?.siteId, selectedAnime?.id],
    queryFn: () => getScrapedAnimeEpisodes(
      selectedAnime!.siteId, 
      selectedAnime!.id, 
      selectedAnime!.url
    ),
    enabled: !!selectedAnime && apiOnline === true,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchAnimes();
  };

  const handleAnimeClick = (anime: ScrapedAnime) => {
    setSelectedAnime(anime);
    setSelectedEpisode(null);
    setCurrentEpisodeIndex(0);
  };

  const handleEpisodeClick = (episode: ScrapedEpisode) => {
    setSelectedEpisode(episode);
    const index = episodes?.findIndex(ep => ep.id === episode.id) || 0;
    setCurrentEpisodeIndex(index);
  };

  const handleNextEpisode = () => {
    if (episodes && currentEpisodeIndex < episodes.length - 1) {
      const nextIndex = currentEpisodeIndex + 1;
      setCurrentEpisodeIndex(nextIndex);
      setSelectedEpisode(episodes[nextIndex]);
    }
  };

  const handlePreviousEpisode = () => {
    if (episodes && currentEpisodeIndex > 0) {
      const prevIndex = currentEpisodeIndex - 1;
      setCurrentEpisodeIndex(prevIndex);
      setSelectedEpisode(episodes[prevIndex]);
    }
  };

  const handleBackToGrid = () => {
    setSelectedAnime(null);
    setSelectedEpisode(null);
  };

  const handleClosePlayer = () => {
    setSelectedEpisode(null);
  };

  // API offline state
  if (apiOnline === false) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            A API de Web Scraping está offline. Verifique se o servidor está rodando em{' '}
            <code className="bg-muted px-1 rounded">http://localhost:3001</code>
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show anime details and episodes
  if (selectedAnime) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToGrid}
            className="mb-4"
          >
            ← Voltar para busca
          </Button>
          
          <div className="flex items-start gap-6 p-6 bg-card rounded-2xl border">
            <img
              src={selectedAnime.thumbnail || `https://via.placeholder.com/200x300/8A2BE2/FFFFFF?text=${encodeURIComponent(selectedAnime.title.slice(0, 20))}`}
              alt={selectedAnime.title}
              className="w-48 h-72 object-cover rounded-xl"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{selectedAnime.title}</h1>
                <Badge variant="outline">
                  {SITE_NAMES[selectedAnime.siteId as keyof typeof SITE_NAMES]}
                </Badge>
              </div>
              
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
        
        {/* Episodes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Episódios</h2>
            {episodes && (
              <span className="text-sm text-muted-foreground">
                {episodes.length} episódio{episodes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {episodesLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          )}
          
          {episodesError && (
            <Alert>
              <AlertDescription>
                Erro ao buscar episódios: {episodesError instanceof Error ? episodesError.message : 'Erro desconhecido'}
              </AlertDescription>
            </Alert>
          )}
          
          {episodes && episodes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/20 transition-all duration-200 cursor-pointer"
                  onClick={() => handleEpisodeClick(episode)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={episode.thumbnail || `https://via.placeholder.com/400x225/8A2BE2/FFFFFF?text=EP+${episode.number}`}
                      alt={episode.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4"
                      >
                        <Search className="w-6 h-6" />
                      </Button>
                    </div>
                    
                    <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      EP {episode.number}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {episode.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {episode.duration || '24 min'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {episodes && episodes.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum episódio encontrado</h3>
              <p className="text-muted-foreground">
                Não conseguimos encontrar episódios para este anime.
              </p>
            </div>
          )}
        </div>
        
        {selectedEpisode && (
          <ScrapedEpisodePlayer
            episode={selectedEpisode}
            isOpen={!!selectedEpisode}
            onClose={handleClosePlayer}
            onNext={currentEpisodeIndex < (episodes?.length || 0) - 1 ? handleNextEpisode : undefined}
            onPrevious={currentEpisodeIndex > 0 ? handlePreviousEpisode : undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Descobrir Animes</h1>
            <p className="text-muted-foreground">
              Explore animes de diversos sites de streaming através de web scraping
            </p>
          </div>
          {apiOnline && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Wifi className="w-3 h-3 mr-1" />
              API Online
            </Badge>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidade usa uma API de web scraping independente. 
            Certifique-se de que o servidor esteja rodando em <code>localhost:3001</code>
          </AlertDescription>
        </Alert>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar animes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={animesLoading}>
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <Tabs value={selectedSite} onValueChange={setSelectedSite}>
          <TabsList>
            <TabsTrigger value="all">Todos os Sites</TabsTrigger>
            <TabsTrigger value="animesdigital">AnimesDigital</TabsTrigger>
            <TabsTrigger value="animesonlinecc">AnimesOnlineCC</TabsTrigger>
            <TabsTrigger value="goyabu">Goyabu</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results */}
      {animesLoading && (
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

      {animesError && (
        <Alert>
          <AlertDescription>
            Erro ao buscar animes: {animesError instanceof Error ? animesError.message : 'Erro desconhecido'}
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAnimes()}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!animesLoading && !animesError && animes && animes.length === 0 && (
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

      {!animesLoading && !animesError && animes && animes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {animes.length} anime{animes.length !== 1 ? 's' : ''} encontrado{animes.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {animes.map((anime) => (
              <ScrapedAnimeCard
                key={anime.id}
                anime={anime}
                onClick={handleAnimeClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}