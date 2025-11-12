// Simple mock Supabase client for DEMO mode
// Provides minimal support for auth and common table queries used in the app

type MockUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
};

const mockUser: MockUser = {
  id: 'demo-user-id',
  email: 'demo@empresa.com',
  user_metadata: { nome: 'Usuário Demo' },
};

// Mock datasets (default embutido). Pode ser sobrescrito por DADOS DEMO via initDemoData.
const defaultDatasets = {
  roles: [
    { id: 'role-admin', nome: 'Admin', descricao: 'Administrador do sistema', is_system: true },
    { id: 'role-diretor', nome: 'Diretor', descricao: 'Líder de equipe', is_system: false },
    { id: 'role-gerente', nome: 'Gerente', descricao: 'Gestão operacional', is_system: false },
    { id: 'role-especialista', nome: 'Especialista', descricao: 'Consultor de campo', is_system: false },
  ],
  modules: [
    { id: 'mod-graduacao', nome: 'Graduação Infinita', codigo: 'graduacao', descricao: null },
    { id: 'mod-inbox', nome: 'Chat', codigo: 'inbox', descricao: null },
    { id: 'mod-leads', nome: 'Clientes', codigo: 'leads', descricao: null },
    { id: 'mod-visitas', nome: 'Visitas', codigo: 'visitas', descricao: null },
    { id: 'mod-vendas', nome: 'Vendas', codigo: 'vendas', descricao: null },
    { id: 'mod-remarketing', nome: 'Revistas', codigo: 'remarketing', descricao: null },
    { id: 'mod-equipe', nome: 'Equipe', codigo: 'equipe', descricao: null },
    { id: 'mod-candidatos', nome: 'Candidatos', codigo: 'candidatos', descricao: null },
    { id: 'mod-estoque', nome: 'Estoque', codigo: 'estoque', descricao: null },
    { id: 'mod-cursos', nome: 'Cursos', codigo: 'cursos', descricao: null },
    { id: 'mod-gamificacao', nome: 'Gamificação', codigo: 'gamificacao', descricao: null },
    { id: 'mod-relatorios', nome: 'Relatórios', codigo: 'relatorios', descricao: null },
    { id: 'mod-configuracoes', nome: 'Configurações', codigo: 'configuracoes', descricao: null },
    { id: 'mod-consultor', nome: 'Consultor', codigo: 'consultor', descricao: null },
    { id: 'mod-distribuidor', nome: 'Distribuidor', codigo: 'distribuidor', descricao: null },
    { id: 'mod-canal-aguia', nome: 'Graduação inifinita', codigo: 'canal-aguia-real', descricao: 'Canal de transmissão demonstrativo' },
  ],
  role_module_permissions: [
    // Admin visualiza tudo
    { role_id: 'role-admin', module_id: 'mod-graduacao', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-inbox', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-leads', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-visitas', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-vendas', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-remarketing', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-equipe', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-candidatos', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-estoque', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-cursos', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-gamificacao', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-relatorios', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-configuracoes', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role_id: 'role-admin', module_id: 'mod-consultor', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-admin', module_id: 'mod-distribuidor', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-diretor', module_id: 'mod-consultor', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-gerente', module_id: 'mod-consultor', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-diretor', module_id: 'mod-distribuidor', can_view: true, can_create: false, can_edit: false, can_delete: false },
    // Canal Águia Real visível para todos os perfis na DEMO
    { role_id: 'role-admin', module_id: 'mod-canal-aguia', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-diretor', module_id: 'mod-canal-aguia', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-gerente', module_id: 'mod-canal-aguia', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role_id: 'role-especialista', module_id: 'mod-canal-aguia', can_view: true, can_create: false, can_edit: false, can_delete: false },
  ],
  // Cursos
  courses: [
    {
      id: 'course-1',
      titulo: 'Apresentação ABC Essencial',
      descricao: 'Aula introdutória sobre a metodologia ABC e como aplicá-la.',
      tipo: 'aula',
      status: 'publicado',
      conteudo_url: 'https://videos.empresa.com/abc-essencial',
      duracao_minutos: 45,
      data_live: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      autor_id: 'profile-1',
    },
    {
      id: 'course-2',
      titulo: 'E-book: Guia de Vendas Consultivas',
      descricao: 'Conteúdo prático para elevar conversões em visitas.',
      tipo: 'ebook',
      status: 'publicado',
      conteudo_url: 'https://docs.empresa.com/guia-vendas.pdf',
      duracao_minutos: null,
      data_live: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      autor_id: 'profile-2',
    },
    {
      id: 'course-3',
      titulo: 'Live: Estratégias para Missão Renove',
      descricao: 'Sessão ao vivo com dicas para aumentar impacto.',
      tipo: 'live',
      status: 'publicado',
      conteudo_url: null,
      duracao_minutos: 60,
      data_live: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      created_at: new Date().toISOString(),
      autor_id: 'profile-1',
    },
    {
      id: 'course-4',
      titulo: 'TeleAula: Sala de Treinamento Vendedores',
      descricao: 'Ambiente de TeleAula para simulações de atendimento.',
      tipo: 'teleaula',
      status: 'publicado',
      conteudo_url: 'https://teleaula.empresa.com/sala-vendedores',
      duracao_minutos: 50,
      data_live: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      autor_id: 'profile-2',
    },
  ],
  course_role_permissions: [
    { course_id: 'course-1', role_id: 'role-admin' },
    { course_id: 'course-2', role_id: 'role-admin' },
    { course_id: 'course-3', role_id: 'role-admin' },
    { course_id: 'course-4', role_id: 'role-admin' },
  ],
  leads: [
    {
      id: 'lead-1',
      nome: 'João Silva',
      telefone: '11999990001',
      status: 'novo',
      origem: 'instagram',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-1',
    },
    {
      id: 'lead-2',
      nome: 'Maria Oliveira',
      telefone: '11999990002',
      status: 'em_atendimento',
      origem: 'facebook',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-2',
    },
    {
      id: 'lead-3',
      nome: 'Carlos Pereira',
      telefone: '11999990003',
      status: 'fechado',
      origem: 'indicacao',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-1',
    },
    {
      id: 'lead-4',
      nome: 'Fernanda Souza',
      telefone: '11999990004',
      status: 'perdido',
      origem: 'anuncio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-2',
    },
    {
      id: 'lead-5',
      nome: 'Paula Mendes',
      telefone: '11999990005',
      status: 'novo',
      origem: 'indicacao',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-3',
    },
    {
      id: 'lead-6',
      nome: 'Rafael Costa',
      telefone: '11999990006',
      status: 'em_atendimento',
      origem: 'facebook',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responsavel_id: 'profile-4',
    },
  ],
  visit_reports: [
    {
      id: 'visit-1',
      lead_id: 'lead-2',
      especialista_id: 'profile-1',
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      venda_realizada: false,
      forma_pagamento: null,
      valor_total: 0,
      observacoes: 'Apresentação inicial sem venda',
    },
    {
      id: 'visit-2',
      lead_id: 'lead-3',
      especialista_id: 'profile-2',
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'cartao',
      valor_total: 1250.0,
      observacoes: 'Venda realizada com sucesso',
    },
    {
      id: 'visit-3',
      lead_id: 'lead-1',
      especialista_id: mockUser.id,
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'pix',
      valor_total: 800.0,
      observacoes: 'Venda rápida via PIX',
    },
    {
      id: 'visit-4',
      lead_id: 'lead-4',
      especialista_id: 'profile-3',
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'boleto',
      valor_total: 600.0,
      observacoes: 'Venda com boleto a vencer',
    },
    {
      id: 'visit-5',
      lead_id: 'lead-2',
      especialista_id: 'profile-4',
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'cartao',
      valor_total: 1500.0,
      observacoes: 'Venda parcelada',
    },
    {
      id: 'visit-6',
      lead_id: 'lead-3',
      especialista_id: 'profile-5',
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'dinheiro',
      valor_total: 400.0,
      observacoes: 'Venda à vista',
    },
    {
      id: 'visit-7',
      lead_id: 'lead-5',
      especialista_id: mockUser.id,
      data_visita: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'cartao',
      valor_total: 980.0,
      observacoes: 'Venda com cartão em 2x',
    },
    {
      id: 'visit-8',
      lead_id: 'lead-6',
      especialista_id: mockUser.id,
      data_visita: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      venda_realizada: true,
      forma_pagamento: 'boleto',
      valor_total: 560.0,
      observacoes: 'Boleto gerado para 7 dias',
    },
  ],
  profiles: [
    {
      id: 'profile-1',
      nome: 'Ana Responsável',
      email: 'ana@empresa.com',
      cargo: 'Diretora Comercial',
      telefone: '+55 11 90000-0001',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
      diretor_id: null,
    },
    {
      id: 'profile-2',
      nome: 'Bruno Responsável',
      email: 'bruno@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0002',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
      diretor_id: 'profile-1',
    },
    {
      id: mockUser.id,
      nome: 'Usuário Demo',
      email: 'demo@empresa.com',
      cargo: 'Administrador',
      telefone: '+55 11 90000-0000',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      diretor_id: null,
    },
    {
      id: 'profile-3',
      nome: 'Clara Vendas',
      email: 'clara@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0003',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
      diretor_id: mockUser.id,
    },
    {
      id: 'profile-4',
      nome: 'Diego Consultor',
      email: 'diego@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0004',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
      diretor_id: mockUser.id,
    },
    {
      id: 'profile-5',
      nome: 'Érika Campos',
      email: 'erika@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0005',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
      diretor_id: mockUser.id,
    },
    {
      id: 'profile-6',
      nome: 'Fábio Nogueira',
      email: 'fabio@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0006',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
      diretor_id: mockUser.id,
    },
    {
      id: 'profile-7',
      nome: 'Gisele Prado',
      email: 'gisele@empresa.com',
      cargo: 'Especialista de Vendas',
      telefone: '+55 11 90000-0007',
      data_admissao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
      diretor_id: mockUser.id,
    },
  ],
  // Mapeia cargos por usuário
  user_roles: [
    { user_id: mockUser.id, role: 'admin', role_id: 'role-admin' },
    { user_id: 'profile-1', role: 'diretor', role_id: 'role-diretor' },
    { user_id: 'profile-2', role: 'especialista', role_id: 'role-especialista' },
  ],
  scheduled_visits: [
    {
      id: 'sched-1',
      lead_id: 'lead-1',
      data_visita: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      especialista_id: 'profile-2',
      status: 'agendada',
      observacoes: 'Visita de avaliação',
    },
    {
      id: 'sched-2',
      lead_id: 'lead-4',
      data_visita: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      especialista_id: 'profile-1',
      status: 'agendada',
      observacoes: 'Tentativa de reconquista',
    },
  ],
  // Event notifications used by DEMO notifications bell
  event_notifications: [
    {
      id: 'evt-visit-1',
      user_id: mockUser.id,
      type: 'visit',
      entity_id: 'sched-1',
      message: 'Nova Visita Agendada',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      metadata: { data: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
    },
    {
      id: 'evt-sale-joao',
      user_id: mockUser.id,
      type: 'sale',
      entity_id: 'visit-2',
      message: 'Nova Venda feita por João',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      read: false,
      metadata: { valor_total: 1250.0 },
    },
    {
      id: 'evt-goal-maria',
      user_id: mockUser.id,
      type: 'goal',
      entity_id: 'goal-1',
      message: 'META ALCANÇADA por Maria',
      created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      read: false,
      metadata: { lead_nome: 'Maria' },
    },
    {
      id: 'evt-distributor-1',
      user_id: mockUser.id,
      type: 'distributor',
      entity_id: 'profile-6',
      message: 'Novo Distribuidor',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: false,
      metadata: null,
    },
    {
      id: 'evt-graduate-1',
      user_id: mockUser.id,
      type: 'graduate',
      entity_id: 'grad-1',
      message: 'Novo Graduado',
      created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      read: false,
      metadata: null,
    },
  ],
  // Boletos/Contas a receber
  invoices: [
    { id: 'inv-1', user_id: mockUser.id, valor: 450.0, status: 'pendente', due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), descricao: 'Boleto venda PIX ajuste' },
    { id: 'inv-2', user_id: mockUser.id, valor: 300.0, status: 'pago', due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), descricao: 'Mensalidade plataforma' },
    { id: 'inv-3', user_id: mockUser.id, valor: 200.0, status: 'pendente', due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), descricao: 'Assinatura cliente' },
    { id: 'inv-4', user_id: mockUser.id, valor: 560.0, status: 'pendente', due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), descricao: 'Boleto venda visit-8' },
    { id: 'inv-5', user_id: mockUser.id, valor: 980.0, status: 'pago', due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), descricao: 'Cartão compensado venda visit-7' },
  ],
  // Itens de venda por relatório de visita
  visit_items: [
    { id: 'item-1', visit_report_id: 'visit-2', descricao: 'Kit Nippon', quantidade: 2, valor_unitario: 250 },
    { id: 'item-2', visit_report_id: 'visit-2', descricao: 'Assinatura Revista', quantidade: 1, valor_unitario: 750 },
    { id: 'item-3', visit_report_id: 'visit-3', descricao: 'Kit Iniciante', quantidade: 1, valor_unitario: 800 },
    { id: 'item-4', visit_report_id: 'visit-4', descricao: 'Assinatura Básica', quantidade: 1, valor_unitario: 600 },
    { id: 'item-5', visit_report_id: 'visit-5', descricao: 'Combo Apresentação', quantidade: 3, valor_unitario: 500 },
    { id: 'item-6', visit_report_id: 'visit-6', descricao: 'Material Didático', quantidade: 2, valor_unitario: 200 },
    { id: 'item-7', visit_report_id: 'visit-7', descricao: 'Kit Pro', quantidade: 1, valor_unitario: 980 },
    { id: 'item-8', visit_report_id: 'visit-8', descricao: 'Plano Mensal', quantidade: 1, valor_unitario: 560 },
  ],
  // Notas associadas aos leads
  notes: [
    {
      id: 'note-1',
      lead_id: 'lead-2',
      autor_id: 'profile-1',
      texto: 'Contato inicial realizado pelo WhatsApp.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'note-2',
      lead_id: 'lead-4',
      autor_id: 'profile-2',
      texto: '[Remarketing - ligação] Cliente demonstrou interesse em retornar.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ],
  // Candidatos mockados
  candidates: [
    {
      id: 'cand-1',
      nome: 'Henrique Souza',
      email: 'henrique@exemplo.com',
      telefone: '+55 11 98888-1111',
      cargo_desejado: 'Consultor',
      status: 'pendente',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
    {
      id: 'cand-2',
      nome: 'Isabela Santos',
      email: 'isabela@exemplo.com',
      telefone: '+55 11 97777-2222',
      cargo_desejado: 'Especialista',
      status: 'em_analise',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 'cand-3',
      nome: 'Jorge Lima',
      email: 'jorge@exemplo.com',
      telefone: '+55 11 96666-3333',
      cargo_desejado: 'Distribuidor',
      status: 'aprovado',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
  // Produtos e Estoque
  products: [
    {
      id: 'prod-abc',
      nome: 'Kit Nippon ABC',
      codigo: 'ABC-001',
      descricao: 'Kit completo para apresentação ABC',
      unidade_medida: 'UN',
      quantidade_atual: 12,
      quantidade_minima: 5,
      preco_custo: 150.0,
      preco_venda: 250.0,
      categoria: 'Apresentação',
      ativo: true,
    },
    {
      id: 'prod-rev',
      nome: 'Assinatura Revista Nippon',
      codigo: 'REV-450',
      descricao: 'Assinatura anual da revista',
      unidade_medida: 'UN',
      quantidade_atual: 30,
      quantidade_minima: 10,
      preco_custo: 500.0,
      preco_venda: 750.0,
      categoria: 'Assinatura',
      ativo: true,
    },
    {
      id: 'prod-mat',
      nome: 'Material de Treinamento',
      codigo: 'MAT-202',
      descricao: 'Apostilas e slides de treinamento',
      unidade_medida: 'CX',
      quantidade_atual: 3,
      quantidade_minima: 2,
      preco_custo: 200.0,
      preco_venda: 300.0,
      categoria: 'Treinamento',
      ativo: true,
    },
  ],
  stock_movements: [
    {
      id: 'mov-1',
      product_id: 'prod-abc',
      tipo: 'entrada',
      quantidade: 5,
      quantidade_anterior: 7,
      quantidade_nova: 12,
      motivo: 'Compra fornecedor',
      observacoes: 'Reposição mensal',
      user_id: mockUser.id,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'mov-2',
      product_id: 'prod-rev',
      tipo: 'saida',
      quantidade: 3,
      quantidade_anterior: 33,
      quantidade_nova: 30,
      motivo: 'Venda direta',
      observacoes: 'Assinaturas aprovadas',
      user_id: 'profile-2',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'mov-3',
      product_id: 'prod-mat',
      tipo: 'ajuste',
      quantidade: 3,
      quantidade_anterior: 4,
      quantidade_nova: 3,
      motivo: 'Inventário',
      observacoes: 'Correção após conferência',
      user_id: 'profile-1',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ],
  // Campanhas de remarketing (Revistas)
  remarketing_campaigns: [
    {
      id: 'camp-1',
      nome: 'Reconquista Black Friday',
      descricao: 'Campanha focada em leads perdidos do último trimestre.',
      meta_contatos: 30,
      contatos_realizados: 10,
      leads_reconquistados: 3,
      status: 'ativa',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      created_by: mockUser.id,
    },
    {
      id: 'camp-2',
      nome: 'Revistas Natal 2025',
      descricao: 'Ações com clientes inativos para assinaturas.',
      meta_contatos: 50,
      contatos_realizados: 25,
      leads_reconquistados: 8,
      status: 'ativa',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      created_by: mockUser.id,
    },
  ],
  // Gamificação: badges disponíveis
  badges: [
    { id: 'badge-1', nome: 'Primeira Vitória', descricao: 'Concluir a primeira venda', icone: 'trophy', cor: '#F59E0B' },
    { id: 'badge-2', nome: 'Vendedor Ativo', descricao: 'Registrar vendas constantes por 4 semanas', icone: 'target', cor: '#10B981' },
    { id: 'badge-3', nome: 'Criativo', descricao: 'Criar estratégia própria de vendas', icone: 'star', cor: '#6366F1' },
  ],
  // Gamificação: badges do usuário
  user_badges: [
    { id: 'ub-1', user_id: mockUser.id, badge_id: 'badge-1', conquistado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
    { id: 'ub-2', user_id: mockUser.id, badge_id: 'badge-3', conquistado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  ],
  // Gamificação: pontos do usuário
  user_points: [
    { user_id: mockUser.id, total_points: 1450, current_level: 3, points_to_next_level: 550 },
  ],
  // Histórico de pontos para notificações
  points_history: [
    { id: 'ph-1', user_id: mockUser.id, pontos: 200, motivo: 'Venda acima de USD 1.000', categoria: 'venda', created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
    { id: 'ph-2', user_id: mockUser.id, pontos: 100, motivo: 'Nova apresentação ABC realizada', categoria: 'visita', created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
    { id: 'ph-3', user_id: mockUser.id, pontos: 150, motivo: 'Ajudou um novo consultor', categoria: 'lead', created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
    { id: 'ph-4', user_id: mockUser.id, pontos: 300, motivo: 'Meta mensal concluída: USD 10.000 em vendas', categoria: 'meta', created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  ],
  // Metas (Missões) semanais e mensais
  goals: [
    // Semanais (individuais)
    {
      id: 'goal-w1', user_id: mockUser.id, titulo: 'Nova apresentação ABC',
      descricao: 'Realizar 1 nova apresentação ABC nesta semana', tipo: 'individual', categoria: 'visita',
      meta_valor: 1, valor_atual: 0, unidade: 'acoes', pontos_recompensa: 100, premio_descricao: 'XP + Energy Coin',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), status: 'ativa',
    },
    {
      id: 'goal-w2', user_id: mockUser.id, titulo: 'Ajudar novo consultor',
      descricao: 'Auxiliar 1 novo consultor a iniciar', tipo: 'individual', categoria: 'mentoria',
      meta_valor: 1, valor_atual: 1, unidade: 'acoes', pontos_recompensa: 150, premio_descricao: 'XP extra',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), status: 'concluida',
    },
    {
      id: 'goal-w3', user_id: mockUser.id, titulo: 'Venda acima de USD 1.000',
      descricao: 'Registrar uma venda acima de USD 1.000', tipo: 'individual', categoria: 'venda',
      meta_valor: 1000, valor_atual: 750, unidade: 'usd', pontos_recompensa: 200, premio_descricao: 'XP + reconhecimento',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), status: 'ativa',
    },
    {
      id: 'goal-w4', user_id: mockUser.id, titulo: 'Depoimento motivacional',
      descricao: 'Postar 1 depoimento motivacional no grupo', tipo: 'individual', categoria: 'comunidade',
      meta_valor: 1, valor_atual: 0, unidade: 'acoes', pontos_recompensa: 50, premio_descricao: 'XP simbólico',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), status: 'ativa',
    },
    // Mensais (gerais)
    {
      id: 'goal-m1', user_id: null, titulo: 'Bater USD 10.000 em vendas',
      descricao: 'Atingir USD 10.000 em vendas no mês', tipo: 'geral', categoria: 'venda',
      meta_valor: 10000, valor_atual: 4200, unidade: 'usd', pontos_recompensa: 800, premio_descricao: 'XP extra + destaque',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), status: 'ativa',
    },
    {
      id: 'goal-m2', user_id: null, titulo: 'Formar 1 novo D.I.',
      descricao: 'Formar 1 novo consultor D.I. no mês', tipo: 'geral', categoria: 'equipe',
      meta_valor: 1, valor_atual: 0, unidade: 'acoes', pontos_recompensa: 1000, premio_descricao: 'XP + título “Mentor Júnior”',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), status: 'ativa',
    },
    {
      id: 'goal-m3', user_id: null, titulo: 'Aumentar equipe em 10%',
      descricao: 'Crescer equipe em 10% no mês', tipo: 'geral', categoria: 'equipe',
      meta_valor: 10, valor_atual: 4, unidade: 'percent', pontos_recompensa: 1500, premio_descricao: 'XP + reconhecimento',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), status: 'ativa',
    },
    {
      id: 'goal-m4', user_id: null, titulo: 'Mentoria global',
      descricao: 'Participar de um evento de mentoria global', tipo: 'geral', categoria: 'mentoria',
      meta_valor: 1, valor_atual: 0, unidade: 'acoes', pontos_recompensa: 500, premio_descricao: 'XP + networking',
      data_inicio: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), data_fim: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), status: 'ativa',
    },
  ],
  // Níveis da Trilha (Plano de 30 dias)
  trail_levels: [
    // Semana 1: Preparação & Captação
    {
      id: 'level-w1-check', nivel: 1, tipo: 'checkpoint',
      titulo: 'Semana 1: Preparação & Captação',
      descricao: 'Familiarize-se com produto/kit (R$ 840) e mapeie rede.',
      icone: 'Target', recompensa_xp: 100, recompensa_diamantes: 5,
      requisito_tipo: 'visita', requisito_quantidade: 0, ordem: 1,
    },
    {
      id: 'level-w1-task-contacts', nivel: 1, tipo: 'task',
      titulo: 'Listar 20 contatos para kit business',
      descricao: 'Mapeie e organize 20 potenciais contatos.',
      icone: 'Users', recompensa_xp: 50, recompensa_diamantes: 2,
      requisito_tipo: 'leads', requisito_quantidade: 20, ordem: 2,
    },
    {
      id: 'level-w1-task-agendar', nivel: 1, tipo: 'task',
      titulo: 'Agendar 10 visitas/chamadas',
      descricao: 'Agende conversas para apresentar o kit.',
      icone: 'Calendar', recompensa_xp: 50, recompensa_diamantes: 2,
      requisito_tipo: 'visitas', requisito_quantidade: 10, ordem: 3,
    },
    {
      id: 'level-w1-task-feedback', nivel: 1, tipo: 'task',
      titulo: 'Obter 5 feedbacks de interesse',
      descricao: 'Colete feedback preliminar de 5 pessoas.',
      icone: 'MessageSquare', recompensa_xp: 30, recompensa_diamantes: 1,
      requisito_tipo: 'comunidade', requisito_quantidade: 5, ordem: 4,
    },
    // Semana 2: Conversão e Treinamento
    {
      id: 'level-w2-check', nivel: 2, tipo: 'checkpoint',
      titulo: 'Semana 2: Conversão & Treinamento',
      descricao: 'Converter primeiros interessados e iniciar ABC.',
      icone: 'Target', recompensa_xp: 150, recompensa_diamantes: 6,
      requisito_tipo: 'venda', requisito_quantidade: 0, ordem: 5,
    },
    {
      id: 'level-w2-task-vendas', nivel: 2, tipo: 'task',
      titulo: 'Fechar 3 vendas de kit business',
      descricao: 'Converta interessados em vendas (ou recrute 3).',
      icone: 'ShoppingCart', recompensa_xp: 80, recompensa_diamantes: 3,
      requisito_tipo: 'venda', requisito_quantidade: 3, ordem: 6,
    },
    {
      id: 'level-w2-task-treinamento', nivel: 2, tipo: 'task',
      titulo: 'Treinamento ABC acelerado (4 visitas)',
      descricao: 'Execute ciclo prático com 1 recruta ou piloto.',
      icone: 'ClipboardList', recompensa_xp: 70, recompensa_diamantes: 3,
      requisito_tipo: 'mentoria', requisito_quantidade: 1, ordem: 7,
    },
    {
      id: 'level-w2-task-apresentacoes', nivel: 2, tipo: 'task',
      titulo: 'Fazer 4 apresentações para clientes',
      descricao: 'Apresente kit cliente para 4 clientes.',
      icone: 'Presentation', recompensa_xp: 60, recompensa_diamantes: 2,
      requisito_tipo: 'visitas', requisito_quantidade: 4, ordem: 8,
    },
    // Semana 3: Escalonamento & Intensificação
    {
      id: 'level-w3-check', nivel: 3, tipo: 'checkpoint',
      titulo: 'Semana 3: Escalonamento & Intensificação',
      descricao: 'Alcance 10 pessoas business e acelere visitas.',
      icone: 'Target', recompensa_xp: 200, recompensa_diamantes: 8,
      requisito_tipo: 'equipe', requisito_quantidade: 0, ordem: 9,
    },
    {
      id: 'level-w3-task-recrutar', nivel: 3, tipo: 'task',
      titulo: 'Recrutar +7 (total 10) pessoas business',
      descricao: 'Complete a meta de 10 no time.',
      icone: 'UserPlus', recompensa_xp: 120, recompensa_diamantes: 4,
      requisito_tipo: 'equipe', requisito_quantidade: 7, ordem: 10,
    },
    {
      id: 'level-w3-task-visitas', nivel: 3, tipo: 'task',
      titulo: 'Realizar 10 visitas adicionais a clientes',
      descricao: 'Intensifique o ritmo de contatos.',
      icone: 'Calendar', recompensa_xp: 90, recompensa_diamantes: 3,
      requisito_tipo: 'visitas', requisito_quantidade: 10, ordem: 11,
    },
    {
      id: 'level-w3-task-vendas-cliente', nivel: 3, tipo: 'task',
      titulo: 'Gerar 3 vendas de kit cliente',
      descricao: 'Fechar pelo menos 3 kits cliente.',
      icone: 'ShoppingCart', recompensa_xp: 100, recompensa_diamantes: 4,
      requisito_tipo: 'venda', requisito_quantidade: 3, ordem: 12,
    },
    // Semana 4: Consolidação & Objetivo Final
    {
      id: 'level-w4-check', nivel: 4, tipo: 'checkpoint',
      titulo: 'Semana 4: Consultor Tropa de Elite',
      descricao: 'Consolidar resultados e alcançar comissão alvo.',
      icone: 'Trophy', recompensa_xp: 300, recompensa_diamantes: 10,
      requisito_tipo: 'meta', requisito_quantidade: 0, ordem: 13,
    },
    {
      id: 'level-w4-task-business', nivel: 4, tipo: 'task',
      titulo: 'Fechar 5 kits business (40% comissão)',
      descricao: 'Atingir o patamar consultor conforme imagem.',
      icone: 'ShoppingCart', recompensa_xp: 120, recompensa_diamantes: 5,
      requisito_tipo: 'venda', requisito_quantidade: 5, ordem: 14,
    },
    {
      id: 'level-w4-task-cliente', nivel: 4, tipo: 'task',
      titulo: 'Fechar 4 kits cliente ou R$ 3.360',
      descricao: 'Compor a meta de valor conforme plano.',
      icone: 'Coin', recompensa_xp: 100, recompensa_diamantes: 4,
      requisito_tipo: 'venda', requisito_quantidade: 4, ordem: 15,
    },
    {
      id: 'level-w4-task-acompanhamento', nivel: 4, tipo: 'task',
      titulo: 'Acompanhar rede (10 business + clientes)',
      descricao: 'Maximizar retenção e estímulo ao negócio.',
      icone: 'Handshake', recompensa_xp: 80, recompensa_diamantes: 4,
      requisito_tipo: 'comunidade', requisito_quantidade: 14, ordem: 16,
    },
    {
      id: 'level-w4-task-revisao', nivel: 4, tipo: 'task',
      titulo: 'Revisar comissões e plano pós-30 dias',
      descricao: 'Fechar ciclo e planejar continuidade.',
      icone: 'ClipboardList', recompensa_xp: 90, recompensa_diamantes: 4,
      requisito_tipo: 'meta', requisito_quantidade: 1, ordem: 17,
    },
  ],
  // Progresso do usuário por nível
  user_trail_progress: [
    // Semana 1 disponível
    { id: 'prog-w1-check', user_id: mockUser.id, level_id: 'level-w1-check', status: 'available', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w1-contacts', user_id: mockUser.id, level_id: 'level-w1-task-contacts', status: 'in_progress', progresso_atual: 8, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w1-agendar', user_id: mockUser.id, level_id: 'level-w1-task-agendar', status: 'in_progress', progresso_atual: 5, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w1-feedback', user_id: mockUser.id, level_id: 'level-w1-task-feedback', status: 'available', progresso_atual: 2, completed_at: null, created_at: new Date().toISOString() },
    // Semana 2 bloqueada
    { id: 'prog-w2-check', user_id: mockUser.id, level_id: 'level-w2-check', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w2-vendas', user_id: mockUser.id, level_id: 'level-w2-task-vendas', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w2-treinamento', user_id: mockUser.id, level_id: 'level-w2-task-treinamento', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w2-apresentacoes', user_id: mockUser.id, level_id: 'level-w2-task-apresentacoes', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    // Semana 3 bloqueada
    { id: 'prog-w3-check', user_id: mockUser.id, level_id: 'level-w3-check', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w3-recrutar', user_id: mockUser.id, level_id: 'level-w3-task-recrutar', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w3-visitas', user_id: mockUser.id, level_id: 'level-w3-task-visitas', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w3-vendas-cliente', user_id: mockUser.id, level_id: 'level-w3-task-vendas-cliente', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    // Semana 4 bloqueada
    { id: 'prog-w4-check', user_id: mockUser.id, level_id: 'level-w4-check', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w4-business', user_id: mockUser.id, level_id: 'level-w4-task-business', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w4-cliente', user_id: mockUser.id, level_id: 'level-w4-task-cliente', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w4-acompanhamento', user_id: mockUser.id, level_id: 'level-w4-task-acompanhamento', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
    { id: 'prog-w4-revisao', user_id: mockUser.id, level_id: 'level-w4-task-revisao', status: 'locked', progresso_atual: 0, completed_at: null, created_at: new Date().toISOString() },
  ],
  // Progresso agregado do usuário para cabeçalho da trilha
  user_progression: [
    {
      id: 'up-1', user_id: mockUser.id, current_checkpoint: 'consultor',
      nivel_atual: 1, vendas_totais: 5, visitas_completadas: 6, leads_cadastrados: 4,
      diamantes: 10, vidas: 5, ofensiva_dias: 3, ultima_atividade: new Date().toISOString(),
    },
  ],
  // Resgates de prêmios
  reward_redemptions: [
    { id: 'rr-1', user_id: mockUser.id, premio: 'Desconto exclusivo', status: 'pendente', created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
    { id: 'rr-2', user_id: mockUser.id, premio: 'Certificado Digital', status: 'aprovado', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'rr-3', user_id: mockUser.id, premio: 'Acesso à academia executiva', status: 'aprovado', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  ],
  audit_logs: [
    { id: 'al-1', user_id: mockUser.id, acao: 'login', alvo_tipo: 'sistema', alvo_id: null, detalhes: { ip: '127.0.0.1' }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
    { id: 'al-2', user_id: mockUser.id, acao: 'criar_lead', alvo_tipo: 'lead', alvo_id: 'lead-1', detalhes: { origem: 'instagram' }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'al-3', user_id: mockUser.id, acao: 'registrar_visita', alvo_tipo: 'visita', alvo_id: 'visit-2', detalhes: { resultado: 'venda' }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'al-4', user_id: 'profile-2', acao: 'registrar_venda', alvo_tipo: 'visita', alvo_id: 'visit-2', detalhes: { valor: 1250 }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
    { id: 'al-5', user_id: mockUser.id, acao: 'atualizar_candidato', alvo_tipo: 'candidato', alvo_id: 'cand-2', detalhes: { status: 'em_analise' }, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'al-6', user_id: mockUser.id, acao: 'configurar_modulo', alvo_tipo: 'sistema', alvo_id: null, detalhes: { modulo: 'consultor' }, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
};

// Helper to join modules into permissions result when requested with modules!inner(codigo)
function withModuleJoin(permissions: any[]) {
  return permissions.map((p) => ({
    ...p,
    modules: datasets.modules.find((m) => m.id === p.module_id) || null,
  }));
}

function createQuery(table: string) {
  let mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let singleMode: 'none' | 'single' | 'maybeSingle' = 'none';
  let payload: any = null;
  let filters: Record<string, any> = {};
  let inFilter: Record<string, any[]> = {};
  let selectQuery = '*';

  const api = {
    select(query: string) {
      selectQuery = query;
      mode = 'select';
      return api;
    },
    eq(field: string, value: any) {
      filters[field] = value;
      return api;
    },
    in(field: string, values: any[]) {
      inFilter[field] = values;
      return api;
    },
    order() {
      return api;
    },
    or() {
      return api;
    },
    single() {
      singleMode = 'single';
      return api;
    },
    maybeSingle() {
      singleMode = 'maybeSingle';
      return api;
    },
    insert(data: any) {
      mode = 'insert';
      payload = data;
      return api;
    },
    update(data: any) {
      mode = 'update';
      payload = data;
      return api;
    },
    delete() {
      mode = 'delete';
      return api;
    },
    then(resolve: any) {
      let data: any = null;
      let error: any = null;

      try {
        switch (mode) {
          case 'select': {
            const all = (datasets as any)[table] || [];
            let rows = Array.isArray(all) ? [...all] : all;

            // Apply eq filters
            Object.entries(filters).forEach(([field, value]) => {
              rows = rows.filter((r: any) => r[field] === value);
            });

            // Apply in filters
            Object.entries(inFilter).forEach(([field, values]) => {
              rows = rows.filter((r: any) => values.includes(r[field]));
            });

            // Special join for permissions
            if (table === 'role_module_permissions' && selectQuery.includes('modules')) {
              rows = withModuleJoin(rows);
            }

            // Joins simplificados para DEMO
            if (table === 'visit_reports') {
              rows = rows.map((r: any) => ({
                ...r,
                lead: ((): any => {
                  const lead = (datasets as any).leads.find((l: any) => l.id === r.lead_id);
                  return lead ? { nome: lead.nome, telefone: lead.telefone } : null;
                })(),
                especialista: ((): any => {
                  const esp = (datasets as any).profiles.find((p: any) => p.id === r.especialista_id);
                  return esp ? { nome: esp.nome } : null;
                })(),
                visit_items: (datasets as any).visit_items?.filter((vi: any) => vi.visit_report_id === r.id) || [],
              }));
            }

            // Join de níveis em progresso da trilha
            if (table === 'user_trail_progress' && selectQuery.includes('level:trail_levels')) {
              rows = rows.map((r: any) => ({
                ...r,
                level: ((): any => {
                  const lvl = (datasets as any).trail_levels?.find((l: any) => l.id === r.level_id);
                  return lvl || null;
                })(),
              }));
            }

            if (table === 'scheduled_visits') {
              rows = rows.map((r: any) => ({
                ...r,
                lead: ((): any => {
                  const lead = (datasets as any).leads.find((l: any) => l.id === r.lead_id);
                  return lead ? { nome: lead.nome, telefone: lead.telefone } : null;
                })(),
                especialista: ((): any => {
                  const esp = (datasets as any).profiles.find((p: any) => p.id === r.especialista_id);
                  return esp ? { nome: esp.nome } : null;
                })(),
              }));
            }

            if (table === 'notes' && selectQuery.includes('autor:profiles')) {
              rows = rows.map((r: any) => ({
                ...r,
                autor: ((): any => {
                  const autor = (datasets as any).profiles.find((p: any) => p.id === r.autor_id);
                  return autor ? { nome: autor.nome } : null;
                })(),
              }));
            }

            // Join badges em user_badges quando solicitado
            if (table === 'user_badges' && selectQuery.includes('badges')) {
              rows = rows.map((r: any) => ({
                ...r,
                badges: ((): any => {
                  const badge = (datasets as any).badges.find((b: any) => b.id === r.badge_id);
                  return badge ? { nome: badge.nome, descricao: badge.descricao, icone: badge.icone, cor: badge.cor } : null;
                })(),
              }));
            }

            // Joins para movimentações de estoque
            if (table === 'stock_movements') {
              rows = rows.map((r: any) => ({
                ...r,
                products: ((): any => {
                  const prod = (datasets as any).products.find((p: any) => p.id === r.product_id);
                  if (!prod) return null;
                  return { nome: prod.nome, codigo: prod.codigo, unidade_medida: prod.unidade_medida };
                })(),
                profiles: ((): any => {
                  const user = (datasets as any).profiles.find((p: any) => p.id === r.user_id);
                  return user ? { nome: user.nome } : null;
                })(),
              }));
            }

            // Joins para lista da equipe (user_roles e diretor)
            if (table === 'profiles' && (selectQuery.includes('user_roles(') || selectQuery.includes('diretor:'))) {
              rows = rows.map((r: any) => ({
                ...r,
                user_roles: (datasets as any).user_roles
                  .filter((ur: any) => ur.user_id === r.id)
                  .map((ur: any) => ({ role: ur.role })),
                diretor: ((): any => {
                  if (!r.diretor_id) return null;
                  const diretor = (datasets as any).profiles.find((p: any) => p.id === r.diretor_id);
                  return diretor ? { nome: diretor.nome } : null;
                })(),
              }));
            }

            if (singleMode === 'single') {
              if (Array.isArray(rows)) {
                data = rows[0] || null;
              } else {
                data = rows;
              }
            } else if (singleMode === 'maybeSingle') {
              data = Array.isArray(rows) ? rows[0] || null : rows;
            } else {
              data = rows;
            }
            // Provide count for convenience when requested by UI
            const count = Array.isArray(rows) ? rows.length : (rows ? 1 : 0);
            return resolve({ data, error, count });
            break;
          }
          case 'insert': {
            const arr = (datasets as any)[table] || [];
            if (Array.isArray(arr)) {
              const toInsert = Array.isArray(payload) ? payload : [payload];
              (datasets as any)[table] = [...arr, ...toInsert];
              data = toInsert;
            } else {
              (datasets as any)[table] = payload;
              data = payload;
            }
            break;
          }
          case 'update': {
            const arr = (datasets as any)[table] || [];
            if (Array.isArray(arr)) {
              const updated = arr.map((item: any) => {
                const matches = Object.entries(filters).every(([f, v]) => item[f] === v);
                return matches ? { ...item, ...payload } : item;
              });
              (datasets as any)[table] = updated;
              data = updated;
            } else {
              (datasets as any)[table] = { ...(datasets as any)[table], ...payload };
              data = (datasets as any)[table];
            }
            break;
          }
          case 'delete': {
            const arr = (datasets as any)[table] || [];
            if (Array.isArray(arr)) {
              const remaining = arr.filter((item: any) => {
                return !Object.entries(filters).every(([f, v]) => item[f] === v);
              });
              (datasets as any)[table] = remaining;
              data = remaining;
            } else {
              (datasets as any)[table] = null;
              data = null;
            }
            break;
          }
        }
      } catch (e: any) {
        error = e;
      }

      return resolve({ data, error });
    },
    catch(reject: any) {
      return reject({ error: new Error('Mock error') });
    },
  };

  return api;
}

// Se o loader de DADOS DEMO foi executado, usa o objeto global; caso contrário, utiliza o embutido.
const datasets: any = (globalThis as any).__DEMO_DATASETS || defaultDatasets;

export const mockSupabase: any = {
  auth: {
    onAuthStateChange(callback: any) {
      const session = { user: mockUser };
      // Immediately invoke callback to simulate existing session
      setTimeout(() => callback('SIGNED_IN', session), 0);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    getSession() {
      return Promise.resolve({ data: { session: { user: mockUser } } });
    },
    getUser() {
      return Promise.resolve({ data: { user: mockUser } });
    },
    signInWithPassword({ email, password }: { email: string; password: string }) {
      if (!email || !password) {
        return Promise.resolve({ error: new Error('Invalid login credentials') });
      }
      return Promise.resolve({ data: { user: mockUser }, error: null });
    },
    signUp() {
      return Promise.resolve({ data: { user: mockUser }, error: null });
    },
    signOut() {
      return Promise.resolve({ error: null });
    },
    resetPasswordForEmail() {
      return Promise.resolve({ data: {}, error: null });
    },
  },
  // Minimal implementation of RPC calls used in the app
  rpc(fn: string, _params?: Record<string, any>) {
    // For DEMO: pretend RPC succeeded; specific functions can be handled here if needed
    return Promise.resolve({ data: null, error: null });
  },
  // Minimal realtime channel API to satisfy subscriptions in DEMO mode
  channel(name: string) {
    const handlers: Array<{ event: string; config: any; cb: Function }> = [];
    const channelObj = {
      name,
      on(event: string, config: any, cb: Function) {
        handlers.push({ event, config, cb });
        return channelObj;
      },
      subscribe() {
        // No-op in DEMO; just return the channel object so callers can remove it later
        return channelObj;
      },
      unsubscribe() {
        // No-op
      },
    };
    return channelObj;
  },
  removeChannel(_channel: any) {
    // No-op in DEMO; provided to match Supabase client API used in cleanup
    return true;
  },
  from(table: string) {
    return createQuery(table);
  },
};
