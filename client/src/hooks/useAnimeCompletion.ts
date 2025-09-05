import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompleteAnimeData {
  animeId: string;
  animeTitle: string;
  animeImage?: string;
  totalEpisodes: number;
}

export function useAnimeCompletion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeAnimeMutation = useMutation({
    mutationFn: async (data: CompleteAnimeData) => {
      const response = await apiRequest("POST", "/api/anime/complete", data);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "🎉 Anime Completado!",
        description: `Parabéns! Você completou "${variables.animeTitle}" e ganhou ${variables.totalEpisodes * 10} pontos!`,
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/auth/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/completed-animes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao completar anime",
        description: error.message || "Não foi possível marcar o anime como completado.",
        variant: "destructive",
      });
    },
  });

  // Função para verificar se um anime deve ser marcado como completado
  const checkAndCompleteAnime = (
    animeId: string,
    episodeNumber: number,
    totalEpisodes: number,
    animeTitle: string,
    animeImage?: string
  ) => {
    if (episodeNumber >= totalEpisodes && totalEpisodes > 0) {
      completeAnimeMutation.mutate({
        animeId: animeId.toString(),
        animeTitle,
        animeImage,
        totalEpisodes,
      });
      return true;
    }
    return false;
  };

  return {
    completeAnime: completeAnimeMutation.mutate,
    checkAndCompleteAnime,
    isCompleting: completeAnimeMutation.isPending,
  };
}