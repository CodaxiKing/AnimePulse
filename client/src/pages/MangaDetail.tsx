import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, BookOpen, ChevronDown, ChevronUp, Star, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMangaByIdAPI } from "@/lib/api";
import type { Manga } from "@shared/schema";

export default function MangaDetail() {
  const { id } = useParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: manga, isLoading: loadingManga } = useQuery({
    queryKey: ["manga", id],
    queryFn: () => getMangaByIdAPI(id!),
    enabled: !!id,
  });

  // Função para truncar sinopse
  const truncateSynopsis = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const shouldShowReadMore = (text: string) => text.length > 300;

  if (loadingManga) {
    return (
      <div className="min-h-screen pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Mangá não encontrado</h1>
          <p className="text-muted-foreground mb-6">O mangá que você está procurando não existe ou foi removido.</p>
          <Link href="/mangas">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Mangás
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/mangas">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground truncate">{manga.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster e informações básicas */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="aspect-[3/4] relative overflow-hidden rounded-2xl mb-6">
                <img
                  src={manga.image || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop"}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
              </div>

              {/* Botões de ação */}
              <div className="space-y-3 mb-6">
                <Button className="w-full" size="lg">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Começar a Ler
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Heart className="w-5 h-5 mr-2" />
                  Adicionar aos Favoritos
                </Button>
              </div>

              {/* Informações técnicas */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-lg">
                        {manga.rating || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Avaliação</p>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    {manga.author && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Autor</p>
                          <p className="text-sm text-muted-foreground">{manga.author}</p>
                        </div>
                      </div>
                    )}



                    {manga.latestChapter && (
                      <div>
                        <p className="text-sm font-medium">Último Capítulo</p>
                        <p className="text-sm text-muted-foreground">Cap. {manga.latestChapter}</p>
                      </div>
                    )}

                    {manga.status && (
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={manga.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {manga.status === 'completed' ? 'Completo' : 
                           manga.status === 'ongoing' ? 'Em Lançamento' : 
                           manga.status || 'Desconhecido'}
                        </Badge>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gêneros */}
            {manga.genres && manga.genres.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Gêneros</h3>
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre: string) => (
                    <Badge key={genre} variant="outline" className="text-sm">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sinopse */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Sinopse</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  {manga.synopsis ? (
                    isExpanded ? 
                      manga.synopsis : 
                      truncateSynopsis(manga.synopsis)
                  ) : (
                    "Sinopse não disponível para este mangá."
                  )}
                </p>
                
                {manga.synopsis && shouldShowReadMore(manga.synopsis) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 p-0 h-auto font-normal text-primary hover:text-primary/80"
                  >
                    {isExpanded ? (
                      <>
                        Ler menos
                        <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Ler mais
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Seção de capítulos (placeholder) */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Capítulos</h3>
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Lista de Capítulos Em Breve
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    A funcionalidade de leitura de capítulos será implementada em uma versão futura.
                  </p>
                  <Button disabled>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ler Primeiro Capítulo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}