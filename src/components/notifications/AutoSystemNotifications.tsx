import { useEffect } from 'react';
import { notifications } from '@/lib/notifications/NotificationService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const scenarios = [
  () => ({
    type: 'success' as const,
    title: 'Nova venda feita por João',
    message: 'Total R$ 1.250,00 • Cartão',
    priority: 'high' as const,
  }),
  () => ({
    type: 'success' as const,
    title: 'Nova meta alcançada por Maria',
    message: 'Meta mensal concluída',
    priority: 'high' as const,
  }),
  () => ({
    type: 'info' as const,
    title: 'Visita agendada por Pedro',
    message: 'Cliente: Ana • Amanhã às 14:00',
    priority: 'medium' as const,
  }),
  () => ({
    type: 'warning' as const,
    title: 'Novo DI na Equipe!',
    message: 'Deseje as Boas-Vindas a Carlos',
    priority: 'medium' as const,
  }),
];

export const AutoSystemNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    // gerar automaticamente a cada 60s em DEV/offline
    const run = async () => {
      const pick = scenarios[Math.floor(Math.random() * scenarios.length)]();

      notifications.notify(pick.type, pick.title, pick.message, pick.priority, { durationMs: 3500 });

      // também inserir em event_notifications (mock) para histórico compatível
      try {
        if (user) {
          await (supabase as any).from('event_notifications').insert({
            id: `auto-${Date.now()}`,
            user_id: user.id,
            type: pick.type === 'success' ? 'sale' : pick.type === 'info' ? 'visit' : 'distributor',
            entity_id: 'auto',
            message: pick.title,
            created_at: new Date().toISOString(),
            read: false,
            metadata: { note: pick.message },
          });
          window.dispatchEvent(new CustomEvent('event-notifications-updated'));
        }
      } catch {}
    };

    // dispara uma imediatamente para feedback instantâneo
    run();
    const interval = setInterval(run, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return null;
};
