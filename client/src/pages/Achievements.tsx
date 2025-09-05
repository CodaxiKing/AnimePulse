import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Trophy,
  CheckCircle,
  Lock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Achievements() {
  const { user, stats, isLoading } = useAuth();

  // Buscar conquistas
  const { data: achievements = [] } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements = [] } = useQuery<any[]>({
    queryKey: ["/api/user/achievements"],
    enabled: !!user,
  });

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
          <p className="text-muted-foreground">Você precisa estar logado para ver suas conquistas.</p>
        </div>
      </div>
    );
  }

  // Calcular estatísticas das conquistas
  const totalAchievements = achievements.length;
  const unlockedAchievements = userAchievements.length;
  const progressPercentage = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;

  // Agrupar conquistas por categoria
  const groupedAchievements = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const categoryNames = {
    completion: "Conclusão",
    watching: "Assistir",
    streak: "Sequência"
  };

  const rarityColors = {
    common: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
    rare: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    epic: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    legendary: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  };

  const getRarityName = (rarity: string) => {
    const names = {
      common: 'Comum',
      rare: 'Rara',
      epic: 'Épica',
      legendary: 'Lendária'
    };
    return names[rarity as keyof typeof names] || rarity;
  };

  const getProgressForAchievement = (achievement: any) => {
    const current = (() => {
      switch (achievement.category) {
        case 'completion':
          return stats?.animesCompleted || 0;
        case 'watching':
          return stats?.episodesWatched || 0;
        case 'streak':
          return stats?.streakDays || 0;
        default:
          return 0;
      }
    })();
    
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Target className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Conquistas</h1>
      </div>

      {/* Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{unlockedAchievements}/{totalAchievements}</div>
                <div className="text-sm text-muted-foreground">Conquistas Desbloqueadas</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Completado</div>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Conquistas por Categoria */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]: [string, any]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {categoryNames[category as keyof typeof categoryNames] || category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement: any) => {
                const isUnlocked = userAchievements.some((ua: any) => ua.achievementId === achievement.id);
                const progress = getProgressForAchievement(achievement);
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-lg border transition-all ${
                      isUnlocked 
                        ? 'bg-primary/5 border-primary/20 shadow-md' 
                        : 'bg-muted/50 border-border hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${isUnlocked ? '' : 'text-muted-foreground'}`}>
                            {achievement.name}
                          </h4>
                          {isUnlocked ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        
                        {!isUnlocked && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2">
                          <Badge className={`text-xs ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}>
                            {getRarityName(achievement.rarity)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            +{achievement.points} pontos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}