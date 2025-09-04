import type { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActiveUsersProps {
  users: User[];
}

export default function ActiveUsers({ users }: ActiveUsersProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" data-testid="text-active-users-title">
        Mais ativos
      </h3>
      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3"
              data-testid={`user-active-${user.id}`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5">
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <img
                      src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop"}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                      data-testid={`img-user-avatar-small-${user.id}`}
                    />
                  </div>
                </div>
                {user.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium" data-testid={`text-user-name-${user.id}`}>
                  {user.username}
                </h4>
                <p className="text-xs text-muted-foreground" data-testid={`text-user-activity-${user.id}`}>
                  {user.lastActivity 
                    ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true, locale: ptBR })
                    : "há alguns minutos"
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
