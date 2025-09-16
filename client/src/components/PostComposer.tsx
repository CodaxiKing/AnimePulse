import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image, Smile, Globe, Users, Lock, Film } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PostComposerProps {
  onPostCreated?: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "group">("public");
  const [selectedAnime, setSelectedAnime] = useState<{
    id: string;
    title: string;
    image: string;
  } | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      setContent("");
      setSelectedAnime(null);
      setMediaUrls([]);
      setVisibility("public");
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      onPostCreated?.();
      toast({
        title: "Post criado!",
        description: "Seu post foi publicado com sucesso na comunidade.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar post",
        description: error.message || "Não foi possível criar o post. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo necessário",
        description: "Escreva algo antes de publicar seu post.",
        variant: "destructive",
      });
      return;
    }

    const postData = {
      content: content.trim(),
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      visibility,
      animeId: selectedAnime?.id,
      animeTitle: selectedAnime?.title,
      animeImage: selectedAnime?.image,
    };

    createPostMutation.mutate(postData);
  };

  const visibilityOptions = [
    { value: "public", label: "Público", icon: Globe, description: "Visível para todos" },
    { value: "followers", label: "Seguidores", icon: Users, description: "Apenas seus seguidores" },
    { value: "group", label: "Grupo", icon: Lock, description: "Apenas membros do grupo" },
  ];

  const getVisibilityIcon = (value: string) => {
    const option = visibilityOptions.find(opt => opt.value === value);
    return option ? option.icon : Globe;
  };

  if (!isAuthenticated) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Junte-se à comunidade</h3>
            <p className="text-muted-foreground mb-4">
              Faça login para compartilhar seus pensamentos sobre anime e mangá
            </p>
            <Button asChild>
              <a href="/login" data-testid="button-login">Fazer Login</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6" data-testid="post-composer">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Compartilhe com a comunidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Avatar and Input */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                alt={user?.displayName || user?.username}
                className="w-full h-full rounded-full object-cover"
                data-testid="img-composer-avatar"
              />
            </div>
          </div>
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você está pensando sobre anime/mangá?"
              className="min-h-[100px] border-0 bg-muted/30 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              maxLength={2000}
              data-testid="input-post-content"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/2000
            </div>
          </div>
        </div>

        {/* Selected Anime Display */}
        {selectedAnime && (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={selectedAnime.image} 
                alt={selectedAnime.title}
                className="w-12 h-16 object-cover rounded"
              />
              <div>
                <p className="text-sm font-medium">{selectedAnime.title}</p>
                <p className="text-xs text-muted-foreground">Anime selecionado</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAnime(null)}
              data-testid="button-remove-anime"
            >
              Remover
            </Button>
          </div>
        )}

        {/* Media URLs Display */}
        {mediaUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagens anexadas:</p>
            <div className="grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => setMediaUrls(urls => urls.filter((_, i) => i !== index))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              data-testid="button-add-image"
            >
              <Image className="w-4 h-4 mr-1" />
              Imagem
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              data-testid="button-add-anime"
            >
              <Film className="w-4 h-4 mr-1" />
              Anime
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              data-testid="button-add-emoji"
            >
              <Smile className="w-4 h-4 mr-1" />
              Emoji
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Visibility Selector */}
            <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
              <SelectTrigger className="w-auto border-0 bg-transparent" data-testid="select-visibility">
                <SelectValue>
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const IconComponent = getVisibilityIcon(visibility);
                      return <IconComponent className="w-4 h-4" />;
                    })()}
                    <span className="text-sm">
                      {visibilityOptions.find(opt => opt.value === visibility)?.label}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Post Button */}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || createPostMutation.isPending}
              size="sm"
              data-testid="button-post-submit"
            >
              {createPostMutation.isPending ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}