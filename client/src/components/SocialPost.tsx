import { Heart, MessageCircle, Share } from "lucide-react";
import type { PostWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { togglePostReaction, removePostReaction } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

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
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
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
    <div className="bg-card rounded-2xl p-6 shadow-lg" data-testid={`post-${post.id}`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
            <img
              src={post.user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
              alt={post.user.displayName || post.user.username}
              className="w-full h-full rounded-full object-cover"
              data-testid={`img-user-avatar-${post.user.id}`}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold" data-testid={`text-username-${post.user.id}`}>
              {post.user.displayName || post.user.username}
            </h4>
            <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${post.id}`}>
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR }) : "há alguns minutos"}
            </span>
          </div>
          
          <p className="text-sm mb-4 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
          
          {/* Display media from mediaUrls array */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mb-4">
              {post.mediaUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-40 object-cover rounded-xl mb-2"
                  data-testid={`img-post-media-${post.id}-${index}`}
                />
              ))}
            </div>
          )}

          {/* Display anime reference if present */}
          {post.animeTitle && post.animeImage && (
            <div className="bg-muted rounded-lg p-3 mb-4 flex items-center space-x-3">
              <img 
                src={post.animeImage} 
                alt={post.animeTitle}
                className="w-12 h-16 object-cover rounded"
              />
              <div>
                <p className="text-sm font-medium">{post.animeTitle}</p>
                <p className="text-xs text-muted-foreground">Anime</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-1 hover:text-primary transition-colors ${
                userReaction ? 'text-red-500' : ''
              }`}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`w-4 h-4 ${userReaction ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            
            <button
              className="flex items-center space-x-1 hover:text-primary transition-colors"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{commentsCount}</span>
            </button>
            
            <button
              className="flex items-center space-x-1 hover:text-primary transition-colors"
              data-testid={`button-share-${post.id}`}
            >
              <Share className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
