import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users as UsersIcon, CheckCircle2, XCircle } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';
import { motion } from 'framer-motion';
import {
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

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
      handleError(error, 'Erro ao carregar estatísticas');
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <ChartContainer
              variant="astral"
              config={{
                novos: { label: 'Novos', color: 'hsl(var(--primary))' },
                em_atendimento: { label: 'Em atendimento', color: 'hsl(var(--accent))' },
                fechados: { label: 'Fechados', color: 'hsl(var(--success))' },
                perdidos: { label: 'Perdidos', color: 'hsl(var(--muted-foreground))' },
                conversao: { label: 'Conversão %', color: 'hsl(var(--warning))' },
              }}
            >
              <ComposedChart
                data={[
                  { name: 'Status', novos: stats.novos, em_atendimento: stats.em_atendimento, fechados: stats.fechados, perdidos: stats.perdidos, conversao: Number(stats.conversion_rate.toFixed(1)) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="novos" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                <Bar dataKey="em_atendimento" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
                <Bar dataKey="fechados" fill="hsl(var(--success))" radius={[4,4,0,0]} />
                <Bar dataKey="perdidos" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="conversao" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartContainer>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Radar de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <ChartContainer
              variant="astral"
              config={{
                metric: { label: 'Score', color: 'hsl(var(--primary))' },
              }}
            >
              <RadarChart outerRadius={90} data={[
                { subject: 'Novos', metric: stats.novos || 0 },
                { subject: 'Atendimento', metric: stats.em_atendimento || 0 },
                { subject: 'Fechados', metric: stats.fechados || 0 },
                { subject: 'Perdidos', metric: stats.perdidos || 0 },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, Math.max(stats.total_leads, 10)]} />
                <Radar name="Score" dataKey="metric" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </RadarChart>
            </ChartContainer>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;
