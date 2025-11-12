import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifications } from '@/lib/notifications/NotificationService';

type EventNotificationType = 'visit' | 'sale' | 'goal' | 'distributor' | 'graduate';

interface EventNotificationRow {
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
    nome?: string;
  } | null;
}

function toTitle(row: EventNotificationRow) {
  switch (row.type) {
    case 'sale':
      return row.message || 'Nova venda registrada';
    case 'visit':
      return row.message || 'Visita agendada';
    case 'goal':
      return row.message || 'Meta alcançada';
    case 'distributor':
      return row.message || 'Novo DI na equipe';
    case 'graduate':
      return row.message || 'Boas-vindas';
  }
}

function toMessage(row: EventNotificationRow) {
  const md = row.metadata || {};
  switch (row.type) {
    case 'sale': {
      const lead = md.lead_nome ? `Cliente: ${md.lead_nome}` : undefined;
      const valor = md.valor_total != null ? `Total: R$ ${md.valor_total}` : undefined;
      const dt = md.data ? new Date(md.data).toLocaleString() : undefined;
      return [lead, valor, dt].filter(Boolean).join(' • ');
    }
    case 'visit': {
      const lead = md.lead_nome ? `Cliente: ${md.lead_nome}` : undefined;
      const dt = md.data ? `Data: ${new Date(md.data).toLocaleString()}` : undefined;
      return [lead, dt].filter(Boolean).join(' • ');
    }
    case 'goal':
      return 'Objetivo cumprido com sucesso';
    case 'distributor':
      return `Deseje boas-vindas a ${md.nome || 'novo distribuidor'}`;
    case 'graduate':
      return `Bem-vindo(a) ${md.nome || ''}`.trim();
  }
}

function toType(row: EventNotificationRow) {
  switch (row.type) {
    case 'sale':
    case 'goal':
      return 'success' as const;
    case 'visit':
    case 'graduate':
      return 'info' as const;
    case 'distributor':
      return 'warning' as const;
  }
}

function toPriority(row: EventNotificationRow) {
  switch (row.type) {
    case 'sale':
    case 'goal':
      return 'high' as const;
    case 'distributor':
      return 'medium' as const;
    default:
      return 'low' as const;
  }
}

export const NotificationBridge = () => {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchAndBridge = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('event_notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false });

        if (error) throw error;

        for (const row of (data as EventNotificationRow[]) || []) {
          if (seen.current.has(row.id)) continue;
          seen.current.add(row.id);

          notifications.notify(
            toType(row),
            toTitle(row),
            toMessage(row),
            toPriority(row),
            { durationMs: 3500, meta: { source: 'event_notifications', id: row.id } }
          );

          // marcar como lida para não repetir
          await (supabase as any)
            .from('event_notifications')
            .update({ read: true })
            .eq('id', row.id);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('NotificationBridge error', err);
      }
    };

    // fetch inicial + polling leve
    fetchAndBridge();
    const interval = setInterval(fetchAndBridge, 5000);

    const listener = () => fetchAndBridge();
    window.addEventListener('event-notifications-updated', listener);
    return () => {
      clearInterval(interval);
      window.removeEventListener('event-notifications-updated', listener);
    };
  }, [user]);

  return null;
};

