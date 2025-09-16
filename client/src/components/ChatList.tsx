import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Users, Plus, Tv, Clock } from 'lucide-react';
import { ChatRoom } from './ChatRoom';

interface ChatRoomData {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'watch_party';
  animeTitle?: string;
  currentEpisode?: number;
  participantCount: number;
  createdAt: string;
}

interface ChatListProps {
  className?: string;
}

export function ChatList({ className }: ChatListProps) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [roomType, setRoomType] = useState<'public' | 'watch_party'>('public');

  // Form states
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [animeId, setAnimeId] = useState('');
  const [animeTitle, setAnimeTitle] = useState('');

  // Carregar salas de chat
  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/rooms?type=public');
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar salas de chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  const createChatRoom = async () => {
    if (!user || !roomName.trim()) return;

    try {
      const payload: any = {
        name: roomName.trim(),
        description: roomDescription.trim(),
        type: roomType
      };

      if (roomType === 'watch_party') {
        if (!animeTitle.trim()) return;
        payload.animeId = animeId.trim();
        payload.animeTitle = animeTitle.trim();
      }

      const endpoint = roomType === 'watch_party' ? '/api/chat/watch-party' : '/api/chat/rooms';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setRoomName('');
        setRoomDescription('');
        setAnimeId('');
        setAnimeTitle('');
        setRoomType('public');
        loadChatRooms();
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
    }
  };

  const joinChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/join`, {
        method: 'POST'
      });

      if (response.ok) {
        const room = chatRooms.find(r => r.id === roomId);
        if (room) {
          setSelectedRoom(room);
        }
      }
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (selectedRoom) {
    return (
      <ChatRoom 
        room={selectedRoom} 
        onClose={() => setSelectedRoom(null)} 
      />
    );
  }

  return (
    <div className={className}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chats Públicos
            </CardTitle>
            {user && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Criar Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Sala de Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tipo de Sala</label>
                      <Select value={roomType} onValueChange={(value) => setRoomType(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Chat Público</SelectItem>
                          <SelectItem value="watch_party">Watch Party</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nome da Sala</label>
                      <Input
                        placeholder="Nome da sala..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição (opcional)</label>
                      <Textarea
                        placeholder="Descrição da sala..."
                        value={roomDescription}
                        onChange={(e) => setRoomDescription(e.target.value)}
                      />
                    </div>
                    {roomType === 'watch_party' && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Título do Anime</label>
                          <Input
                            placeholder="Nome do anime..."
                            value={animeTitle}
                            onChange={(e) => setAnimeTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">ID do Anime (opcional)</label>
                          <Input
                            placeholder="ID do anime..."
                            value={animeId}
                            onChange={(e) => setAnimeId(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Button onClick={createChatRoom} disabled={!roomName.trim() || (roomType === 'watch_party' && !animeTitle.trim())}>
                        Criar Sala
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted/50 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma sala de chat disponível</p>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  Seja o primeiro a criar uma sala!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => user ? joinChatRoom(room.id) : null}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{room.name}</h4>
                      {room.type === 'watch_party' && (
                        <Badge variant="secondary" className="text-xs">
                          <Tv className="w-3 h-3 mr-1" />
                          Watch Party
                        </Badge>
                      )}
                    </div>
                    {room.animeTitle && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Assistindo: {room.animeTitle}
                        {room.currentEpisode && ` - Ep. ${room.currentEpisode}`}
                      </p>
                    )}
                    {room.description && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                        {room.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.participantCount} membros
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(room.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {!user && (
                      <Badge variant="outline" className="text-xs">
                        Login necessário
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}