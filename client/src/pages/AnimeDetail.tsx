import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Heart, Play, ChevronDown, ChevronUp, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EpisodeModal from "@/components/EpisodeModal";
import EpisodeGrid from "@/components/EpisodeGrid";
import MilestoneModal from "@/components/MilestoneModal";
import TrailerModal from "@/components/TrailerModal";
import { getAnimeByIdAPI, getEpisodesByAnimeIdAPI, saveWatchProgress, removeWatchedEpisode, isEpisodeWatched, areAllEpisodesWatched, calculateAnimePoints, markEpisodeWatchedFromPlayer } from "@/lib/api";
import { getAnimeTrailer, hasTrailer } from "@/lib/trailerService";
import type { Episode } from "@shared/schema";
import type { MilestoneData } from "@/lib/milestones";

export default function AnimeDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState("1");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<{ animeTitle: string; trailerUrl: string } | null>(null);

  const handleMarkEpisode = async (episode: Episode) => {
    if (anime) {
      const isWatched = isEpisodeWatched(anime.id, episode.number);
      
      if (isWatched) {
        // Desmarcar episódio se já estiver assistido
        removeWatchedEpisode(anime.id, episode.number);
        console.log(`Desmarcado episódio ${episode.number}!`);
      } else {
        // Marcar como assistido quando clicar no botão Assistir
        const result = await markEpisodeWatchedFromPlayer(
          anime.id, 
          episode.number, 
          anime.title, 
          anime.image, 
          anime.totalEpisodes || episodes?.length || 12
        );
        
        // TAMBÉM salvar como progresso para aparecer em "Continue Assistindo"
        saveWatchProgress(
          anime.id, 
          anime.title, 
          anime.image, 
          episode.number, 
          anime.totalEpisodes || episodes?.length || 12, 
          100 // 100% assistido
        );
        
        // Verificar se completou o anime e mostrar modal de parabéns
        if (result.completed) {
          setEarnedPoints(result.points);
          setShowCongrats(true);
          console.log(`🎉 Anime completado: ${anime.title}! Mostrando modal com ${result.points} pontos!`);
        }
        
        console.log(`✅ Marcado episódio ${episode.number} como assistido E adicionado ao Continue Assistindo!`);
      }
      
      // Forçar atualização da interface
      setRefreshKey(prev => prev + 1);
      
      // Invalidar queries relacionadas para atualizar seção "Continue assistindo"
      queryClient.invalidateQueries({ queryKey: ['continue'] });
    }
  };
  
  // Função para truncar sinopse
  const truncateSynopsis = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const shouldShowReadMore = (text: string) => text.length > 200;

  const handleWatchTrailer = () => {
    if (!anime) return;
    
    const trailer = getAnimeTrailer(anime.title);
    if (trailer) {
      setSelectedTrailer({
        animeTitle: anime.title,
        trailerUrl: trailer.trailerUrl
      });
      setTrailerModalOpen(true);
      console.log(`🎬 Abrindo trailer para: ${anime.title}`);
    } else {
      console.log(`❌ Nenhum trailer disponível para: ${anime.title}`);
    }
  };

  const closeTrailerModal = () => {
    setTrailerModalOpen(false);
    setSelectedTrailer(null);
  };

  const { data: anime, isLoading: loadingAnime } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeByIdAPI(id!),
    enabled: !!id,
  });

  const { data: episodes, isLoading: loadingEpisodes } = useQuery({
    queryKey: ["episodes", id, selectedSeason],
    queryFn: () => getEpisodesByAnimeIdAPI(id!, selectedSeason),
    enabled: !!id,
  });

  // Listener para evento de conclusão de anime via player
  useEffect(() => {
    const handleAnimeCompleted = (event: CustomEvent) => {
      const { animeTitle, points } = event.detail;
      if (anime && anime.title === animeTitle) {
        setEarnedPoints(points);
        setShowCongrats(true);
        // Atualizar interface para refletir episódios assistidos
        setRefreshKey(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['continue'] });
      }
    };

    const handleEpisodeWatched = () => {
      // Atualizar interface quando um episódio for marcado via player
      setRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['continue'] });
    };

    const handleMilestonesAchieved = (event: CustomEvent) => {
      const { milestones } = event.detail;
      if (milestones && milestones.length > 0) {
        setMilestones(milestones);
        setShowMilestones(true);
        console.log('🎯 Marcos alcançados na página de detalhes:', milestones);
      }
    };

    window.addEventListener('animeCompleted', handleAnimeCompleted as EventListener);
    window.addEventListener('episodeWatched', handleEpisodeWatched as EventListener);
    window.addEventListener('milestonesAchieved', handleMilestonesAchieved as EventListener);
    
    return () => {
      window.removeEventListener('animeCompleted', handleAnimeCompleted as EventListener);
      window.removeEventListener('episodeWatched', handleEpisodeWatched as EventListener);
      window.removeEventListener('milestonesAchieved', handleMilestonesAchieved as EventListener);
    };
  }, [anime, queryClient]);

  // Gerar lista de temporadas baseada no anime (máximo 3 temporadas por simplicidade)
  const getAvailableSeasons = () => {
    if (!anime) return [];
    const totalEpisodes = anime.totalEpisodes || 12;
    
    // Assumir que animes com mais episódios têm mais temporadas
    let seasonsCount = 1;
    if (totalEpisodes > 25) seasonsCount = 3;
    else if (totalEpisodes > 12) seasonsCount = 2;
    
    return Array.from({ length: seasonsCount }, (_, i) => ({
      value: String(i + 1),
      label: `Temporada ${i + 1}`
    }));
  };

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
                  <div className="text-sm text-muted-foreground leading-relaxed" data-testid="text-anime-synopsis">
                    <p>
                      {isExpanded ? (anime.synopsis || 'Sinopse não disponível') : truncateSynopsis(anime.synopsis || 'Sinopse não disponível')}
                    </p>
                    {shouldShowReadMore(anime.synopsis || '') && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center mt-2 text-primary hover:text-primary/80 transition-colors text-xs font-medium"
                        data-testid="button-read-more"
                      >
                        {isExpanded ? (
                          <>
                            Ler menos
                            <ChevronUp className="w-3 h-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Ler mais
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {hasTrailer(anime.title) ? (
                    <Button
                      onClick={handleWatchTrailer}
                      className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-6 py-2 font-semibold anime-glow hover:opacity-95 text-sm"
                      data-testid="button-watch-trailer"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ver Trailer
                    </Button>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-6 py-2 font-semibold anime-glow hover:opacity-95 text-sm"
                      data-testid="button-watch-anime"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ver Episódios
                    </Button>
                  )}
                  
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Episódios</h2>
            {getAvailableSeasons().length > 1 && (
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-[180px]" data-testid="select-season">
                  <SelectValue placeholder="Selecione a temporada" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSeasons().map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {loadingEpisodes ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : (
            <EpisodeGrid 
              key={refreshKey}
              episodes={episodes || []} 
              animeTitle={anime.title}
              animeId={id}
              totalEpisodes={anime.totalEpisodes}
              onMarkAsWatched={(episode) => handleMarkEpisode(episode)}
              onEpisodeClick={(episode) => setSelectedEpisode(episode)}
            />
          )}
        </div>
        
        <EpisodeModal
          episode={selectedEpisode}
          isOpen={!!selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
          animeTitle={anime?.title}
          animeImage={anime?.image}
          animeId={anime?.id}
          totalEpisodes={anime?.totalEpisodes || undefined}
          episodes={episodes || []}
          onEpisodeChange={setSelectedEpisode}
        />

        {/* Modal de Parabéns Animado */}
        <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
          <DialogContent className="max-w-md text-center bg-gradient-to-b from-purple-900/20 to-pink-900/20 border-purple-500/30">
            <DialogHeader>
              {/* Troféu animado com brilhos */}
              <div className="flex justify-center mb-6 relative">
                <div className="relative animate-bounce">
                  <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-lg animate-pulse" />
                  <Star className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                  <Star className="w-4 h-4 text-yellow-500 absolute -bottom-1 -left-2 animate-ping" />
                  <Star className="w-5 h-5 text-yellow-200 absolute top-0 left-0 animate-pulse" />
                </div>
                
                {/* Partículas flutuantes */}
                <div className="absolute -top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                <div className="absolute -top-2 right-6 w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
                <div className="absolute top-8 -right-4 w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
              </div>
              
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse text-center">
                🎉 PARABÉNS! 🎉
              </DialogTitle>
              
              <DialogDescription className="text-lg mt-4 space-y-4 text-center">
                <div className="text-white text-center">
                  Você concluiu <span className="font-bold text-purple-300 text-xl">{anime?.title}</span>!
                </div>
                
                {/* Pontos animados */}
                <div className="relative bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Star className="w-8 h-8 text-yellow-400 animate-spin" />
                    <div className="text-4xl font-black text-yellow-300">
                      +{earnedPoints}
                    </div>
                    <Star className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                  </div>
                  <div className="text-yellow-200 font-bold mt-2 animate-pulse text-center">
                    PONTOS GANHOS!
                  </div>
                  
                  {/* Efeito de brilho */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse rounded-xl" />
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-8">
              <Button 
                onClick={() => setShowCongrats(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 text-lg transition-all transform hover:scale-105 animate-pulse"
              >
                ✨ Continuar Explorando ✨
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Marcos */}
        <MilestoneModal
          milestones={milestones}
          isOpen={showMilestones}
          onClose={() => {
            setShowMilestones(false);
            setMilestones([]);
          }}
        />

        {/* Modal de Trailer */}
        {selectedTrailer && (
          <TrailerModal
            isOpen={trailerModalOpen}
            onClose={closeTrailerModal}
            animeTitle={selectedTrailer.animeTitle}
            trailerUrl={selectedTrailer.trailerUrl}
          />
        )}
      </div>
  );
}
