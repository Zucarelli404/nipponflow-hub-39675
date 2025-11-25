import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EventNotificationType = "visit" | "sale" | "goal" | "distributor" | "graduate";

export interface EventNotification {
  id: string;
  user_id: string;
  type: EventNotificationType;
  entity_id: string;
  message: string;
  created_at: string;
  read: boolean;
  metadata?: {
    lead_id?: string;
    lead_nome?: string;
    valor_total?: number;
    data?: string;
  } | null;
}

export const useEventNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const notifs = ((data || []) as any[]).filter((n: any) => {
        const allowedMessages = [
          "Nova Visita Agendada",
          "Nova Venda feita por João",
          "META ALCANÇADA por Maria",
          "Novo Distribuidor",
          "Novo Graduado",
        ];
        return allowedMessages.includes(n.message);
      });
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error("Erro ao carregar notificações de eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    const channel = supabase
      .channel("event-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const onLocalUpdate = () => fetchNotifications();
    window.addEventListener("event-notifications-updated", onLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("event-notifications-updated", onLocalUpdate);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("event_notifications" as any)
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      await fetchNotifications();
    } catch (err) {
      console.error("Erro ao marcar notificação de evento como lida:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("event_notifications" as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      await fetchNotifications();
    } catch (err) {
      console.error("Erro ao marcar todas as notificações de eventos como lidas:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};