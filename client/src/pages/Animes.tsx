import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AnimeCard from "@/components/AnimeCard";
import { getTrendingAnime } from "@/lib/api";

export default function Animes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filterByStatus, setFilterByStatus] = useState("all");
  const [filterByGenre, setFilterByGenre] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Buscar animes com base nos filtros
  const { data: animes = [], isLoading } = useQuery({
    queryKey: ["trending-animes"],
    queryFn: getTrendingAnime,
  });

  const filteredAnimes = animes.filter((anime: any) =>
    anime.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const genres = [
    "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Romance", 
    "Sci-Fi", "Slice of Life", "Sobrenatural", "Thriller", "Mistério"
  ];

  const statusOptions = [
    { value: "all", label: "Todos os Status" },
    { value: "completed", label: "Completo" },
    { value: "ongoing", label: "Em Lançamento" },
    { value: "upcoming", label: "Próximos" },
  ];

  const sortOptions = [
    { value: "popularity", label: "Popularidade" },
    { value: "rating", label: "Avaliação" },
    { value: "year", label: "Ano de Lançamento" },
    { value: "title", label: "Título A-Z" },
    { value: "episodes", label: "Episódios" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header da página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Animes</h1>
          <p className="text-muted-foreground">
            Descubra e explore nossa vasta coleção de animes
          </p>
        </div>

        {/* Barra de busca e filtros */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Busca principal */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar animes pelo título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base"
                  data-testid="input-search-anime"
                />
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ordenar por
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </label>
                  <Select value={filterByStatus} onValueChange={setFilterByStatus}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Gênero
                  </label>
                  <Select value={filterByGenre} onValueChange={setFilterByGenre}>
                    <SelectTrigger data-testid="select-genre">
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os gêneros</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre.toLowerCase()}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Visualização
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="flex-1"
                      data-testid="button-grid-view"
                    >
                      <Grid className="w-4 h-4 mr-1" />
                      Grade
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="flex-1"
                      data-testid="button-list-view"
                    >
                      <List className="w-4 h-4 mr-1" />
                      Lista
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : `${filteredAnimes.length} animes encontrados`}
            </p>
            {searchQuery && (
              <Badge variant="secondary" className="text-sm">
                Buscando por: "{searchQuery}"
              </Badge>
            )}
          </div>
        </div>

        {/* Grid/Lista de animes */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-2xl" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAnimes.map((anime: any) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnimes.map((anime: any) => (
              <Card key={anime.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {anime.title}
                      </h3>
                      <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                        {anime.year && <span>{anime.year}</span>}
                        {anime.episodes && <span>• {anime.episodes} eps</span>}
                        {anime.type && <span>• {anime.type}</span>}
                      </div>
                      {anime.genres && (
                        <div className="flex gap-1 flex-wrap">
                          {anime.genres.slice(0, 3).map((genre: string) => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {anime.rating && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {typeof anime.rating === 'number' ? anime.rating.toFixed(1) : anime.rating}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ★★★★★
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && filteredAnimes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum anime encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou usar termos de busca diferentes
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setFilterByStatus("all");
                  setFilterByGenre("all");
                }}
                data-testid="button-clear-filters"
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
