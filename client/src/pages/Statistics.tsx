import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Play,
  CheckCircle,
  Star,
  Activity,
  Calendar
} from "lucide-react";

export default function Statistics() {
  const { user, stats, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você precisa estar logado para ver suas estatísticas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Estatísticas Detalhadas</h1>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <div className="text-3xl font-bold mb-2">{stats?.animesCompleted || 0}</div>
            <div className="text-sm text-muted-foreground">Animes Concluídos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <div className="text-3xl font-bold mb-2">{stats?.episodesWatched || 0}</div>
            <div className="text-sm text-muted-foreground">Episódios Assistidos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <div className="text-3xl font-bold mb-2">{stats?.streakDays || 0}</div>
            <div className="text-sm text-muted-foreground">Dias Consecutivos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <div className="text-3xl font-bold mb-2">{stats?.totalPoints || 0}</div>
            <div className="text-sm text-muted-foreground">Pontos Totais</div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progresso de Assistir */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Progresso de Assistir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Episódios Assistidos</span>
                <span className="font-bold">{stats?.episodesWatched || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Animes Concluídos</span>
                <span className="font-bold">{stats?.animesCompleted || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Média por Anime</span>
                <span className="font-bold">
                  {stats?.animesCompleted ? Math.round((stats?.episodesWatched || 0) / stats.animesCompleted) : 0} eps
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Atividade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sequência Atual</span>
                <span className="font-bold">{stats?.streakDays || 0} dias</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Média Semanal</span>
                <span className="font-bold">
                  {Math.round((stats?.episodesWatched || 0) / 4)} eps
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Pontos por Episódio</span>
                <span className="font-bold">
                  {stats?.episodesWatched ? Math.round((stats?.totalPoints || 0) / stats.episodesWatched) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nível e Progresso */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Progresso de Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const currentPoints = stats?.totalPoints || 0;
                const level = Math.floor(currentPoints / 100) + 1;
                const pointsInCurrentLevel = currentPoints % 100;
                const progressToNextLevel = pointsInCurrentLevel;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">Nível {level}</div>
                        <div className="text-sm text-muted-foreground">{currentPoints} pontos totais</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{pointsInCurrentLevel}/100</div>
                        <div className="text-sm text-muted-foreground">para próximo nível</div>
                      </div>
                    </div>
                    <Progress value={progressToNextLevel} className="h-3" />
                    <div className="text-center text-sm text-muted-foreground">
                      {100 - pointsInCurrentLevel} pontos restantes para Nível {level + 1}
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}