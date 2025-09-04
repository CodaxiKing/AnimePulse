import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}