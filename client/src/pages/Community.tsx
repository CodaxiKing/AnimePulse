import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SocialPost from "@/components/SocialPost";
import PostComposer from "@/components/PostComposer";
import ActiveUsers from "@/components/ActiveUsers";
import { ChatList } from '@/components/ChatList';
import { getSocialPosts, getActiveUsers } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Search, Plus, TrendingUp, MessageCircle, BookOpen, Star, Users, Globe, Hash } from "lucide-react";

export default function Community() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [feedType, setFeedType] = useState<'all' | 'following' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostComposer, setShowPostComposer] = useState(false);

  const { data: posts, isLoading: loadingPosts, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ["community-posts", feedType],
    queryFn: () => getSocialPosts({ feed: feedType }),
  });

  const { data: activeUsers, isLoading: loadingUsers, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ["community-active-users"],
    queryFn: () => getActiveUsers(),
  });

  // Mock trending topics and popular content for inspiration
  const trendingTopics = [
    { name: "Demon Slayer", posts: 156, trend: "+12%" },
    { name: "One Piece", posts: 134, trend: "+8%" },
    { name: "Attack on Titan", posts: 98, trend: "+15%" },
    { name: "Jujutsu Kaisen", posts: 87, trend: "+23%" },
    { name: "Chainsaw Man", posts: 76, trend: "+5%" }
  ];

  const popularWikiEntries = [
    { title: "Guia Completo: Temporadas de Anime 2025", views: "2.3k", category: "Guias" },
    { title: "Top 10 Mangás Romance Shoujo", views: "1.8k", category: "Listas" },
    { title: "História do Studio Ghibli", views: "1.5k", category: "História" },
    { title: "Como começar a ler mangá", views: "1.2k", category: "Iniciantes" }
  ];


  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-community-title">
              AnimePulse Community
            </h1>
            <p className="text-muted-foreground" data-testid="text-community-subtitle">
              Conecte-se com outros fãs de anime e mangá
            </p>
          </div>
          
          {/* Enhanced Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-nav-destaques">
              <TrendingUp className="w-4 h-4 mr-2" />
              Destaques
            </Button>
            <Button variant="outline" size="sm" data-testid="button-nav-recentes">
              <Star className="w-4 h-4 mr-2" />
              Recentes
            </Button>
            <Button variant="outline" size="sm" data-testid="button-nav-wiki">
              <BookOpen className="w-4 h-4 mr-2" />
              Wiki
            </Button>
          </div>
        </div>
        
        {/* Search Bars */}
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Anime em iOS"
              className="pl-10 bg-muted/50 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-anime"
            />
          </div>
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Sistema de Revidão | Tutorial"
              className="pl-10 bg-muted/50 border-0"
              data-testid="input-search-tutorial"
            />
          </div>
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Eventos Guerra Santa | Resultado"
              className="pl-10 bg-muted/50 border-0"
              data-testid="input-search-events"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - User Profile */}
        <div className="lg:col-span-3">
          {isAuthenticated && user ? (
            <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-1 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                        alt={user.displayName || user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{user.displayName || user.username}</h3>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                  <Button 
                    onClick={() => setShowPostComposer(true)}
                    className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] hover:from-[#7B2BD9] hover:to-[#E844C7] border-0"
                    data-testid="button-create-post-sidebar"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-card to-muted/20 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Faça Login</h3>
                <p className="text-sm text-muted-foreground mb-4">Entre para participar da comunidade</p>
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/login')}
                  data-testid="button-login-sidebar"
                >
                  Entrar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Post Composer - Show only for authenticated users when requested */}
          {isAuthenticated && showPostComposer && (
            <PostComposer 
              onPostCreated={() => {
                setFeedType('all');
                setShowPostComposer(false);
              }} 
            />
          )}
          
          {/* Enhanced Feed Tabs */}
          <Tabs value={feedType} onValueChange={(value) => setFeedType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30">
              <TabsTrigger value="all" data-testid="tab-all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8A2BE2] data-[state=active]:to-[#FF4DD8]">
                Todos
              </TabsTrigger>
              <TabsTrigger value="following" data-testid="tab-following" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8A2BE2] data-[state=active]:to-[#FF4DD8]">
                Seguindo
              </TabsTrigger>
              <TabsTrigger value="groups" data-testid="tab-groups" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8A2BE2] data-[state=active]:to-[#FF4DD8]">
                Grupos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={feedType} className="mt-6">
              <div className="space-y-6">
                {postsError ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                      <h3 className="font-semibold mb-2">
                        {postsError.message?.includes('401') || postsError.message?.includes('Authentication') 
                          ? 'Faça login para ver posts da comunidade' 
                          : 'Erro ao carregar posts'
                        }
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {postsError.message?.includes('401') || postsError.message?.includes('Authentication')
                          ? 'Você precisa estar logado para ver os posts da comunidade.'
                          : 'Não foi possível carregar os posts da comunidade.'
                        }
                      </p>
                      <div className="flex gap-2 justify-center">
                        {postsError.message?.includes('401') || postsError.message?.includes('Authentication') ? (
                          <Button 
                            onClick={() => setLocation('/login')}
                            data-testid="button-login-from-posts"
                          >
                            Fazer Login
                          </Button>
                        ) : (
                          <Button onClick={() => refetchPosts()} variant="outline" data-testid="button-retry-posts">
                            Tentar novamente
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : loadingPosts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <SocialPost key={post.id} post={post} />
                  ))
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-muted-foreground mb-4">
                        {feedType === 'all' && "Nenhum post encontrado. Seja o primeiro a postar!"}
                        {feedType === 'following' && "Siga outros usuários para ver seus posts aqui."}
                        {feedType === 'groups' && "Participe de grupos para ver posts específicos."}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          {/* Public Chats */}
          <ChatList />

          {/* Trending Topics */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tópicos em Alta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {trendingTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{topic.name}</h4>
                      <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                      {topic.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Wiki Entries */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Wiki Popular
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {popularWikiEntries.map((entry, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <h4 className="font-medium text-sm mb-1">{entry.title}</h4>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                      <span className="text-xs text-muted-foreground">{entry.views} views</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          {usersError ? (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <p className="text-muted-foreground mb-4">Erro ao carregar usuários ativos</p>
                <Button onClick={() => refetchUsers()} variant="outline" size="sm" data-testid="button-retry-users">
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : loadingUsers ? (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            activeUsers && <ActiveUsers users={activeUsers} />
          )}
        </div>
      </div>
    </div>
  );
}
