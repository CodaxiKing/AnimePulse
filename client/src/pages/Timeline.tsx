import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TimelineVisualization } from '@/components/TimelineVisualization';
import { TimelineFilters } from '@/components/TimelineFilters';
import { useLocation } from 'wouter';
import { 
  Clock as TimelineIcon, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight,
  Trophy,
  Target,
  PlayCircle,
  CheckCircle2,
  BookmarkPlus,
  History,
  Star
} from 'lucide-react';
import {
  TimelineFilter,
  TimelineAnime,
  convertMalToTimelineAnime,
  organizeAnimesByTimeline,
  filterTimelineAnimes,
  getAvailableDecades,
  historicalMilestones,
  getMilestonesForYear,
  calculateTimelineStats
} from '@/lib/timelineService';

export default function Timeline() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<TimelineFilter>({
    genres: [],
    studios: [],
    minScore: 0,
    status: []
  });

  // Buscar dados de animes para timeline
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['/api/mal/anime/trending?limit=100']
  });

  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: ['/api/mal/anime/top?limit=100']
  });

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/user/progress']
  });

  const isLoading = loadingTrending || loadingTop;

  // Processar dados para timeline
  const timelineData = useMemo(() => {
    // Usar dados disponíveis mesmo se apenas um dataset estiver carregado
    if (!trendingData && !topData) {
      return [];
    }

    const allAnimes = [
      ...((trendingData as any)?.data || []).map((item: any) => item.node),
      ...((topData as any)?.data || []).map((item: any) => item.node)
    ];

    // Remover duplicatas por ID
    const uniqueAnimes = allAnimes.reduce((acc: any[], current: any) => {
      if (!acc.find(anime => anime.id === current.id)) {
        acc.push(current);
      }
      return acc;
    }, []);

    const timelineAnimes = uniqueAnimes.map(convertMalToTimelineAnime);
    return organizeAnimesByTimeline(timelineAnimes);
  }, [trendingData, topData]);

  // Aplicar filtros
  const filteredTimelineData = useMemo(() => {
    return filterTimelineAnimes(timelineData, filters);
  }, [timelineData, filters]);

  // Calcular estatísticas do usuário
  const timelineStats = useMemo(() => {
    const allAnimes = timelineData.flatMap(yearData => [
      ...yearData.seasons.winter,
      ...yearData.seasons.spring,
      ...yearData.seasons.summer,
      ...yearData.seasons.fall
    ]);
    return calculateTimelineStats(allAnimes, userProgress);
  }, [timelineData, userProgress]);

  // Marcos históricos para o ano selecionado
  const selectedYearMilestones = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const targetYear = filteredTimelineData.find(data => data.year <= currentYear)?.year || currentYear;
    return getMilestonesForYear(targetYear);
  }, [filteredTimelineData]);

  // Extrair dados únicos para filtros
  const { availableGenres, availableStudios, availableDecades } = useMemo(() => {
    const genres = new Set<string>();
    const studios = new Set<string>();

    timelineData.forEach(yearData => {
      Object.values(yearData.seasons).forEach(seasonAnimes => {
        seasonAnimes.forEach(anime => {
          anime.genres.forEach(genre => genres.add(genre));
          studios.add(anime.studio);
        });
      });
    });

    return {
      availableGenres: Array.from(genres).sort(),
      availableStudios: Array.from(studios).sort(),
      availableDecades: getAvailableDecades(timelineData)
    };
  }, [timelineData]);

  // Estatísticas da timeline
  const stats = useMemo(() => {
    const totalAnimes = timelineData.reduce((sum, year) => sum + year.totalAnimes, 0);
    const totalYears = timelineData.length;
    const avgAnimesPerYear = totalYears > 0 ? (totalAnimes / totalYears).toFixed(1) : '0';
    const topYear = timelineData.reduce((max, year) => 
      year.totalAnimes > max.totalAnimes ? year : max, 
      { year: 0, totalAnimes: 0 }
    );

    return {
      totalAnimes,
      totalYears,
      avgAnimesPerYear,
      topYear: topYear.year || 'N/A',
      topYearCount: topYear.totalAnimes || 0
    };
  }, [timelineData]);

  const handleAnimeSelect = (anime: TimelineAnime) => {
    setLocation(`/animes/${anime.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="h-12 w-64 mx-auto bg-muted/50 rounded animate-pulse" />
            <div className="h-6 w-96 mx-auto bg-muted/50 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
          
          <div className="h-96 w-full bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TimelineIcon className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Timeline Interativa de Animes
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore a evolução do anime através dos anos. Navegue por temporadas, descubra tendências e 
            encontre seus próximos animes favoritos organizados cronologicamente.
          </p>
        </div>

        {/* Estatísticas do Usuário */}
        {timelineStats.totalAnimes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completos</p>
                  <p className="text-2xl font-bold text-green-400">{timelineStats.completedAnimes}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <PlayCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assistindo</p>
                  <p className="text-2xl font-bold text-blue-400">{timelineStats.watchingAnimes}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <BookmarkPlus className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planejados</p>
                  <p className="text-2xl font-bold text-yellow-400">{timelineStats.plannedAnimes}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <TimelineIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas</p>
                  <p className="text-2xl font-bold text-purple-400">{timelineStats.totalWatchTime}h</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-bold">{stats.totalAnimes}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total de Animes</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold">{stats.totalYears}</span>
              </div>
              <p className="text-sm text-muted-foreground">Anos Cobertos</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold">{stats.avgAnimesPerYear}</span>
              </div>
              <p className="text-sm text-muted-foreground">Média por Ano</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold">{stats.topYear}</span>
                <Badge variant="secondary">{stats.topYearCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Ano com Mais Animes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <TimelineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableGenres={availableGenres}
          availableStudios={availableStudios}
          availableDecades={availableDecades}
        />

        {/* Timeline Principal */}
        <Card className="bg-card/30 backdrop-blur-sm border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimelineIcon className="w-6 h-6" />
              Navegação Temporal
              <Badge variant="outline" className="ml-auto">
                {filteredTimelineData.reduce((sum, year) => sum + year.totalAnimes, 0)} animes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTimelineData.length > 0 ? (
              <div className="space-y-6">
                {/* Marcos Históricos */}
                {selectedYearMilestones.length > 0 && (
                  <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-400" />
                        Marcos Históricos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {selectedYearMilestones.map((milestone, index) => (
                          <div key={index} className="flex gap-3 p-3 rounded-lg bg-background/50">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                {milestone.year.toString().slice(-2)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-purple-400">{milestone.title}</h4>
                              <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {milestone.type === 'technology' && '🔧'}
                                {milestone.type === 'cultural' && '🌟'}
                                {milestone.type === 'industry' && '🏢'}
                                {milestone.type === 'awards' && '🏆'}
                                {milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <TimelineVisualization
                  timelineData={filteredTimelineData}
                  onAnimeSelect={handleAnimeSelect}
                />
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <TimelineIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum anime encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente ajustar os filtros para encontrar mais resultados
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      genres: [],
                      studios: [],
                      minScore: 0,
                      status: []
                    })}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Descobriu algo interessante?</h3>
            <p className="text-muted-foreground mb-4">
              Explore mais animes na nossa biblioteca completa ou veja os mais populares do momento
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setLocation('/animes')} className="bg-purple-600 hover:bg-purple-700">
                Ver Todos os Animes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => setLocation('/')}>
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}