import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import SocialPost from "@/components/SocialPost";
import PostComposer from "@/components/PostComposer";
import ActiveUsers from "@/components/ActiveUsers";
import { getSocialPosts, getActiveUsers } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Community() {
  const [feedType, setFeedType] = useState<'all' | 'following' | 'groups'>('all');

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["community-posts", feedType],
    queryFn: () => getSocialPosts({ feed: feedType }),
  });

  const { data: activeUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["community-active-users"],
    queryFn: () => getActiveUsers(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-community-title">
          Comunidade
        </h1>
        <p className="text-muted-foreground" data-testid="text-community-subtitle">
          Conecte-se com outros fãs de anime e mangá
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Post Composer */}
          <PostComposer onPostCreated={() => setFeedType('all')} />
          
          {/* Feed Tabs */}
          <Tabs value={feedType} onValueChange={(value) => setFeedType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" data-testid="tab-all">Todos</TabsTrigger>
              <TabsTrigger value="following" data-testid="tab-following">Seguindo</TabsTrigger>
              <TabsTrigger value="groups" data-testid="tab-groups">Grupos</TabsTrigger>
            </TabsList>
            
            <TabsContent value={feedType} className="mt-6">
              <div className="space-y-6">
                {loadingPosts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl p-6">
                      <div className="flex space-x-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <SocialPost key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      {feedType === 'all' && "Nenhum post encontrado. Seja o primeiro a postar!"}
                      {feedType === 'following' && "Siga outros usuários para ver seus posts aqui."}
                      {feedType === 'groups' && "Participe de grupos para ver posts específicos."}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {loadingUsers ? (
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="bg-card rounded-2xl p-6">
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
            </div>
          </div>
        ) : (
          activeUsers && <ActiveUsers users={activeUsers} />
        )}
      </div>
    </div>
  );
}
