import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Loader2, ChevronLeft, ChevronRight, Calendar, Clock, MessageCircle, LogIn, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getEpisodeVideoUrl } from "@/lib/scrapingApi";
import { markEpisodeWatchedFromPlayer, showAnimeCompletionModal, getAnimeByIdAPI, getEpisodesByAnimeIdAPI, isEpisodeWatched, unmarkEpisodeAsWatched } from "@/lib/api";
import type { Episode } from "@shared/schema";


// Interface para comentários
interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

export default function EpisodeWatch() {
  const [, params] = useRoute("/animes/:animeId/episodes/:episodeNumber");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const animeId = params?.animeId;
  const episodeNumber = params?.episodeNumber ? parseInt(params.episodeNumber) : 1;
  
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buscar dados do anime
  const { data: anime, isLoading: loadingAnime } = useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => getAnimeByIdAPI(animeId!),
    enabled: !!animeId,
  });

  // Buscar episódios do anime
  const { data: episodes, isLoading: loadingEpisodes } = useQuery({
    queryKey: ["episodes", animeId, "1"],
    queryFn: () => getEpisodesByAnimeIdAPI(animeId!, "1"),
    enabled: !!animeId,
  });

  // Encontrar episódio atual
  useEffect(() => {
    if (episodes && episodes.length > 0) {
      const episode = episodes.find(ep => ep.number === episodeNumber);
      setCurrentEpisode(episode || null);
    }
  }, [episodeNumber, episodes]);

  // Carregar episódios assistidos para este anime
  useEffect(() => {
    if (animeId) {
      const watched = new Set<number>();
      
      // Verificar quais episódios foram assistidos
      if (episodes) {
        episodes.forEach(episode => {
          if (isEpisodeWatched(animeId, episode.number)) {
            watched.add(episode.number);
          }
        });
      }
      
      setWatchedEpisodes(watched);
    }
  }, [animeId, episodes]);

  // Carregar URL do vídeo quando episódio muda
  useEffect(() => {
    if (currentEpisode && anime) {
      loadVideoUrl();
    }
  }, [currentEpisode, anime]);

  const loadVideoUrl = async () => {
    if (!currentEpisode || !anime) return;
    
    setIsLoadingVideo(true);
    setVideoError(null);
    
    try {
      console.log(`🎬 Buscando vídeo real para: ${anime.title} - Episódio ${currentEpisode.number}`);
      
      // Se já tem URL do streaming, usar ela
      if (currentEpisode.streamingUrl) {
        setVideoUrl(currentEpisode.streamingUrl);
        setIsLoadingVideo(false);
        return;
      }
      
      // Buscar URL do vídeo via API de scraping
      const url = await getEpisodeVideoUrl(anime.title, currentEpisode.number);
      
      if (url) {
        setVideoUrl(url);
        console.log(`✅ URL do vídeo encontrada`);
      } else {
        console.warn('⚠️ Nenhuma URL de vídeo encontrada');
        setVideoUrl(null);
        setVideoError('Episódio não disponível no momento');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar vídeo:', error);
      setVideoUrl(null);
      setVideoError('Erro ao carregar o episódio');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handlePlayClick = async () => {
    if (!videoUrl && !isLoadingVideo) {
      await loadVideoUrl();
    }
    
    setIsPlaying(true);
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
          console.log('▶️ Vídeo iniciado automaticamente!');
        } catch (error) {
          console.log('ℹ️ Autoplay bloqueado pelo navegador, usuário precisa clicar em play');
        }
      }
    }, 100);
  };

  const handleVideoEnd = async () => {
    console.log(`🎬 Video terminou! Marcando episódio ${currentEpisode?.number} como assistido...`);
    
    if (!animeId || !anime || !currentEpisode) {
      console.error('❌ Dados do anime não encontrados');
      return;
    }
    
    try {
      const result = await markEpisodeWatchedFromPlayer(
        animeId,
        currentEpisode.number,
        anime.title,
        anime.image,
        anime.totalEpisodes || episodes?.length || 12
      );
      
      console.log('✅ Episódio marcado como assistido automaticamente!', result);
      
      // Atualizar estado local dos episódios assistidos
      setWatchedEpisodes(prev => new Set(prev).add(currentEpisode.number));
      
      if (result.completed) {
        console.log('🎉 Anime completado! Mostrando parabéns...');
        showAnimeCompletionModal(anime.title, result.points);
      } else {
        // Auto avançar para o próximo episódio após 3 segundos
        const nextEpisode = currentEpisode.number + 1;
        const totalEpisodes = anime.totalEpisodes || episodes?.length || 12;
        if (nextEpisode <= totalEpisodes) {
          setTimeout(() => {
            setLocation(`/animes/${animeId}/episodes/${nextEpisode}`);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao marcar episódio automaticamente:', error);
    }
  };

  const navigateToEpisode = (episodeNum: number) => {
    const totalEpisodes = anime?.totalEpisodes || episodes?.length || 12;
    if (episodeNum >= 1 && episodeNum <= totalEpisodes) {
      setLocation(`/animes/${animeId}/episodes/${episodeNum}`);
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;
    
    const comment = {
      id: `comment-${Date.now()}`,
      user: user.username || "Usuário",
      avatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
      content: newComment.trim(),
      timestamp: "agora",
      likes: 0
    };
    
    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleUnmarkEpisode = (episodeNumber: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevenir navegação para o episódio
    
    if (!animeId || !anime) return;
    
    console.log(`🗑️ Desmarcando episódio ${episodeNumber} como assistido`);
    
    unmarkEpisodeAsWatched(
      animeId,
      episodeNumber,
      anime.title,
      anime.image,
      anime.totalEpisodes || episodes?.length || 12
    );
    
    // Atualizar estado local
    setWatchedEpisodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(episodeNumber);
      return newSet;
    });
    
    // Invalidar queries relacionadas para atualizar a UI
    queryClient.invalidateQueries({ queryKey: ['continue'] });
    queryClient.invalidateQueries({ queryKey: ['home-animes'] });
    
    console.log(`✅ Episódio ${episodeNumber} desmarcado com sucesso`);
  };

  // Loading states
  if (loadingAnime || loadingEpisodes) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEpisode || !anime) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Episódio não encontrado</h1>
          <Button onClick={() => setLocation(`/animes/${animeId}`)}>
            Voltar para o anime
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com navegação */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/animes/${animeId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{anime.title}</h1>
              <p className="text-sm text-muted-foreground">
                Episódio {currentEpisode.number} - {currentEpisode.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToEpisode(currentEpisode.number - 1)}
                disabled={currentEpisode.number <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToEpisode(currentEpisode.number + 1)}
                disabled={currentEpisode.number >= (anime.totalEpisodes || episodes?.length || 12)}
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal - Player e informações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {!isPlaying ? (
                    <>
                      <img
                        src={currentEpisode.thumbnail || anime.image}
                        alt={currentEpisode.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                          <button 
                            onClick={handlePlayClick}
                            disabled={isLoadingVideo}
                            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] rounded-full flex items-center justify-center anime-glow hover:opacity-90 transition-opacity disabled:opacity-50" 
                          >
                            {isLoadingVideo ? (
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                              <Play className="w-8 h-8 text-white ml-1" />
                            )}
                          </button>
                          <p className="text-white text-sm">
                            {isLoadingVideo ? 'Carregando vídeo...' : 'Clique para assistir o episódio'}
                          </p>
                          <p className="text-white/80 text-xs mt-1">Duração: {currentEpisode.duration}</p>
                          {videoError && (
                            <p className="text-yellow-400 text-xs mt-2">⚠️ {videoError}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : videoUrl ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      autoPlay
                      onEnded={handleVideoEnd}
                      key={videoUrl}
                    >
                      <source 
                        src={videoUrl} 
                        type="video/mp4" 
                      />
                      Seu navegador não suporta reprodução de vídeo.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Episódio não disponível</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {videoError || 'Não foi possível carregar o episódio no momento.'}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => loadVideoUrl()}
                          disabled={isLoadingVideo}
                        >
                          {isLoadingVideo ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Tentando novamente...</>
                          ) : (
                            <>Tentar novamente</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações do episódio */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(currentEpisode.releaseDate || '').toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentEpisode.duration}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  {anime.synopsis || "Descrição não disponível."}
                </p>
              </CardContent>
            </Card>

            {/* Seção de comentários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Deixe seu comentário sobre este episódio..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      Enviar comentário
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <LogIn className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Faça login para comentar
                    </p>
                    <Button 
                      onClick={() => setLocation('/login')}
                      variant="outline"
                    >
                      Fazer Login
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <img
                        src={comment.avatar}
                        alt={comment.user}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <button className="hover:text-foreground">
                            ❤️ {comment.likes}
                          </button>
                          <button className="hover:text-foreground">
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Lista de episódios */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Episódios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {episodes?.map((episode) => {
                    const isWatched = watchedEpisodes.has(episode.number);
                    const isCurrent = episode.number === currentEpisode.number;
                    
                    return (
                      <button
                        key={episode.id}
                        onClick={() => navigateToEpisode(episode.number)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors relative ${
                          isCurrent
                            ? 'border-primary bg-primary/10'
                            : isWatched
                            ? 'border-green-500/50 bg-green-500/5 hover:bg-green-500/10'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        data-testid={`episode-${episode.number}`}
                      >
                        <div className="flex gap-3">
                          <div className="relative">
                            <img
                              src={episode.thumbnail || "https://via.placeholder.com/400x225"}
                              alt={episode.title}
                              className={`w-16 h-9 object-cover rounded ${isWatched ? 'opacity-80' : ''}`}
                            />
                            {isWatched && (
                              <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-400" data-testid={`check-episode-${episode.number}`} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm truncate ${isWatched ? 'text-green-400' : ''}`}>
                                Episódio {episode.number}
                              </p>
                              {isWatched && (
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                                  <button
                                    onClick={(e) => handleUnmarkEpisode(episode.number, e)}
                                    className="w-4 h-4 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                                    title="Desmarcar como assistido"
                                    data-testid={`unmark-episode-${episode.number}`}
                                  >
                                    <X className="w-2.5 h-2.5 text-red-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {episode.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {episode.duration}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}