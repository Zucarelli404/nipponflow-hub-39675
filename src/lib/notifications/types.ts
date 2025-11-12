export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  priority: NotificationPriority;
  createdAt: number;
  read: boolean;
  durationMs?: number; // tempo de exibição para toast
  meta?: Record<string, any>;
}

export interface NotificationOptions {
  durationMs?: number;
  meta?: Record<string, any>;
}

export interface NotificationEventMap {
  'added': NotificationItem;
  'updated': NotificationItem;
  'removed': { id: string };
  'read_all': undefined;
}

