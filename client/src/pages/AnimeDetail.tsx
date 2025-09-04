import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EpisodeModal from "@/components/EpisodeModal";
import { getAnimeByIdAPI, getEpisodesByAnimeIdAPI } from "@/lib/api";
import type { Episode } from "@shared/schema";

export default function AnimeDetail() {
  const { id } = useParams();
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const { data: anime, isLoading: loadingAnime } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeByIdAPI(id!),
    enabled: !!id,
  });

  const { data: episodes, isLoading: loadingEpisodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: () => getEpisodesByAnimeIdAPI(id!),
    enabled: !!id,
  });

  if (loadingAnime) {
    return (
      <div className="min-h-screen">
        <div className="relative h-[50vh]">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Anime não encontrado</h1>
          <Link href="/" className="text-primary hover:text-primary/80">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header com botão voltar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center mb-6"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </div>

        {/* Card com detalhes do anime */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
          <div className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border">
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* Imagem do anime */}
              <div className="flex-shrink-0">
                <div className="w-48 h-64 rounded-2xl overflow-hidden">
                  <img
                    src={anime.image || "https://via.placeholder.com/400x600"}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Informações do anime */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-anime-title">
                    {anime.title}
                  </h1>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Ano:</span>
                        <span data-testid="text-anime-year">{anime.year}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Estúdio:</span>
                        <span data-testid="text-anime-studio">{anime.studio}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Avaliação:</span>
                        <span data-testid="text-anime-rating">⭐ {anime.rating}/10</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Episódios:</span>
                        <span data-testid="text-anime-episodes">{anime.totalEpisodes}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Status:</span>
                        <span className="capitalize">{anime.status}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-24">Lançamento:</span>
                        <span data-testid="text-anime-release">{anime.releaseDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="font-medium text-muted-foreground text-sm mb-2 block">Gêneros:</span>
                    <div className="flex flex-wrap gap-1">
                      {anime.genres?.map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">SINOPSE</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-anime-synopsis">
                    {anime.synopsis}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-6 py-2 font-semibold anime-glow hover:opacity-95 text-sm"
                    data-testid="button-watch-anime"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Assistir agora
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="border-border rounded-xl px-4 py-2 font-semibold hover:bg-muted text-sm"
                    data-testid="button-add-to-list-detail"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar à fila
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="p-2 rounded-xl border-border hover:bg-muted"
                    data-testid="button-favorite-detail"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Episódios */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-episodes-title">
            Episódios
          </h2>
          
          {loadingEpisodes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes?.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group relative"
                  onClick={() => setSelectedEpisode(episode)}
                  data-testid={`card-episode-${episode.number}`}
                >
                  <div className="relative">
                    <img
                      src={episode.thumbnail || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop"}
                      alt={episode.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1" data-testid={`text-episode-title-${episode.number}`}>
                      Episódio {episode.number}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-episode-subtitle-${episode.number}`}>
                      {episode.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EpisodeModal
        episode={selectedEpisode}
        isOpen={!!selectedEpisode}
        onClose={() => setSelectedEpisode(null)}
      />
    </>
  );
}
