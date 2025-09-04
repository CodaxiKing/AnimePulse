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
      <div className="min-h-screen">
        {/* Anime Detail Header */}
        <div className="relative h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <img
            src={anime.image || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop"}
            alt={anime.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-2xl">
              <Link
                href="/"
                className="mb-4 text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                data-testid="link-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-anime-title">
                {anime.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                <span data-testid="text-anime-year">{anime.year}</span>
                <span>•</span>
                <span data-testid="text-anime-genres">{anime.genres?.join(" • ")}</span>
                <span>•</span>
                <span data-testid="text-anime-studio">{anime.studio}</span>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6 max-w-lg" data-testid="text-anime-synopsis">
                {anime.synopsis}
              </p>
              
              <div className="flex items-center space-x-4">
                <Button
                  className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-8 py-3 font-semibold anime-glow hover:opacity-95"
                  data-testid="button-watch-anime"
                >
                  Assistir agora
                </Button>
                
                <Button
                  variant="secondary"
                  className="border-border rounded-xl px-6 py-3 font-semibold hover:bg-muted"
                  data-testid="button-add-to-list-detail"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar à fila
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="p-3 rounded-xl border-border hover:bg-muted"
                  data-testid="button-favorite-detail"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold mb-6" data-testid="text-episodes-title">
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
