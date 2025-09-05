import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, User, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileImageUploadProps {
  currentImage?: string;
  userName: string;
  size?: "sm" | "md" | "lg";
}

export default function ProfileImageUpload({ 
  currentImage, 
  userName, 
  size = "lg" 
}: ProfileImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-20 h-20"
  };

  // Função para redimensionar imagem
  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Mutation para upload da imagem
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Primeiro, redimensionar a imagem para 200x200px
      const resizedBlob = await resizeImage(file, 200, 200, 0.8);
      
      // Obter URL de upload
      const uploadResponse = await apiRequest("POST", "/api/profile/upload-url");
      const { uploadURL } = await uploadResponse.json();
      
      // Upload da imagem redimensionada
      const uploadResult = await fetch(uploadURL, {
        method: 'PUT',
        body: resizedBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });
      
      if (!uploadResult.ok) {
        throw new Error('Falha no upload da imagem');
      }
      
      // Atualizar perfil com nova imagem
      const updateResponse = await apiRequest("PUT", "/api/profile/avatar", {
        avatarUrl: uploadURL.split('?')[0], // Remove query parameters
      });
      
      return await updateResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao atualizar foto de perfil.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemoveSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className={`${sizeClasses[size]} ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all`}>
            <AvatarImage src={currentImage} alt={userName} />
            <AvatarFallback>
              <User className="w-1/2 h-1/2" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-1/3 h-1/3 text-white" />
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Escolha uma nova foto para seu perfil. A imagem será redimensionada automaticamente para 200x200px.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview da imagem atual ou selecionada */}
          <div className="flex justify-center">
            <Avatar className="w-32 h-32 ring-2 ring-border">
              <AvatarImage src={previewUrl || currentImage} alt={userName} />
              <AvatarFallback>
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Input de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Botões de ação */}
          <div className="space-y-2">
            {!selectedFile ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
                data-testid="button-select-image"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagem
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                    data-testid="button-upload-image"
                  >
                    {uploadMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Carregando...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Salvar Foto
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRemoveSelection}
                    variant="outline"
                    size="icon"
                    data-testid="button-remove-selection"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}
          </div>
          
          {/* Informações */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formatos aceitos: JPG, PNG, GIF</p>
            <p>• Tamanho máximo: 5MB</p>
            <p>• A imagem será redimensionada automaticamente</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}