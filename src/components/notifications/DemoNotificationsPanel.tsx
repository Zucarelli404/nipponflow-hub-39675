import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notifications } from '@/lib/notifications/NotificationService';

export const DemoNotificationsPanel: React.FC = () => {
  const fire = (type: 'success' | 'error' | 'warning' | 'info', priority: 'low' | 'medium' | 'high' | 'critical', durationMs?: number) => {
    notifications.notify(type, `Demo: ${type}`, `Prioridade ${priority}${durationMs ? ` • ${durationMs}ms` : ''}`, priority, { durationMs });
  };

  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Demonstração de Notificações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="default" onClick={() => fire('success', 'medium', 2500)}>Sucesso (2.5s)</Button>
          <Button variant="destructive" onClick={() => fire('error', 'high', 3500)}>Erro (3.5s)</Button>
          <Button variant="secondary" onClick={() => fire('warning', 'high', 0)}>Alerta histórico</Button>
          <Button variant="outline" onClick={() => fire('info', 'low', 2000)}>Info (2s)</Button>
        </CardContent>
      </Card>
    </div>
  );
};

