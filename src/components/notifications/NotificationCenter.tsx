import React, { useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from '@/lib/notifications/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TypeStyles: Record<NotificationItem['type'], { tone: string; iconBg: string; border: string; renderIcon: () => JSX.Element; label: string }> = {
  success: {
    tone: 'text-emerald-500',
    iconBg: 'bg-emerald-500/15',
    border: 'border-emerald-500',
    renderIcon: () => <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    label: 'Sucesso',
  },
  error: {
    tone: 'text-red-500',
    iconBg: 'bg-red-500/15',
    border: 'border-red-500',
    renderIcon: () => <XCircle className="h-5 w-5 text-red-500" />,
    label: 'Erro',
  },
  warning: {
    tone: 'text-amber-500',
    iconBg: 'bg-amber-500/15',
    border: 'border-amber-500',
    renderIcon: () => <AlertTriangle className="h-5 w-5 text-amber-500" />,
    label: 'Alerta',
  },
  info: {
    tone: 'text-sky-500',
    iconBg: 'bg-sky-500/15',
    border: 'border-sky-500',
    renderIcon: () => <Info className="h-5 w-5 text-sky-500" />,
    label: 'Info',
  },
};

const PriorityDot: React.FC<{ level: NotificationItem['priority'] }> = ({ level }) => {
  const color = {
    low: 'bg-muted',
    medium: 'bg-primary',
    high: 'bg-amber-500',
    critical: 'bg-destructive',
  }[level];
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
};

export const NotificationCenter: React.FC<{ className?: string }> = ({ className }) => {
  const { items, unread, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    return {
      unread: items.filter(i => !i.read),
      read: items.filter(i => i.read),
    };
  }, [items]);

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10" title="Notificações" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="end">
          <div className="p-3 border-b flex items-center justify-between bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-semibold">Notificações</span>
              <Badge variant="outline" className="ml-2 text-xs">{items.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2">
                <CheckCheck className="h-4 w-4" /> Marcar tudo como lido
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[360px]">
            <div className="p-3 space-y-3">
              {grouped.unread.length === 0 && grouped.read.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
                </div>
              ) : (
                <>
                  {grouped.unread.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Não lidas</p>
                      <div className="space-y-2">
                        {grouped.unread.map(item => (
                          <NotificationRow key={item.id} item={item} onRemove={() => remove(item.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {grouped.read.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Histórico</p>
                      <div className="space-y-2">
                        {grouped.read.map(item => (
                          <NotificationRow key={item.id} item={item} onRemove={() => remove(item.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <ToastStack />
    </div>
  );
};

const NotificationRow: React.FC<{ item: NotificationItem; onRemove: () => void }> = ({ item, onRemove }) => {
  const styles = TypeStyles[item.type];
  const time = new Date(item.createdAt);
  const timeStr = formatDistanceToNow(time, { addSuffix: true, locale: ptBR });
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40 transition-colors`}
      role="listitem">
      <div className={`shrink-0 w-9 h-9 rounded-full ${styles.iconBg} flex items-center justify-center`}>{styles.renderIcon()}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{item.title}</span>
          <Badge variant="outline" className={`rounded-full text-xs ${styles.tone}`}>{styles.label}</Badge>
          <PriorityDot level={item.priority} />
          <span className="text-xs text-muted-foreground ml-auto">{timeStr}</span>
        </div>
        {item.message && <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} title="Remover">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ToastStack: React.FC = () => {
  const { items, remove } = useNotifications();
  const activeToasts = items.filter(i => i.durationMs && i.durationMs > 0);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // agendar entradas/saídas
    activeToasts.forEach(t => {
      if (!visible[t.id]) {
        setVisible(v => ({ ...v, [t.id]: true }));
        if (t.durationMs) {
          const timer = setTimeout(() => {
            setVisible(v => ({ ...v, [t.id]: false }));
            setTimeout(() => remove(t.id), 250);
          }, t.durationMs);
          return () => clearTimeout(timer);
        }
      }
    });
  }, [activeToasts.length]);

  return (
    <div className="fixed right-3 top-3 z-[60] space-y-2 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="pointer-events-auto">
            {(() => {
              const styles = TypeStyles[t.type];
              return (
                <div className={`rounded-xl border bg-card text-card-foreground shadow-lg px-3 py-2 min-w-[300px] border-l-4 ${styles.border}`} role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}>{styles.renderIcon()}</div>
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{t.title}</p>
                      {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)} aria-label="Fechar toast">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
