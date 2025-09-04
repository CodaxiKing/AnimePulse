import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import { User, LogIn, UserPlus, LogOut, Settings, Trophy, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar cache de autenticação
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      // Redirecionar para home
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Erro no logout",
        description: error.message || "Erro ao fazer logout.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { href: "/animes", label: "Animes" },
    { href: "/mangas", label: "Mangás" },
    { href: "/noticias", label: "Notícias" },
    { href: "/comunidade", label: "Comunidade" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <Logo />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    location === item.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <SearchBar />
            
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 hover:opacity-80 transition-opacity" 
                  data-testid="button-profile-menu"
                >
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-44 z-[9999] profile-dropdown" 
                sideOffset={8}
                avoidCollisions={false}
                collisionPadding={0}
                side="bottom"
                alignOffset={-60}
                style={{ transform: 'translateX(-60px)' }}
              >
                {isLoading ? (
                  <DropdownMenuItem disabled>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </DropdownMenuItem>
                ) : isAuthenticated && user ? (
                  <>
                    {/* Header do usuário */}
                    <div className="px-2 py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5">
                          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                            <User className="w-3 h-3 text-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Opções do usuário logado */}
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="flex items-center gap-2 w-full" data-testid="link-profile">
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/estatisticas" className="flex items-center gap-2 w-full" data-testid="link-stats">
                        <BarChart3 className="w-4 h-4" />
                        Estatísticas
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/conquistas" className="flex items-center gap-2 w-full" data-testid="link-achievements">
                        <Trophy className="w-4 h-4" />
                        Conquistas
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/configuracoes" className="flex items-center gap-2 w-full" data-testid="link-settings">
                        <Settings className="w-4 h-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      {logoutMutation.isPending ? "Saindo..." : "Sair"}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {/* Opções para usuário não logado */}
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="flex items-center gap-2 w-full" data-testid="link-login">
                        <LogIn className="w-4 h-4" />
                        Entrar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" className="flex items-center gap-2 w-full" data-testid="link-register">
                        <UserPlus className="w-4 h-4" />
                        Criar Conta
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
