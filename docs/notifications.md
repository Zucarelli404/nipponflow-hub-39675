# Sistema de Notificações Unificado

Este módulo centraliza todas as notificações da aplicação com um serviço único, UI consistente, animações e histórico.

## Conceitos

- `NotificationService`: API única para publicar e gerenciar notificações.
- `NotificationProvider`: Provider React que expõe estado e ações via `useNotifications`.
- `NotificationCenter`: Componente de UI com sino na navbar, painel de histórico e pilha de toasts animados.
- `DemoNotificationsPanel`: Painel com botões para simulação.

## Uso

Publicar uma notificação:

```ts
import { notifications } from '@/lib/notifications/NotificationService';

notifications.notify('success', 'Venda registrada', 'Pedido #123', 'medium', { durationMs: 2500 });
```

Consumir no React:

```ts
import { useNotifications } from '@/contexts/NotificationContext';

const { items, unread, markAllRead, remove } = useNotifications();
```

## Prioridades e Tipos
- Tipos: `success`, `error`, `warning`, `info`.
- Prioridades: `low`, `medium`, `high`, `critical`.

## Histórico
- Persistido em `localStorage`.
- Limite padrão: 200 notificações.

## Integração
- O `NotificationProvider` já está integrado em `App.tsx`.
- O `NotificationCenter` substitui o antigo `EventNotifications` na navbar.

## Boas práticas
- Use `durationMs` para toasts temporários; omita para histórico apenas.
- Prefira prioridades `high/critical` para erros e alertas importantes.

## Testes
- Cobertura unitária do `NotificationService` com Vitest.

