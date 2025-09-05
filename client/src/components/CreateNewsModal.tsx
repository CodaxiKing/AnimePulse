import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedDate: string;
  category?: string;
  thumbnail?: string;
  author?: string;
}

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewsCreated?: (news: NewsItem) => void;
}

export default function CreateNewsModal({ isOpen, onClose, onNewsCreated }: CreateNewsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    author: ''
  });

  const createNewsMutation = useMutation({
    mutationFn: async (newsData: typeof formData) => {
      const response = await fetch('/api/news/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newsData.title,
          description: newsData.description,
          category: newsData.category || 'news',
          thumbnail: newsData.imageUrl,
          author: newsData.author || 'AnimePulse',
          link: '#',
          publishedDate: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create news');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notícia criada com sucesso!",
        description: "Sua notícia foi publicada e já está disponível para visualização."
      });
      
      // Invalidar cache de notícias para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['anime-news'] });
      
      // Callback para parent component
      if (onNewsCreated) {
        onNewsCreated(data);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        author: ''
      });
      
      onClose();
    },
    onError: (error) => {
      console.error('Error creating news:', error);
      toast({
        title: "Erro ao criar notícia",
        description: "Houve um problema ao publicar sua notícia. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos o título e a descrição.",
        variant: "destructive"
      });
      return;
    }
    
    createNewsMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!createNewsMutation.isPending) {
      setFormData({
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        author: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Criar Nova Notícia</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={createNewsMutation.isPending}
              data-testid="button-close-create-news-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Compartilhe as últimas novidades do mundo dos animes
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 mt-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da notícia..."
              required
              disabled={createNewsMutation.isPending}
              data-testid="input-news-title"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={createNewsMutation.isPending}
            >
              <SelectTrigger data-testid="select-news-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news">Notícias</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
                <SelectItem value="features">Especiais</SelectItem>
                <SelectItem value="releases">Lançamentos</SelectItem>
                <SelectItem value="industry">Indústria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Autor */}
          <div className="space-y-2">
            <Label htmlFor="author">Autor</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Nome do autor (opcional)"
              disabled={createNewsMutation.isPending}
              data-testid="input-news-author"
            />
          </div>

          {/* URL da Imagem */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
                disabled={createNewsMutation.isPending}
                data-testid="input-news-image-url"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={createNewsMutation.isPending}
                data-testid="button-upload-image"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full max-h-32 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Descrição/Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="description">Conteúdo *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Escreva o conteúdo da notícia..."
              rows={8}
              required
              disabled={createNewsMutation.isPending}
              data-testid="textarea-news-description"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createNewsMutation.isPending}
              data-testid="button-cancel-create-news"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createNewsMutation.isPending || !formData.title.trim() || !formData.description.trim()}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-submit-create-news"
            >
              {createNewsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publicar Notícia
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}