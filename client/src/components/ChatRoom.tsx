import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'text' | 'image' | 'system' | 'anime_sync';
  mediaUrl?: string;
  isEdited: boolean;
  createdAt: string;
  user: User;
}

interface ChatRoomData {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'watch_party';
  animeTitle?: string;
  currentEpisode?: number;
  isPlaying?: boolean;
  currentTime?: number;
  participantCount: number;
}

interface ChatRoomProps {
  room: ChatRoomData;
  onClose: () => void;
}

interface WatchPartyState {
  isPlaying: boolean;
  currentTime: number;
  currentEpisode: number;
  animeTitle?: string;
  participants: string[];
}

export function ChatRoom({ room, onClose }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [watchPartyState, setWatchPartyState] = useState<WatchPartyState | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar ao WebSocket
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 Conectado ao WebSocket');
      setIsConnected(true);
      
      // Entrar na sala
      ws.send(JSON.stringify({
        type: 'join_chat',
        payload: { userId: user.id, chatRoomId: room.id }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_message':
          setMessages(prev => [...prev, data.payload]);
          break;
          
        case 'user_joined':
          setOnlineUsers(prev => [...prev, data.payload.userId]);
          break;
          
        case 'user_left':
          setOnlineUsers(prev => prev.filter(id => id !== data.payload.userId));
          break;
          
        case 'watch_party_sync':
          if (room.type === 'watch_party') {
            const { eventType, timestamp, episodeNumber } = data.payload;
            setWatchPartyState(prev => {
              if (!prev) return prev;
              
              switch (eventType) {
                case 'play':
                  return { ...prev, isPlaying: true, currentTime: timestamp };
                case 'pause':
                  return { ...prev, isPlaying: false, currentTime: timestamp };
                case 'episode_change':
                  return { ...prev, currentEpisode: episodeNumber, currentTime: 0 };
                default:
                  return prev;
              }
            });
          }
          break;
          
        case 'typing_start':
          setTypingUsers(prev => new Set([...prev, data.payload.userId]));
          break;
          
        case 'typing_stop':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.payload.userId);
            return newSet;
          });
          break;
          
        case 'error':
          console.error('Erro do WebSocket:', data.payload.message);
          break;
      }
    };

    ws.onclose = () => {
      console.log('🔌 Desconectado do WebSocket');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user, room.id, room.type]);

  // Carregar mensagens iniciais
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/rooms/${room.id}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    };

    loadMessages();
  }, [room.id]);

  // Carregar estado da watch party
  useEffect(() => {
    if (room.type === 'watch_party') {
      const loadWatchPartyState = async () => {
        try {
          const response = await fetch(`/api/chat/watch-party/${room.id}/state`);
          if (response.ok) {
            const data = await response.json();
            setWatchPartyState(data.data);
          }
        } catch (error) {
          console.error('Erro ao carregar estado da watch party:', error);
        }
      };

      loadWatchPartyState();
    }
  }, [room.id, room.type]);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !websocketRef.current || !user) return;

    websocketRef.current.send(JSON.stringify({
      type: 'send_message',
      payload: {
        userId: user.id,
        chatRoomId: room.id,
        content: newMessage.trim(),
        type: 'text'
      }
    }));

    setNewMessage('');
    stopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startTyping = () => {
    if (!isTyping && websocketRef.current && user) {
      setIsTyping(true);
      websocketRef.current.send(JSON.stringify({
        type: 'typing_start',
        payload: { userId: user.id, chatRoomId: room.id }
      }));
    }

    // Reset timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (isTyping && websocketRef.current && user) {
      setIsTyping(false);
      websocketRef.current.send(JSON.stringify({
        type: 'typing_stop',
        payload: { userId: user.id, chatRoomId: room.id }
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const syncWatchParty = (eventType: string, timestamp?: number, episodeNumber?: number) => {
    if (!websocketRef.current || !user || room.type !== 'watch_party') return;

    websocketRef.current.send(JSON.stringify({
      type: 'watch_party_sync',
      payload: {
        userId: user.id,
        chatRoomId: room.id,
        eventType,
        timestamp,
        episodeNumber
      }
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                ← Voltar
              </Button>
              <div>
                <h3 className="font-bold text-lg">{room.name}</h3>
                {room.type === 'watch_party' && room.animeTitle && (
                  <p className="text-sm text-muted-foreground">
                    Assistindo: {room.animeTitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{room.participantCount}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Watch Party Controls */}
      {room.type === 'watch_party' && watchPartyState && (
        <Card className="border-0 shadow-lg mt-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => syncWatchParty(watchPartyState.isPlaying ? 'pause' : 'play', watchPartyState.currentTime)}
                >
                  {watchPartyState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncWatchParty('episode_change', 0, Math.max(1, watchPartyState.currentEpisode - 1))}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncWatchParty('episode_change', 0, watchPartyState.currentEpisode + 1)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm">
                Ep. {watchPartyState.currentEpisode} • {formatTime(watchPartyState.currentTime)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="border-0 shadow-lg flex-1 mt-2 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.user.avatar} />
                  <AvatarFallback>
                    {message.user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {message.user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8" />
                <div className="text-xs text-muted-foreground">
                  {Array.from(typingUsers).length} usuário(s) digitando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (e.target.value) {
                    startTyping();
                  } else {
                    stopTyping();
                  }
                }}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}