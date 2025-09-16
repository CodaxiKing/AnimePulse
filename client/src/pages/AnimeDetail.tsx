import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Heart, Play, ChevronDown, ChevronUp, Trophy, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import MilestoneModal from "@/components/MilestoneModal";
import TrailerModal from "@/components/TrailerModal";
import { getAnimeByIdAPI } from "@/lib/api";
import { getAnimeTrailer, hasTrailer } from "@/lib/trailerService";
import type { MilestoneData } from "@/lib/milestones";

export default function AnimeDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<{ animeTitle: string; trailerUrl: string } | null>(null);

  
  // Função para truncar sinopse
  const truncateSynopsis = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const shouldShowReadMore = (text: string) => text.length > 200;

  const handleWatchTrailer = () => {
    if (!anime) return;
    
    // Primeiro verificar se há trailer da API da AniList
    if (anime.trailerUrl) {
      setSelectedTrailer({
        animeTitle: anime.title,
        trailerUrl: anime.trailerUrl
      });
      setTrailerModalOpen(true);
      console.log(`🎬 Abrindo trailer da API da AniList para: ${anime.title}`);
      return;
    }
    
    // Fallback para trailers hardcoded
    const trailer = getAnimeTrailer(anime.title);
    if (trailer) {
      setSelectedTrailer({
        animeTitle: anime.title,
        trailerUrl: trailer.trailerUrl
      });
      setTrailerModalOpen(true);
      console.log(`🎬 Abrindo trailer (fallback) para: ${anime.title}`);
    } else {
      // Mesmo sem trailer, mostrar um placeholder ou mensagem
      setSelectedTrailer({
        animeTitle: anime.title,
        trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
      });
      setTrailerModalOpen(true);
      console.log(`⚠️ Nenhum trailer encontrado para: ${anime.title}, mostrando placeholder`);
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


  // Listener para evento de conclusão de anime via player
  useEffect(() => {
    const handleAnimeCompleted = (event: CustomEvent) => {
      const { animeTitle, points } = event.detail;
      if (anime && anime.title === animeTitle) {
        setEarnedPoints(points);
        setShowCongrats(true);
        queryClient.invalidateQueries({ queryKey: ['continue'] });
      }
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
    window.addEventListener('milestonesAchieved', handleMilestonesAchieved as EventListener);
    
    return () => {
      window.removeEventListener('animeCompleted', handleAnimeCompleted as EventListener);
      window.removeEventListener('milestonesAchieved', handleMilestonesAchieved as EventListener);
    };
  }, [anime, queryClient]);


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
                        <span data-testid="text-anime-rating">⭐ {anime.rating && anime.rating !== '0' ? (parseFloat(anime.rating) / 10).toFixed(1) : 'N/A'}/10</span>
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
                  <Button
                    onClick={handleWatchTrailer}
                    className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-6 py-2 font-semibold anime-glow hover:opacity-95 text-sm"
                    data-testid="button-watch-trailer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ver Trailer
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

        {/* Seção de Relacionados */}
        {anime.relations && anime.relations.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🔗 Relacionados
              </h2>
              <p className="text-muted-foreground text-sm">
                Animes e mangás relacionados a esta série
              </p>
            </div>
            <Carousel 
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {anime.relations.slice(0, 20).map((relationStr, index) => {
                  const relation = JSON.parse(relationStr);
                  return (
                    <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                      <div className="group cursor-pointer h-full">
                        <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 h-full">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            <img
                              src={relation.image}
                              alt={relation.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/300x400?text=No+Image";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full text-xs font-medium capitalize">
                                {relation.type}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {relation.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                {relation.format}
                              </span>
                              <div className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver mais →
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-12 border-primary/20 hover:border-primary/60 hover:bg-primary/10" />
              <CarouselNext className="hidden sm:flex -right-12 border-primary/20 hover:border-primary/60 hover:bg-primary/10" />
            </Carousel>
            
            {/* Indicador de navegação móvel */}
            <div className="flex justify-center mt-6 gap-2 sm:hidden">
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs rounded-full border-primary/20 hover:border-primary/60 hover:bg-primary/10"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs rounded-full border-primary/20 hover:border-primary/60 hover:bg-primary/10"
              >
                Próximo
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Seção de Personagens - Carrossel */}
        {anime.characters && anime.characters.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                👥 Personagens Principais
              </h2>
              <p className="text-muted-foreground text-sm">
                Conheça os personagens principais e seus dubladores
              </p>
            </div>
            
            <Carousel 
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {anime.characters.slice(0, 16).map((characterStr, index) => {
                  const character = JSON.parse(characterStr);
                  return (
                    <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="group cursor-pointer h-full">
                        <div className="bg-gradient-to-br from-card via-card to-card/90 rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 h-full">
                          <div className="flex flex-col items-center text-center h-full">
                            {/* Imagem do Personagem */}
                            <div className="relative mb-4">
                              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/60 transition-all duration-300 group-hover:scale-110">
                                <img
                                  src={character.image}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/80x80?text=?";
                                  }}
                                />
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                                <span className="text-xs">⭐</span>
                              </div>
                            </div>
                            
                            {/* Nome do Personagem */}
                            <h3 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                              {character.name}
                            </h3>
                            
                            {/* Role */}
                            <div className="mb-3">
                              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium border border-primary/20">
                                {character.role}
                              </span>
                            </div>
                            
                            {/* Dublador */}
                            {character.voiceActor && (
                              <div className="mt-auto pt-3 border-t border-border/50 w-full">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-muted">
                                    <img
                                      src={character.voiceActor.image}
                                      alt={character.voiceActor.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/32x32?text=?";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground truncate">
                                      🎙️ {character.voiceActor.name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-12 border-primary/20 hover:border-primary/60 hover:bg-primary/10" />
              <CarouselNext className="hidden sm:flex -right-12 border-primary/20 hover:border-primary/60 hover:bg-primary/10" />
            </Carousel>
            
            {/* Indicador de navegação móvel */}
            <div className="flex justify-center mt-6 gap-2 sm:hidden">
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs rounded-full border-primary/20 hover:border-primary/60 hover:bg-primary/10"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs rounded-full border-primary/20 hover:border-primary/60 hover:bg-primary/10"
              >
                Próximo
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}


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
