import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { 
  User, 
  Trophy, 
  Clock, 
  TrendingUp, 
  Calendar,
  Star,
  Play,
  CheckCircle,
  Award,
  Activity,
  Settings,
  Edit3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface CompletedAnime {
  id: string;
  animeTitle: string;
  animeImage: string;
  totalEpisodes: number;
  pointsEarned: number;
  completedAt: string;
}

interface WatchProgress {
  animeId: number;
  episodesWatched: number;
  totalEpisodes: number;
  status: string;
  progressPercent?: number;
  updatedAt: string;
}

export default function Profile() {
  const { user, stats, isLoading } = useAuth();
  const [progressPage, setProgressPage] = useState(0);
  const progressPerPage = 2; // Reduzido para 2 para mostrar as setinhas mais facilmente

  // Buscar animes completados
  const { data: completedAnimes = [] } = useQuery<CompletedAnime[]>({
    queryKey: ["/api/user/completed-animes"],
    enabled: !!user,
  });

  // Buscar progresso atual de assistir
  const { data: allProgress = [] } = useQuery<WatchProgress[]>({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  // Filtrar apenas animes em progresso (não completados)
  const watchProgress = allProgress.filter(progress => 
    progress.status === 'watching' && progress.episodesWatched < progress.totalEpisodes
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center p-6">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Acesso Necessário</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para ver seu perfil.
            </p>
            <Link href="/login">
              <Button>Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular nível baseado nos pontos
  const level = stats?.level || 1;
  const currentPoints = stats?.totalPoints || 0;
  const pointsForNextLevel = level * 100; // 100 pontos por nível
  const progressToNextLevel = ((currentPoints % 100) / 100) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header do Perfil */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar e Info Básica */}
              <div className="flex items-center gap-4">
                <ProfileImageUpload 
                  currentImage={user.avatar || undefined}
                  userName={user.displayName}
                  size="lg"
                />
                <div>
                  <h1 className="text-2xl font-bold mb-1">{user.displayName}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                    <span>•</span>
                    <span>Membro desde {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('pt-BR') : 'Recente'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Clique na foto para alterar</p>
                </div>
              </div>

              {/* Nível e Pontos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">Nível {level}</span>
                  <Badge variant="secondary">{currentPoints} pontos</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progresso para Nível {level + 1}</span>
                    <span>{Math.round(progressToNextLevel)}%</span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-2" />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Link href="/configuracoes">
                  <Button variant="outline" size="sm" data-testid="button-settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estatísticas Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card data-testid="card-animes-completed">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{stats?.animesCompleted || 0}</div>
                <div className="text-sm text-muted-foreground">Animes Concluídos</div>
              </CardContent>
            </Card>

            <Card data-testid="card-episodes-watched">
              <CardContent className="p-4 text-center">
                <Play className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats?.episodesWatched || 0}</div>
                <div className="text-sm text-muted-foreground">Episódios Assistidos</div>
              </CardContent>
            </Card>

            <Card data-testid="card-streak-days">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{stats?.streakDays || 0}</div>
                <div className="text-sm text-muted-foreground">Dias Consecutivos</div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-points">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{stats?.totalPoints || 0}</div>
                <div className="text-sm text-muted-foreground">Pontos Totais</div>
              </CardContent>
            </Card>
          </div>

          {/* Animes em Progresso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Continue Assistindo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchProgress && watchProgress.length > 0 ? (
                <div className="relative">
                  {/* Controles de navegação */}
                  {watchProgress.length > progressPerPage && (
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProgressPage(Math.max(0, progressPage - 1))}
                        disabled={progressPage === 0}
                        className="flex items-center gap-1"
                        data-testid="button-progress-prev"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        {progressPage * progressPerPage + 1}-{Math.min((progressPage + 1) * progressPerPage, watchProgress.length)} de {watchProgress.length}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProgressPage(Math.min(Math.ceil(watchProgress.length / progressPerPage) - 1, progressPage + 1))}
                        disabled={progressPage >= Math.ceil(watchProgress.length / progressPerPage) - 1}
                        className="flex items-center gap-1"
                        data-testid="button-progress-next"
                      >
                        Próximo
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Lista de animes em progresso */}
                  <div className="space-y-4">
                    {watchProgress
                      .slice(progressPage * progressPerPage, (progressPage + 1) * progressPerPage)
                      .map((progress, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="w-12 h-16 bg-muted rounded-md flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Anime #{progress.animeId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Episódio {progress.episodesWatched} de {progress.totalEpisodes} • {Math.round((progress.episodesWatched / progress.totalEpisodes) * 100)}% assistido
                          </p>
                          <Progress value={(progress.episodesWatched / progress.totalEpisodes) * 100} className="h-1 mt-2" />
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-continue-${progress.animeId}`}>
                          Continuar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum anime em progresso</p>
                  <Link href="/animes">
                    <Button variant="outline" className="mt-4">
                      Descobrir Animes
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Animes Completados Recentemente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Completados Recentemente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedAnimes && completedAnimes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {completedAnimes.slice(0, 8).map((anime) => (
                    <div key={anime.id} className="group cursor-pointer">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 overflow-hidden">
                        {anime.animeImage ? (
                          <img 
                            src={anime.animeImage} 
                            alt={anime.animeTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{anime.animeTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {anime.totalEpisodes} eps • {anime.pointsEarned} pts
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum anime completado ainda</p>
                  <Link href="/animes">
                    <Button variant="outline" className="mt-4">
                      Começar a Assistir
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Informações Adicionais */}
        <div className="space-y-6">
          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.lastWatchDate ? (
                <div className="text-sm">
                  <div className="font-medium">Última atividade</div>
                  <div className="text-muted-foreground">
                    {new Date(stats.lastWatchDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conquistas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Conquista de Primeiro Anime */}
              <div className={`flex items-center gap-3 p-2 rounded-lg ${
                (stats?.animesCompleted || 0) > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  (stats?.animesCompleted || 0) > 0 ? 'bg-green-500/20' : 'bg-muted'
                }`}>
                  <Trophy className={`w-5 h-5 ${
                    (stats?.animesCompleted || 0) > 0 ? 'text-green-500' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Primeiro Anime</div>
                  <div className="text-xs text-muted-foreground">Complete seu primeiro anime</div>
                </div>
                {(stats?.animesCompleted || 0) > 0 && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* Conquista de Maratonista */}
              <div className={`flex items-center gap-3 p-2 rounded-lg ${
                (stats?.episodesWatched || 0) >= 100 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  (stats?.episodesWatched || 0) >= 100 ? 'bg-blue-500/20' : 'bg-muted'
                }`}>
                  <Play className={`w-5 h-5 ${
                    (stats?.episodesWatched || 0) >= 100 ? 'text-blue-500' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Maratonista</div>
                  <div className="text-xs text-muted-foreground">Assista 100 episódios</div>
                </div>
                {(stats?.episodesWatched || 0) >= 100 && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>

              {/* Conquista de Dedicado */}
              <div className={`flex items-center gap-3 p-2 rounded-lg ${
                (stats?.streakDays || 0) >= 7 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-muted/50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  (stats?.streakDays || 0) >= 7 ? 'bg-orange-500/20' : 'bg-muted'
                }`}>
                  <Activity className={`w-5 h-5 ${
                    (stats?.streakDays || 0) >= 7 ? 'text-orange-500' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Dedicado</div>
                  <div className="text-xs text-muted-foreground">7 dias consecutivos</div>
                </div>
                {(stats?.streakDays || 0) >= 7 && (
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">Nome de usuário</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Membro desde</div>
                <div className="text-sm text-muted-foreground">
                  {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Data não disponível'}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500">Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}