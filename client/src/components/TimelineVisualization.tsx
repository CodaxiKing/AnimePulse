import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Calendar, Filter, ChevronLeft, ChevronRight, Play, CheckCircle, Clock, Bookmark, Star } from 'lucide-react';
import { Link } from 'wouter';
import { 
  TimelineYear, 
  TimelineAnime, 
  seasonNames, 
  seasonColors, 
  seasonIcons 
} from '@/lib/timelineService';
import { useQuery } from '@tanstack/react-query';

interface UserProgress {
  animeId: number;
  episodesWatched: number;
  totalEpisodes: number;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped';
  score?: number;
}

interface TimelineVisualizationProps {
  timelineData: TimelineYear[];
  onYearSelect?: (year: number) => void;
  onAnimeSelect?: (anime: TimelineAnime) => void;
}

export function TimelineVisualization({ 
  timelineData, 
  onYearSelect, 
  onAnimeSelect 
}: TimelineVisualizationProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [showUserProgress, setShowUserProgress] = useState(true);
  const [hoveredAnime, setHoveredAnime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ['/api/user/progress'],
    enabled: showUserProgress
  });

  // Criar mapa de progresso para acesso rápido
  const progressMap = new Map<number, UserProgress>();
  userProgress.forEach(progress => {
    progressMap.set(progress.animeId, progress);
  });

  // Auto-selecionar ano atual na inicialização
  useEffect(() => {
    if (timelineData.length > 0 && !selectedYear) {
      const currentYear = new Date().getFullYear();
      const hasCurrentYear = timelineData.find(data => data.year === currentYear);
      setSelectedYear(hasCurrentYear ? currentYear : timelineData[0].year);
    }
  }, [timelineData, selectedYear]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    onYearSelect?.(yearNum);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    if (!selectedYear) return;
    
    const currentIndex = timelineData.findIndex(data => data.year === selectedYear);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < timelineData.length) {
      setSelectedYear(timelineData[newIndex].year);
    }
  };

  const filteredYearData = timelineData.find(data => data.year === selectedYear);

  const getSeasonAnimes = (yearData: TimelineYear) => {
    if (selectedSeason === 'all') {
      return [
        ...yearData.seasons.winter,
        ...yearData.seasons.spring,
        ...yearData.seasons.summer,
        ...yearData.seasons.fall
      ];
    }
    return yearData.seasons[selectedSeason as keyof typeof yearData.seasons];
  };

  const getUserProgress = (animeId: number): UserProgress | undefined => {
    return progressMap.get(animeId);
  };

  const getProgressColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'watching': return 'bg-blue-500';
      case 'plan_to_watch': return 'bg-yellow-500';
      case 'dropped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderAnimeCard = (anime: TimelineAnime) => {
    const progress = getUserProgress(anime.id);
    const isHovered = hoveredAnime === anime.id;
    
    return (
    <TooltipProvider key={anime.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`group hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border cursor-pointer relative overflow-hidden ${
              progress ? 'border-purple-400/60' : 'border-purple-500/20'
            } hover:border-purple-400/80 ${isHovered ? 'scale-105 z-10' : ''}`}
            onClick={() => onAnimeSelect?.(anime)}
            onMouseEnter={() => setHoveredAnime(anime.id)}
            onMouseLeave={() => setHoveredAnime(null)}
            data-testid={`timeline-anime-${anime.id}`}
          >
            <CardContent className="p-4">
              {/* Indicador de progresso no topo do card */}
              {progress && showUserProgress && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${getProgressColor(progress.status)} opacity-80`} />
              )}
              
              <div className="relative mb-3">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Badges superiores */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                    {seasonIcons[anime.season]} {seasonNames[anime.season]}
                  </Badge>
                  {progress && showUserProgress && (
                    <Badge variant="outline" className={`text-xs text-white border-white/20 ${getProgressColor(progress.status)}`}>
                      {progress.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {progress.status === 'watching' && <Play className="w-3 h-3 mr-1" />}
                      {progress.status === 'plan_to_watch' && <Bookmark className="w-3 h-3 mr-1" />}
                      {progress.status === 'dropped' && <Clock className="w-3 h-3 mr-1" />}
                    </Badge>
                  )}
                </div>
                
                {/* Badges inferiores */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Badge variant="outline" className="bg-black/70 text-white border-white/20 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {anime.score.toFixed(1)}
                  </Badge>
                  {progress?.score && (
                    <Badge variant="outline" className="bg-purple-900/70 text-white border-purple-400/20 text-xs">
                      Minha: {progress.score}
                    </Badge>
                  )}
                </div>
                
                {/* Overlay de informações extras ao hover */}
                {isHovered && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-center text-white p-4">
                      <Play className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Ver Detalhes</p>
                      {progress && (
                        <p className="text-xs mt-1">
                          {progress.episodesWatched}/{progress.totalEpisodes} eps
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
                  {anime.title}
                </h3>
                
                {/* Barra de progresso para animes assistindo */}
                {progress && progress.status === 'watching' && showUserProgress && (
                  <div className="space-y-1">
                    <Progress 
                      value={(progress.episodesWatched / progress.totalEpisodes) * 100} 
                      className="h-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      {progress.episodesWatched}/{progress.totalEpisodes} episódios
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {anime.genres.slice(0, 3).map(genre => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>📺 {anime.episodes} eps</div>
                  <div>🏢 {anime.studio}</div>
                  <div className="capitalize">📅 {anime.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-64 p-3">
          <div className="space-y-2">
            <h4 className="font-semibold">{anime.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {anime.synopsis}
            </p>
            {progress && (
              <div className="text-xs border-t pt-2">
                <p><strong>Status:</strong> {progress.status}</p>
                <p><strong>Progresso:</strong> {progress.episodesWatched}/{progress.totalEpisodes}</p>
                {progress.score && <p><strong>Sua nota:</strong> {progress.score}/10</p>}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )};

  const renderTimelineView = () => {
    if (!filteredYearData) return null;

    const animes = getSeasonAnimes(filteredYearData);

    return (
      <div className="space-y-6">
        {/* Barra de navegação por temporada */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant={selectedSeason === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSeason('all')}
            data-testid="season-filter-all"
          >
            Todas as Temporadas
          </Button>
          {Object.entries(seasonNames).map(([season, name]) => (
            <Button
              key={season}
              variant={selectedSeason === season ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeason(season)}
              className={selectedSeason === season ? `bg-gradient-to-r ${seasonColors[season as keyof typeof seasonColors]} text-black` : ''}
              data-testid={`season-filter-${season}`}
            >
              {seasonIcons[season as keyof typeof seasonIcons]} {name}
            </Button>
          ))}
        </div>

        {/* Grid de animes */}
        <div 
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          style={{
            transform: `scale(${Math.max(zoomLevel / 100, 0.5)})`,
            transformOrigin: 'top center'
          }}
        >
          {animes.map(renderAnimeCard)}
        </div>

        {animes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum anime encontrado para esta temporada</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" ref={timelineRef}>
      {/* Controles da Timeline */}
      <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Navegação de ano */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear('prev')}
                disabled={!selectedYear || timelineData.findIndex(d => d.year === selectedYear) === timelineData.length - 1}
                data-testid="year-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Select value={selectedYear?.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32" data-testid="year-selector">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {timelineData.map(data => (
                    <SelectItem key={data.year} value={data.year.toString()}>
                      {data.year} ({data.totalAnimes})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear('next')}
                disabled={!selectedYear || timelineData.findIndex(d => d.year === selectedYear) === 0}
                data-testid="year-next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Controles de zoom e visualização */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle para progresso do usuário */}
              <Button
                variant={showUserProgress ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUserProgress(!showUserProgress)}
                data-testid="toggle-user-progress"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Progresso
              </Button>
              
              <div className="w-px h-6 bg-border" />
              
              {/* Controles de zoom */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                data-testid="zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <div className="w-20 px-2">
                <Slider
                  value={[zoomLevel]}
                  onValueChange={([value]) => setZoomLevel(value)}
                  min={50}
                  max={200}
                  step={25}
                  className="w-full"
                  data-testid="zoom-slider"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                data-testid="zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground min-w-12">
                {zoomLevel}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização da Timeline */}
      <ScrollArea className="h-[70vh]">
        {renderTimelineView()}
      </ScrollArea>
    </div>
  );
}