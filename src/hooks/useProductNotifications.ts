import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductNotification {
  id: string;
  product_id: string;
  notified: boolean;
  notified_at: string | null;
  product: {
    id: string;
    nome: string;
    imagem_url: string | null;
    disponibilidade: string;
  };
}

export const useProductNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_notifications')
        .select(`
          id,
          product_id,
          notified,
          notified_at,
          product:products(id, nome, imagem_url, disponibilidade)
        `)
        .eq('user_id', user.id)
        .eq('notified', false)
        .order('notified_at', { ascending: false });

      if (error) throw error;
      
      const notifs = (data as ProductNotification[]) || [];
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    if (!user) return;

    const channel = supabase
      .channel('product-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('product_notifications')
        .update({ notified: true })
        .eq('id', notificationId);

      if (error) throw error;

      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('product_notifications')
        .update({ notified: true })
        .eq('user_id', user.id)
        .eq('notified', false);

      if (error) throw error;

      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
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
