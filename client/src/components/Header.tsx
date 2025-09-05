import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import UserPointsDisplay from "./UserPointsDisplay";
import { User, LogIn, UserPlus, LogOut, Settings, Trophy, BarChart3, Menu, X, Tv, BookOpen, Newspaper, Users, Clock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
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
    { href: "/animes", label: "Animes", icon: Tv },
    { href: "/timeline", label: "Timeline", icon: Clock },
    { href: "/mangas", label: "Mangás", icon: BookOpen },
    { href: "/noticias", label: "Notícias", icon: Newspaper },
    { href: "/comunidade", label: "Comunidade", icon: Users },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" data-testid="link-home">
                <Logo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      data-testid={`link-nav-${item.label.toLowerCase()}`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* Right side - Desktop */}
            <div className="hidden lg:flex items-center justify-end flex-1 max-w-xs gap-4">
              {/* User Points Display */}
              <UserPointsDisplay />
              
              {/* Profile Dropdown */}
              <div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 hover:scale-105 transition-all duration-200"
                      data-testid="button-profile-menu"
                    >
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <User className="w-5 h-5 text-foreground" />
                      </div>
                      {isAuthenticated && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 p-2 bg-background/95 backdrop-blur-sm border border-border/50" 
                    sideOffset={8}
                    avoidCollisions={true}
                    collisionPadding={20}
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
                      <div className="px-2 py-3 border-b border-border/50 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                              <User className="w-4 h-4 text-foreground" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Online
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opções do usuário logado */}
                      <DropdownMenuItem asChild>
                        <Link href="/perfil" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-profile">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium">Meu Perfil</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/estatisticas" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-stats">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <span className="font-medium">Estatísticas</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/conquistas" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-achievements">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="font-medium">Conquistas</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/configuracoes" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-settings">
                          <Settings className="w-4 h-4 text-primary" />
                          <span className="font-medium">Configurações</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2" />
                      
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-2 py-2 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        data-testid="button-logout"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">
                          {logoutMutation.isPending ? "Saindo..." : "Sair"}
                        </span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {/* Opções para usuário não logado */}
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-login">
                          <LogIn className="w-4 h-4 text-primary" />
                          <span className="font-medium">Entrar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors" data-testid="link-register">
                          <UserPlus className="w-4 h-4 text-primary" />
                          <span className="font-medium">Criar Conta</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`w-full justify-start gap-3 px-4 py-3 h-auto transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`link-mobile-${item.label.toLowerCase()}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Profile Section */}
              <div className="pt-4 border-t border-border/50">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-accent/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <User className="w-4 h-4 text-foreground" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                        <p className="text-xs text-green-500">Online</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-3 px-4 py-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">
                        {logoutMutation.isPending ? "Saindo..." : "Sair"}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-3 px-4 py-3 h-auto"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="w-5 h-5" />
                        <span className="font-medium">Entrar</span>
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-3 px-4 py-3 h-auto"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="w-5 h-5" />
                        <span className="font-medium">Criar Conta</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}