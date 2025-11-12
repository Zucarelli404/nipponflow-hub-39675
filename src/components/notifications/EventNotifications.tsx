import { Bell, Calendar, ShoppingCart, Check, Trophy, UserPlus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEventNotifications } from "@/hooks/useEventNotifications";

export const EventNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useEventNotifications();

  const typeStyles: Record<string, { container: string; iconClass: string; renderIcon: () => JSX.Element; label: string }> = {
    visit: {
      container: "h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0",
      iconClass: "h-5 w-5 text-muted-foreground",
      renderIcon: () => <Calendar className="h-5 w-5 text-muted-foreground" />,
      label: "Visita",
    },
    sale: {
      container: "h-10 w-10 rounded bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0",
      iconClass: "h-5 w-5 text-primary",
      renderIcon: () => <ShoppingCart className="h-5 w-5 text-primary" />,
      label: "Venda",
    },
    goal: {
      container: "h-10 w-10 rounded bg-accent flex items-center justify-center flex-shrink-0",
      iconClass: "h-5 w-5 text-foreground",
      renderIcon: () => <Trophy className="h-5 w-5 text-foreground" />,
      label: "Meta",
    },
    distributor: {
      container: "h-10 w-10 rounded bg-card border flex items-center justify-center flex-shrink-0",
      iconClass: "h-5 w-5 text-foreground",
      renderIcon: () => <UserPlus className="h-5 w-5 text-foreground" />,
      label: "Distribuidor",
    },
    graduate: {
      container: "h-10 w-10 rounded bg-muted shadow-sm flex items-center justify-center flex-shrink-0",
      iconClass: "h-5 w-5 text-foreground",
      renderIcon: () => <GraduationCap className="h-5 w-5 text-foreground" />,
      label: "Graduado",
    },
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const style = typeStyles[n.type] || typeStyles.visit;
                return (
                  <div key={n.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex gap-3">
                      <div className={style.container}>
                        {style.renderIcon()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {n.message}
                          <Badge variant="outline" className="px-2 py-0 text-[10px]">
                            {style.label}
                          </Badge>
                        </p>
                        {n.metadata?.lead_nome && (
                          <p className="text-xs text-muted-foreground">Lead: {n.metadata.lead_nome}</p>
                        )}
                        {typeof n.metadata?.valor_total === 'number' && (
                          <p className="text-xs text-muted-foreground">Valor: R$ {Number(n.metadata.valor_total).toFixed(2)}</p>
                        )}
                        {n.type === 'visit' && n.metadata?.data && (
                          <p className="text-xs text-muted-foreground">Data: {new Date(n.metadata.data).toLocaleString()}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(n.id)}
                          >
                            Marcar como lida
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};