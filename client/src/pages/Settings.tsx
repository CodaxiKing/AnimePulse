import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Shuffle, Clock, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function SettingsPage() {
  const [newDisplayName, setNewDisplayName] = useState("");
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.displayName) {
      setNewDisplayName(user.displayName);
    }
  }, [user]);

  const generateNameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/generate-name");
      return await response.json();
    },
    onSuccess: (data) => {
      setNewDisplayName(data.displayName);
      toast({
        title: "Nome gerado!",
        description: "Um novo nome foi gerado. Clique em salvar para aplicá-lo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar nome.",
        variant: "destructive",
      });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const response = await apiRequest("PUT", "/api/auth/display-name", { displayName });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar cache de autenticação para atualizar dados
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Nome atualizado!",
        description: "Seu nome de exibição foi alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nome.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!newDisplayName || newDisplayName.trim().length < 3) {
      toast({
        title: "Nome inválido",
        description: "O nome deve ter pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    updateNameMutation.mutate(newDisplayName.trim());
  };

  const canChange = (user as any)?.canChangeName;
  const daysRemaining = (user as any)?.daysUntilNextChange || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Carregando...
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <Settings className="w-8 h-8 text-primary" />
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas configurações de conta
            </p>
          </div>

          {/* Nome de Exibição */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Nome de Exibição
              </CardTitle>
              <CardDescription>
                Este é o nome que outros usuários verão. Você pode alterá-lo uma vez a cada 7 dias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome atual</Label>
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Digite seu nome de exibição"
                    className="border-border"
                    data-testid="input-display-name"
                    disabled={!canChange}
                    maxLength={50}
                  />
                  <Button
                    onClick={() => generateNameMutation.mutate()}
                    variant="outline"
                    size="icon"
                    disabled={!canChange || generateNameMutation.isPending}
                    data-testid="button-generate-name"
                    title="Gerar nome aleatório"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
                
                {!canChange && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Você poderá alterar o nome novamente em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={
                  !canChange || 
                  updateNameMutation.isPending || 
                  newDisplayName === user?.displayName ||
                  !newDisplayName.trim()
                }
                className="w-full"
                data-testid="button-save-name"
              >
                {updateNameMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Nome
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes básicos da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nome de usuário:</span>
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nome de exibição:</span>
                <span className="text-sm font-medium">{user?.displayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm text-green-500 font-medium">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}