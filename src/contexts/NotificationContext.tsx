import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { notifications } from '@/lib/notifications/NotificationService';
import { NotificationItem } from '@/lib/notifications/types';

interface NotificationContextValue {
  items: NotificationItem[];
  unread: number;
  notify: typeof notifications.notify;
  markAllRead: () => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>(notifications.list());

  useEffect(() => {
    const offAdd = notifications.subscribe('added', () => setItems(notifications.list()));
    const offUpdate = notifications.subscribe('updated', () => setItems(notifications.list()));
    const offRemove = notifications.subscribe('removed', () => setItems(notifications.list()));
    const offReadAll = notifications.subscribe('read_all', () => setItems(notifications.list()));
    return () => { offAdd(); offUpdate(); offRemove(); offReadAll(); };
  }, []);

  const value = useMemo<NotificationContextValue>(() => ({
    items,
    unread: items.filter(i => !i.read).length,
    notify: notifications.notify.bind(notifications),
    markAllRead: notifications.markAllRead.bind(notifications),
    remove: notifications.remove.bind(notifications),
  }), [items]);

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

