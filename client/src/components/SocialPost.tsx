import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import type { PostWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { togglePostReaction, removePostReaction } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SocialPostProps {
  post: PostWithUser;
}

export default function SocialPost({ post }: SocialPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  // Calculate counts from actual data
  const likesCount = post.reactions?.filter(r => r.type === 'like').length || 0;
  const commentsCount = post.comments?.length || 0;
  
  // Check if current user liked the post
  const userReaction = post.reactions?.find(r => r.userId === user?.id);

  const likeMutation = useMutation({
    mutationFn: () => userReaction 
      ? removePostReaction(post.id) 
      : togglePostReaction(post.id, 'like'),
    onSuccess: () => {
      setIsLiked(!userReaction);
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "community-posts" 
      });
      toast({
        title: userReaction ? "Curtida removida" : "Post curtido!",
        description: userReaction 
          ? "Você removeu a curtida do post" 
          : "Você curtiu este post",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao reagir ao post",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid={`post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
              <img
                src={post.user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                alt={post.user.displayName || post.user.username}
                className="w-full h-full rounded-full object-cover"
                data-testid={`img-user-avatar-${post.user.id}`}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold" data-testid={`text-username-${post.user.id}`}>
                  {post.user.displayName || post.user.username}
                </h4>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${post.id}`}>
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR }) : "há alguns minutos"}
                </span>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <p className="mb-4 leading-relaxed text-sm whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
              {post.content}
            </p>

            {/* Anime Reference - Enhanced Design */}
            {post.animeTitle && post.animeImage && (
              <div className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-muted/40 to-muted/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3 p-4">
                  <div className="relative">
                    <img
                      src={post.animeImage}
                      alt={post.animeTitle}
                      className="w-12 h-12 rounded-lg object-cover shadow-md"
                      data-testid={`img-anime-${post.id}`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm mb-1" data-testid={`text-anime-title-${post.id}`}>
                      {post.animeTitle}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        Anime
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Attachments - Enhanced Grid */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className={`gap-2 mb-4 ${
                post.mediaUrls.length === 1 
                  ? 'grid grid-cols-1' 
                  : post.mediaUrls.length === 2 
                  ? 'grid grid-cols-2' 
                  : 'grid grid-cols-2'
              }`}>
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl">
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className={`w-full object-cover transition-transform group-hover:scale-105 ${
                        post.mediaUrls!.length === 1 ? 'h-64' : 'h-32'
                      }`}
                      data-testid={`img-post-media-${post.id}-${index}`}
                    />
                    {post.mediaUrls!.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.mediaUrls!.length - 4}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-muted/20">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all hover:bg-muted/30 ${
                    userReaction 
                      ? 'text-pink-500 hover:text-pink-600 bg-pink-500/10' 
                      : 'hover:text-primary'
                  }`}
                  data-testid={`button-like-${post.id}`}
                >
                  <Heart className={`w-4 h-4 ${userReaction ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likesCount}</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted/30 hover:text-primary transition-all"
                  data-testid={`button-comment-${post.id}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{commentsCount}</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted/30 hover:text-primary transition-all"
                  data-testid={`button-share-${post.id}`}
                >
                  <Share className="w-4 h-4" />
                  <span className="text-sm font-medium">Compartilhar</span>
                </button>
              </div>
              
              {/* Engagement Summary */}
              <div className="text-xs text-muted-foreground">
                {(likesCount + commentsCount) > 0 && (
                  <span>{likesCount + commentsCount} interações</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
