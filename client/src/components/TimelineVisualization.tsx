import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { 
  TimelineYear, 
  TimelineAnime, 
  seasonNames, 
  seasonColors, 
  seasonIcons 
} from '@/lib/timelineService';

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
  const timelineRef = useRef<HTMLDivElement>(null);

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

  const renderAnimeCard = (anime: TimelineAnime) => (
    <Card 
      key={anime.id} 
      className="group hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 cursor-pointer"
      onClick={() => onAnimeSelect?.(anime)}
      data-testid={`timeline-anime-${anime.id}`}
    >
      <CardContent className="p-4">
        <div className="relative mb-3">
          <img
            src={anime.image}
            alt={anime.title}
            className="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {seasonIcons[anime.season]} {seasonNames[anime.season]}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-black/70 text-white border-white/20">
              ⭐ {anime.score.toFixed(1)}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
            {anime.title}
          </h3>
          
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
  );

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

            {/* Controles de zoom */}
            <div className="flex items-center gap-2">
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