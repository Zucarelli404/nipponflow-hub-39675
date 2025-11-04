import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Target, TrendingUp } from "lucide-react";

interface PointsHistoryEntry {
  id: string;
  pontos: number;
  motivo: string;
  categoria: string;
  created_at: string;
}

interface BadgeEntry {
  id: string;
  badge_id: string;
  badges: {
    nome: string;
    icone: string;
    cor: string;
  };
}

export function GamificationNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastNotificationTime, setLastNotificationTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    // Subscrever a novos pontos
    const pointsChannel = supabase
      .channel("points_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "points_history",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const entry = payload.new as PointsHistoryEntry;
          
          // Só mostrar notificação se for recente (últimos 5 segundos)
          const entryTime = new Date(entry.created_at);
          if (entryTime > lastNotificationTime) {
            showPointsNotification(entry);
            setLastNotificationTime(entryTime);
          }
        }
      )
      .subscribe();

    // Subscrever a novos badges
    const badgesChannel = supabase
      .channel("badges_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Buscar detalhes do badge
          const { data } = await supabase
            .from("user_badges" as any)
            .select(`
              *,
              badges (nome, icone, cor)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            showBadgeNotification(data as unknown as BadgeEntry);
          }
        }
      )
      .subscribe();

    // Subscrever a metas completadas
    const goalsChannel = supabase
      .channel("goals_notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "goals",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldGoal = payload.old as any;
          const newGoal = payload.new as any;
          
          // Se meta foi completada agora
          if (oldGoal.status !== "concluida" && newGoal.status === "concluida") {
            showGoalNotification(newGoal);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pointsChannel);
      supabase.removeChannel(badgesChannel);
      supabase.removeChannel(goalsChannel);
    };
  }, [user, lastNotificationTime]);

  const showPointsNotification = (entry: PointsHistoryEntry) => {
    const icon = getCategoryIcon(entry.categoria);
    
    toast({
      title: (
        <div className="flex items-center gap-2">
          {icon}
          <span>+{entry.pontos} pontos!</span>
        </div>
      ) as any,
      description: entry.motivo,
      duration: 4000,
    });
  };

  const showBadgeNotification = (badge: BadgeEntry) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: badge.badges.cor }} />
          <span>Nova conquista desbloqueada!</span>
        </div>
      ) as any,
      description: badge.badges.nome,
      duration: 5000,
    });
  };

  const showGoalNotification = (goal: any) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          <span>Meta concluída!</span>
        </div>
      ) as any,
      description: `${goal.titulo} - +${goal.pontos_recompensa} pontos`,
      duration: 5000,
    });
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case "venda":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "visita":
        return <Star className="h-5 w-5 text-blue-500" />;
      case "lead":
        return <Star className="h-5 w-5 text-purple-500" />;
      case "meta":
        return <Target className="h-5 w-5 text-orange-500" />;
      case "badge":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      default:
        return <Star className="h-5 w-5 text-primary" />;
    }
  };

  return null; // Este componente não renderiza nada visualmente
}
