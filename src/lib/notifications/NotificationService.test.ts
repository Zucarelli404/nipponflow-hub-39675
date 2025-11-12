import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from './NotificationService';

describe('NotificationService', () => {
  let svc: NotificationService;

  beforeEach(() => {
    // reset instance by creating a fresh service via internal constructor hack
    // We use the public API by clearing history
    svc = NotificationService.getInstance();
    (svc as any).clear();
  });

  it('should add notifications and list them', () => {
    svc.notify('info', 'Hello');
    svc.notify('success', 'Ok');
    const list = svc.list();
    expect(list.length).toBe(2);
    expect(list[0].title).toBeDefined();
  });

  it('should mark all as read', () => {
    svc.notify('warning', 'Pay attention');
    expect(svc.list().some(i => !i.read)).toBe(true);
    svc.markAllRead();
    expect(svc.list().every(i => i.read)).toBe(true);
  });

  it('should remove by id', () => {
    const id = svc.notify('error', 'Failure');
    expect(svc.list().length).toBe(1);
    svc.remove(id);
    expect(svc.list().length).toBe(0);
  });

  it('should update fields', () => {
    const id = svc.notify('info', 'Start');
    svc.update(id, { title: 'Updated', read: true });
    const item = svc.list().find(i => i.id === id)!;
    expect(item.title).toBe('Updated');
    expect(item.read).toBe(true);
  });
});

