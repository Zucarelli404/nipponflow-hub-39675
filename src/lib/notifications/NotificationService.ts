import { NotificationItem, NotificationOptions, NotificationPriority, NotificationType, NotificationEventMap } from './types';

type Listener<T> = (payload: T) => void;

class Emitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on<K extends keyof NotificationEventMap>(event: K, listener: Listener<NotificationEventMap[K]>) {
    const set = this.listeners.get(event as string) || new Set();
    set.add(listener);
    this.listeners.set(event as string, set);
    return () => this.off(event, listener);
  }

  off<K extends keyof NotificationEventMap>(event: K, listener: Listener<NotificationEventMap[K]>) {
    const set = this.listeners.get(event as string);
    if (!set) return;
    set.delete(listener);
  }

  emit<K extends keyof NotificationEventMap>(event: K, payload: NotificationEventMap[K]) {
    const set = this.listeners.get(event as string);
    if (!set) return;
    for (const l of set) {
      try {
        (l as Listener<any>)(payload);
      } catch (e) {
        // evitar quebra de listeners
        if (import.meta.env.DEV) console.warn('Notification emitter error', e);
      }
    }
  }
}

export class NotificationService {
  private static instance?: NotificationService;
  private emitter = new Emitter();
  private history: NotificationItem[] = [];
  private maxHistory = 200;
  private storageKey = 'nf_notifications_history';

  private constructor() {
    this.load();
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch {}
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.history = parsed;
      }
    } catch {}
  }

  subscribe<K extends keyof NotificationEventMap>(event: K, listener: Listener<NotificationEventMap[K]>) {
    return this.emitter.on(event, listener);
  }

  list(): NotificationItem[] {
    return [...this.history].sort((a, b) => b.createdAt - a.createdAt);
  }

  unreadCount(): number {
    return this.history.filter(h => !h.read).length;
  }

  clear() {
    this.history = [];
    this.save();
    this.emitter.emit('removed', { id: '__all__' } as any);
  }

  markAllRead() {
    this.history = this.history.map(h => ({ ...h, read: true }));
    this.save();
    this.emitter.emit('read_all', undefined);
  }

  remove(id: string) {
    this.history = this.history.filter(h => h.id !== id);
    this.save();
    this.emitter.emit('removed', { id });
  }

  private createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  notify(type: NotificationType, title: string, message?: string, priority: NotificationPriority = 'medium', options: NotificationOptions = {}) {
    const item: NotificationItem = {
      id: this.createId(),
      type,
      title,
      message,
      priority,
      createdAt: Date.now(),
      read: false,
      durationMs: options.durationMs,
      meta: options.meta,
    };

    // Inserir no topo, limitar histórico
    this.history = [item, ...this.history].slice(0, this.maxHistory);
    this.save();
    this.emitter.emit('added', item);
    return item.id;
  }

  update(id: string, patch: Partial<Omit<NotificationItem, 'id'>>) {
    const idx = this.history.findIndex(h => h.id === id);
    if (idx === -1) return;
    const updated = { ...this.history[idx], ...patch } as NotificationItem;
    this.history[idx] = updated;
    this.save();
    this.emitter.emit('updated', updated);
  }
}

export const notifications = NotificationService.getInstance();

