import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { getLatestManga } from "@/lib/api";

interface Manga {
  id: string;
  title: string;
  image: string;
  rating?: string | number | null;
  year?: number;
  status?: string | null;
  genres?: string[] | null;
  chapters?: number;
  latestChapter?: number | null;
  type?: string;
  author?: string | null;
  synopsis?: string | null;
}

export default function Mangas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filterByStatus, setFilterByStatus] = useState("all");
  const [filterByGenre, setFilterByGenre] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const itemsPerPage = 30;
  
  const fallbackImage = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format&q=80";
  
  const handleImageError = (mangaId: string) => {
    setImageErrors(prev => prev.includes(mangaId) ? prev : [...prev, mangaId]);
  };

  // Buscar mangás
  const { data: mangas = [], isLoading } = useQuery({
    queryKey: ["latest-manga"],
    queryFn: getLatestManga,
  });

  const filteredMangas = mangas.filter((manga: Manga) =>
    manga.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredMangas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMangas = filteredMangas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset para página 1 quando a busca muda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const genres = [
    "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Romance", 
    "Sci-Fi", "Slice of Life", "Sobrenatural", "Thriller", "Mistério",
    "Horror", "Psicológico", "Escola", "Esporte"
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
    { value: "chapters", label: "Capítulos" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header da página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mangás</h1>
          <p className="text-muted-foreground">
            Explore nossa coleção de mangás e encontre sua próxima leitura
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
                  placeholder="Buscar mangás pelo título..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 text-base"
                  data-testid="input-search-manga"
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
              {isLoading ? "Carregando..." : `${filteredMangas.length} mangás encontrados • Página ${currentPage} de ${totalPages}`}
            </p>
            {searchQuery && (
              <Badge variant="secondary" className="text-sm">
                Buscando por: "{searchQuery}"
              </Badge>
            )}
          </div>
        </div>

        {/* Grid/Lista de mangás */}
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
            {currentMangas.map((manga: Manga) => (
              <Link key={manga.id} href={`/mangas/${manga.id}`}>
                <Card 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  data-testid={`card-manga-${manga.id}`}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      <img
                        src={imageErrors.includes(manga.id) ? fallbackImage : (manga.image || fallbackImage)}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={() => handleImageError(manga.id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Action overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" className="bg-primary/90 hover:bg-primary">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Ler Agora
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-foreground truncate mb-1">
                        {manga.title}
                      </h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {manga.author && (
                          <p className="truncate">Por: {manga.author}</p>
                        )}
                        <div className="flex justify-between">
                          {manga.year && <span>{manga.year}</span>}
                          {manga.latestChapter && <span>Cap. {manga.latestChapter}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentMangas.map((manga: Manga) => (
              <Card key={manga.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={imageErrors.includes(manga.id) ? fallbackImage : (manga.image || fallbackImage)}
                      alt={manga.title}
                      className="w-16 h-20 object-cover rounded"
                      onError={() => handleImageError(manga.id)}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {manga.title}
                      </h3>
                      {manga.author && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Por: {manga.author}
                        </p>
                      )}
                      <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                        {manga.year && <span>{manga.year}</span>}
                        {manga.latestChapter && <span>• Cap. {manga.latestChapter}</span>}
                        {manga.type && <span>• {manga.type}</span>}
                      </div>
                      {manga.genres && (
                        <div className="flex gap-1 flex-wrap">
                          {manga.genres.slice(0, 3).map((genre: string) => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {manga.rating && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {typeof manga.rating === 'number' ? manga.rating.toFixed(1) : manga.rating}
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
        {!isLoading && filteredMangas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum mangá encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou usar termos de busca diferentes
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setFilterByStatus("all");
                  setFilterByGenre("all");
                  setCurrentPage(1);
                }}
                data-testid="button-clear-filters"
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Componente de Paginação */}
        {!isLoading && filteredMangas.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="flex items-center space-x-1">
              {/* Primeira página */}
              {currentPage > 3 && (
                <>
                  <Button
                    variant={1 === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                  {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                </>
              )}

              {/* Páginas ao redor da atual */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page >= Math.max(1, currentPage - 2) && 
                  page <= Math.min(totalPages, currentPage + 2)
                )
                .map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={page === currentPage ? "bg-primary text-primary-foreground" : ""}
                  >
                    {page}
                  </Button>
                ))}

              {/* Última página */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                  <Button
                    variant={totalPages === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Informações da página atual */}
        {!isLoading && filteredMangas.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMangas.length)} de {filteredMangas.length} mangás
          </div>
        )}
      </div>
    </div>
  );
}
