# Painel Distribuidor

Este documento descreve o painel de Distribuidor, implementado com paridade de layout, componentes e padrões de design em relação ao painel de Consultor.

## Objetivos

- Layout idêntico (estrutura, cores, tipografia e componentes visuais)
- Mesma organização de menus e navegação
- Funcionalidades equivalentes, adaptadas ao perfil Distribuidor
- Sistema de permissões e controles de acesso unificado
- Integração consistente com os sistemas existentes

## Arquitetura e Arquivos

- Componente principal: `src/components/dashboard/DistribuidorView.tsx`
- Navegação: `src/pages/Index.tsx` (case `distribuidor`)
- Menu e permissões: `src/components/layout/Sidebar.tsx`
- KPIs reutilizados: `src/components/dashboard/KPIStatCard.tsx`
- Notificações e eventos: `src/components/notifications/EventNotifications.tsx`

## Paridade de Layout e Componentes

- Filtros: escopo, período e intervalo de datas, iguais ao Consultor.
- Cards de KPI com sparkline: mesmos estilos e hierarquia visual.
- Gráficos: distribuição de vendas e recibos com Recharts, padronizados.
- Tabelas: vendas recentes e recebíveis (boletos/contas), com shadcn-ui.
- Responsividade: breakpoints e `Tailwind CSS` iguais ao Consultor.

## Permissões e Acesso

- O menu Sidebar filtra itens via `hasModulePermission(item.id)`.
- O módulo Distribuidor usa o código `distribuidor` e é mapeado nas tabelas:
  - `modules` (campo `codigo: "distribuidor"`)
  - `role_module_permissions` (roles com `can_view: true`)
- Admin sempre tem acesso; demais perfis conforme permissões definidas.

## Integração de Dados

- Demais integrações seguem o cliente Supabase (mock/demo) existente.
- O `DistribuidorView` agrega vendas, recebíveis e métricas de lucro.

## Responsividade e Performance

- Sidebar fixa com `position: fixed` e `overflow-y: auto`.
- Conteúdo principal compensa a largura (`lg:pl-64 xl:pl-72`).
- Componentes leves e memoizados onde aplicável; gráficos otimizados.

## Testes e Validação

- Verificar navegação para `Distribuidor` em `Index.tsx`.
- Garantir visibilidade conforme permissões no `Sidebar`.
- Validar responsividade de 320px a 1920px e diferentes DPRs.
- Checar KPIs, gráficos e tabelas carregando sem erros.

## Notas

- Manter padrões de código e estilos alinhados ao painel Consultor.
- Atualizações futuras devem preservar paridade de UX e acessibilidade.

