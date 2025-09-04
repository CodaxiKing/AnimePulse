import { Heart, MessageCircle, Share } from "lucide-react";
import type { PostWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SocialPostProps {
  post: PostWithUser;
}

export default function SocialPost({ post }: SocialPostProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg" data-testid={`post-${post.id}`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
            <img
              src={post.user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
              alt={post.user.username}
              className="w-full h-full rounded-full object-cover"
              data-testid={`img-user-avatar-${post.user.id}`}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold" data-testid={`text-username-${post.user.id}`}>
              {post.user.username}
            </h4>
            <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${post.id}`}>
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR }) : "há alguns minutos"}
            </span>
          </div>
          
          <p className="text-sm mb-4" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
          
          {post.image && (
            <img
              src={post.image}
              alt="Post image"
              className="w-full h-40 object-cover rounded-xl mb-4"
              data-testid={`img-post-${post.id}`}
            />
          )}
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <button
              className="flex items-center space-x-1 hover:text-primary transition-colors"
              data-testid={`button-like-${post.id}`}
            >
              <Heart className="w-4 h-4" />
              <span>{post.likes}</span>
            </button>
            
            <button
              className="flex items-center space-x-1 hover:text-primary transition-colors"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments}</span>
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
