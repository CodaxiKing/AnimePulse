import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Play, Loader2, ChevronLeft, ChevronRight, Calendar, Clock, MessageCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getEpisodeVideoUrl } from "@/lib/scrapingApi";
import { markEpisodeWatchedFromPlayer, showAnimeCompletionModal } from "@/lib/api";
import type { Episode } from "@shared/schema";

// Mock data para demonstração - em uma aplicação real, estes dados viriam de uma API
const mockAnime = {
  id: "1",
  title: "Gachakuta",
  image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",
  description: "Uma história emocionante sobre aventura e descoberta em um mundo mágico...",
  totalEpisodes: 12,
  episodes: Array.from({ length: 12 }, (_, i) => ({
    id: `ep-${i + 1}`,
    animeId: "1",
    number: i + 1,
    title: `Episódio ${i + 1}`,
    duration: "24 min",
    releaseDate: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    thumbnail: `https://images.unsplash.com/photo-${1578662996442 + i}?w=400&h=225&fit=crop`,
    streamingUrl: i === 0 ? "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4" : null,
    downloadUrl: null
  }))
};

const mockComments = [
  {
    id: "1",
    user: "João_otaku",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
    content: "Excelente episódio! A animação está incrível nesta temporada.",
    timestamp: "2 horas atrás",
    likes: 15
  },
  {
    id: "2", 
    user: "AnimeGirl",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c02c?w=40&h=40&fit=crop&crop=face",
    content: "Nossa, que plot twist! Não esperava por essa reviravolta na história.",
    timestamp: "4 horas atrás",
    likes: 23
  },
  {
    id: "3",
    user: "SenpaiReviews",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    content: "A trilha sonora deste episódio foi espetacular. Os produtores realmente se superaram!",
    timestamp: "6 horas atrás", 
    likes: 8
  }
];

export default function EpisodeWatch() {
  const [, params] = useRoute("/animes/:animeId/episodes/:episodeNumber");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const animeId = params?.animeId;
  const episodeNumber = params?.episodeNumber ? parseInt(params.episodeNumber) : 1;
  
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(mockComments);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Encontrar episódio atual
  useEffect(() => {
    const episode = mockAnime.episodes.find(ep => ep.number === episodeNumber);
    setCurrentEpisode(episode || null);
  }, [episodeNumber]);

  // Carregar URL do vídeo quando episódio muda
  useEffect(() => {
    if (currentEpisode && mockAnime.title) {
      loadVideoUrl();
    }
  }, [currentEpisode]);

  const loadVideoUrl = async () => {
    if (!currentEpisode || !mockAnime.title) return;
    
    setIsLoadingVideo(true);
    setVideoError(null);
    
    try {
      console.log(`🎬 Buscando vídeo real para: ${mockAnime.title} - Episódio ${currentEpisode.number}`);
      
      // Se já tem URL do streaming, usar ela
      if (currentEpisode.streamingUrl) {
        setVideoUrl(currentEpisode.streamingUrl);
        setIsLoadingVideo(false);
        return;
      }
      
      // Buscar URL do vídeo via API de scraping
      const url = await getEpisodeVideoUrl(mockAnime.title, currentEpisode.number);
      
      if (url) {
        setVideoUrl(url);
        console.log(`✅ URL do vídeo encontrada`);
      } else {
        console.warn('⚠️ Nenhuma URL de vídeo encontrada, usando placeholder');
        setVideoUrl('https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4');
        setVideoError('Episódio real não disponível - Usando vídeo de demonstração');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar vídeo:', error);
      setVideoUrl('https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4');
      setVideoError('Erro ao buscar episódio - Usando vídeo de demonstração');
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
    
    if (!animeId || !mockAnime.title || !currentEpisode) {
      console.error('❌ Dados do anime não encontrados');
      return;
    }
    
    try {
      const result = await markEpisodeWatchedFromPlayer(
        animeId,
        currentEpisode.number,
        mockAnime.title,
        mockAnime.image,
        mockAnime.totalEpisodes
      );
      
      console.log('✅ Episódio marcado como assistido automaticamente!', result);
      
      if (result.completed) {
        console.log('🎉 Anime completado! Mostrando parabéns...');
        showAnimeCompletionModal(mockAnime.title, result.points);
      } else {
        // Auto avançar para o próximo episódio após 3 segundos
        const nextEpisode = currentEpisode.number + 1;
        if (nextEpisode <= mockAnime.totalEpisodes) {
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
    if (episodeNum >= 1 && episodeNum <= mockAnime.totalEpisodes) {
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

  if (!currentEpisode) {
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
              <h1 className="text-lg font-semibold">{mockAnime.title}</h1>
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
                disabled={currentEpisode.number >= mockAnime.totalEpisodes}
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
                        src={currentEpisode.thumbnail || mockAnime.image}
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
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      autoPlay
                      onEnded={handleVideoEnd}
                      key={videoUrl}
                    >
                      {videoUrl && (
                        <source 
                          src={videoUrl} 
                          type="video/mp4" 
                        />
                      )}
                      Seu navegador não suporta reprodução de vídeo.
                    </video>
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
                  {mockAnime.description}
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
                  {mockAnime.episodes.map((episode) => (
                    <button
                      key={episode.id}
                      onClick={() => navigateToEpisode(episode.number)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        episode.number === currentEpisode.number
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-16 h-9 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            Episódio {episode.number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {episode.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {episode.duration}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}