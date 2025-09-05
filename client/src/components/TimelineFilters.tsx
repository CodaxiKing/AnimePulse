import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  X, 
  Search, 
  Star, 
  Calendar,
  Building,
  Tag,
  RotateCcw 
} from 'lucide-react';
import { TimelineFilter } from '@/lib/timelineService';

interface TimelineFiltersProps {
  filters: TimelineFilter;
  onFiltersChange: (filters: TimelineFilter) => void;
  availableGenres: string[];
  availableStudios: string[];
  availableDecades: string[];
}

export function TimelineFilters({
  filters,
  onFiltersChange,
  availableGenres,
  availableStudios,
  availableDecades
}: TimelineFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchGenre, setSearchGenre] = useState('');
  const [searchStudio, setSearchStudio] = useState('');

  const updateFilters = (updates: Partial<TimelineFilter>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const addGenre = (genre: string) => {
    if (!filters.genres.includes(genre)) {
      updateFilters({ genres: [...filters.genres, genre] });
    }
  };

  const removeGenre = (genre: string) => {
    updateFilters({ genres: filters.genres.filter(g => g !== genre) });
  };

  const addStudio = (studio: string) => {
    if (!filters.studios.includes(studio)) {
      updateFilters({ studios: [...filters.studios, studio] });
    }
  };

  const removeStudio = (studio: string) => {
    updateFilters({ studios: filters.studios.filter(s => s !== studio) });
  };

  const resetFilters = () => {
    onFiltersChange({
      genres: [],
      studios: [],
      minScore: 0,
      status: [],
      decade: undefined
    });
  };

  const hasActiveFilters = 
    filters.genres.length > 0 ||
    filters.studios.length > 0 ||
    filters.minScore > 0 ||
    filters.status.length > 0 ||
    filters.decade;

  const filteredGenres = availableGenres.filter(genre =>
    genre.toLowerCase().includes(searchGenre.toLowerCase())
  );

  const filteredStudios = availableStudios.filter(studio =>
    studio.toLowerCase().includes(searchStudio.toLowerCase())
  );

  return (
    <Card className="timeline-filters bg-card/50 backdrop-blur-sm border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros da Timeline
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filters.genres.length + filters.studios.length + 
                 (filters.minScore > 0 ? 1 : 0) + filters.status.length + 
                 (filters.decade ? 1 : 0)}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                data-testid="reset-filters"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="toggle-filters"
            >
              {isExpanded ? 'Ocultar' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Filtro por Década */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Década
            </Label>
            <Select
              value={filters.decade || 'all'}
              onValueChange={(value) => updateFilters({ decade: value === 'all' ? undefined : value })}
            >
              <SelectTrigger data-testid="decade-filter">
                <SelectValue placeholder="Todas as décadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as décadas</SelectItem>
                {availableDecades.map(decade => (
                  <SelectItem key={decade} value={decade}>
                    {decade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Score Mínimo */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Score Mínimo: {filters.minScore.toFixed(1)}
            </Label>
            <Slider
              value={[filters.minScore]}
              onValueChange={([value]) => updateFilters({ minScore: value })}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              data-testid="score-filter"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.0</span>
              <span>5.0</span>
              <span>10.0</span>
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Status do Anime
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'completed', label: 'Completo' },
                { value: 'airing', label: 'Em Exibição' },
                { value: 'upcoming', label: 'Em Breve' }
              ].map(status => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.status.includes(status.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({ status: [...filters.status, status.value] });
                      } else {
                        updateFilters({ status: filters.status.filter(s => s !== status.value) });
                      }
                    }}
                    data-testid={`status-filter-${status.value}`}
                  />
                  <Label htmlFor={`status-${status.value}`} className="text-sm">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Gêneros */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Gêneros
            </Label>
            
            {/* Gêneros Selecionados */}
            {filters.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.genres.map(genre => (
                  <Badge 
                    key={genre} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive"
                    onClick={() => removeGenre(genre)}
                    data-testid={`selected-genre-${genre}`}
                  >
                    {genre}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Busca de Gêneros */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gêneros..."
                value={searchGenre}
                onChange={(e) => setSearchGenre(e.target.value)}
                className="pl-10"
                data-testid="genre-search"
              />
            </div>

            {/* Lista de Gêneros */}
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1">
                {filteredGenres.slice(0, 20).map(genre => (
                  <Button
                    key={genre}
                    variant="outline"
                    size="sm"
                    className="justify-start h-8 text-xs"
                    onClick={() => addGenre(genre)}
                    disabled={filters.genres.includes(genre)}
                    data-testid={`add-genre-${genre}`}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtro por Estúdios */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Estúdios
            </Label>
            
            {/* Estúdios Selecionados */}
            {filters.studios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.studios.map(studio => (
                  <Badge 
                    key={studio} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive"
                    onClick={() => removeStudio(studio)}
                    data-testid={`selected-studio-${studio}`}
                  >
                    {studio}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Busca de Estúdios */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estúdios..."
                value={searchStudio}
                onChange={(e) => setSearchStudio(e.target.value)}
                className="pl-10"
                data-testid="studio-search"
              />
            </div>

            {/* Lista de Estúdios */}
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1">
                {filteredStudios.slice(0, 15).map(studio => (
                  <Button
                    key={studio}
                    variant="outline"
                    size="sm"
                    className="justify-start h-8 text-xs"
                    onClick={() => addStudio(studio)}
                    disabled={filters.studios.includes(studio)}
                    data-testid={`add-studio-${studio}`}
                  >
                    {studio}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}