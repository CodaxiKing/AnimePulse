import { useQuery } from "@tanstack/react-query";
import type { User, UserStats } from "@shared/schema";

interface AuthResponse {
  user: User & {
    daysUntilNextChange: number;
    canChangeName: boolean;
  };
}

interface StatsResponse {
  stats: UserStats;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/auth/stats"],
    retry: false,
    enabled: !!data?.user,
    refetchOnWindowFocus: false,
  });

  return {
    user: data?.user || null,
    stats: statsData?.stats || null,
    isLoading: isLoading || statsLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}