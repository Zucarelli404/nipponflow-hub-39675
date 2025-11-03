import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users as UsersIcon, CheckCircle2, XCircle } from 'lucide-react';

const AnalyticsView = () => {
  const [stats, setStats] = useState({
    total_leads: 0,
    novos: 0,
    em_atendimento: 0,
    fechados: 0,
    perdidos: 0,
    conversion_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total leads
      const { count: totalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Status counts
      const { count: novosCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'novo');

      const { count: atendimentoCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_atendimento');

      const { count: fechadosCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fechado');

      const { count: perdidosCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'perdido');

      const total = totalCount || 0;
      const fechados = fechadosCount || 0;
      const conversionRate = total > 0 ? (fechados / total) * 100 : 0;

      setStats({
        total_leads: total,
        novos: novosCount || 0,
        em_atendimento: atendimentoCount || 0,
        fechados,
        perdidos: perdidosCount || 0,
        conversion_rate: conversionRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
        <p className="text-muted-foreground">Visão geral do desempenho comercial</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_leads}</div>
            <p className="text-xs text-muted-foreground">Todos os períodos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.fechados} de {stats.total_leads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.fechados}</div>
            <p className="text-xs text-muted-foreground">Vendas concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.novos}</div>
            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.em_atendimento}</div>
            <p className="text-xs text-muted-foreground">Conversas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.perdidos}</div>
            <p className="text-xs text-muted-foreground">Não convertidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Novos</div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${stats.total_leads > 0 ? (stats.novos / stats.total_leads) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-muted-foreground">
                {stats.novos}
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Em Atendimento</div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{
                      width: `${
                        stats.total_leads > 0 ? (stats.em_atendimento / stats.total_leads) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-muted-foreground">
                {stats.em_atendimento}
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Fechados</div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${stats.total_leads > 0 ? (stats.fechados / stats.total_leads) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-muted-foreground">
                {stats.fechados}
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-32 text-sm font-medium">Perdidos</div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground"
                    style={{
                      width: `${stats.total_leads > 0 ? (stats.perdidos / stats.total_leads) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-muted-foreground">
                {stats.perdidos}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
