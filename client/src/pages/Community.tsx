import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import SocialPost from "@/components/SocialPost";
import ActiveUsers from "@/components/ActiveUsers";
import { getSocialPosts, getActiveUsers } from "@/lib/api";

export default function Community() {
  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["community-posts"],
    queryFn: getSocialPosts,
  });

  const { data: activeUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["community-active-users"],
    queryFn: getActiveUsers,
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
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-6" data-testid="text-social-feed-expanded-title">
            Feed da Comunidade
          </h2>
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
            ) : (
              posts?.map((post) => (
                <SocialPost key={post.id} post={post} />
              ))
            )}
          </div>
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
