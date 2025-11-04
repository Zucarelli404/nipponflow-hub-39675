import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Users, TrendingUp, Clock, Filter } from 'lucide-react';
import AuditLogTable from '@/components/reports/AuditLogTable';
import UserActivityChart from '@/components/reports/UserActivityChart';

interface Profile {
  id: string;
  nome: string;
  email: string;
}

const RelatoriosView = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [stats, setStats] = useState({
    total_acoes: 0,
    usuarios_ativos: 0,
    acoes_hoje: 0,
    acoes_semana: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Total de ações
      const { count: totalCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Usuários ativos (com pelo menos 1 ação)
      const { data: activeUsers } = await supabase
        .from('audit_logs')
        .select('user_id')
        .order('user_id');

      const uniqueUsers = new Set(activeUsers?.map(log => log.user_id) || []);

      // Ações hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { count: acoesHoje } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hoje.toISOString());

      // Ações na semana
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      const { count: acoesSemana } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', semanaAtras.toISOString());

      setStats({
        total_acoes: totalCount || 0,
        usuarios_ativos: uniqueUsers.size,
        acoes_hoje: acoesHoje || 0,
        acoes_semana: acoesSemana || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios e Auditoria</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitoramento completo de atividades do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_acoes}</div>
            <p className="text-xs text-muted-foreground">Todas as atividades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuarios_ativos}</div>
            <p className="text-xs text-muted-foreground">Com atividades registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.acoes_hoje}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações na Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.acoes_semana}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Atividades por Usuário */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UserActivityChart />
        </div>

        {/* Tabela de Logs */}
        <div className="lg:col-span-2">
          <AuditLogTable 
            userId={selectedUser !== 'all' ? selectedUser : undefined}
            limit={100}
          />
        </div>
      </div>
    </div>
  );
};

export default RelatoriosView;
