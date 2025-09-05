import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimelineVisualization } from '@/components/TimelineVisualization';
import { TimelineFilters } from '@/components/TimelineFilters';
import { useLocation } from 'wouter';
import { 
  Clock as TimelineIcon, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  TimelineFilter,
  TimelineAnime,
  convertMalToTimelineAnime,
  organizeAnimesByTimeline,
  filterTimelineAnimes,
  getAvailableDecades
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
    queryKey: ['/api/mal/anime/trending', { limit: 100 }]
  });

  const { data: topData, isLoading: loadingTop } = useQuery({
    queryKey: ['/api/mal/anime/top', { limit: 100 }]
  });

  const isLoading = loadingTrending || loadingTop;

  // Processar dados para timeline
  const timelineData = useMemo(() => {
    if (!trendingData?.data || !topData?.data) return [];

    const allAnimes = [
      ...(trendingData?.data || []).map((item: any) => item.node),
      ...(topData?.data || []).map((item: any) => item.node)
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

        {/* Estatísticas */}
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
              <TimelineVisualization
                timelineData={filteredTimelineData}
                onAnimeSelect={handleAnimeSelect}
              />
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