import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ScheduleVisitForm from '@/components/visits/ScheduleVisitForm';
import AutoSuggestVisits from '@/components/visits/AutoSuggestVisits';
import ScheduledVisitsList from '@/components/visits/ScheduledVisitsList';
import { motion } from 'framer-motion';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Area, Brush } from 'recharts';

interface VisitReport {
  id: string;
  data_visita: string;
  venda_realizada: boolean;
  valor_total: number;
  lead: {
    nome: string;
  };
  especialista: {
    nome: string;
  };
}

const VisitasView = () => {
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    visitsByDay: [] as Array<{ day: string; visitas: number; vendas: number }>,
    statusDist: [] as Array<{ status: string; total: number }>,
    conversionTrend: [] as Array<{ day: string; taxa: number }>,
  });

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { data, error } = await (supabase as any)
        .from('visit_reports')
        .select(`
          *,
          lead:leads(nome),
          especialista:profiles!visit_reports_especialista_id_fkey(nome)
        `)
        .order('data_visita', { ascending: false })
        .limit(20);

      if (error) throw error;

      const visitData = data || [];
      setVisits(visitData);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= todayStart
      ).length;

      const weekVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= weekStart
      ).length;

      const monthVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= monthStart
      ).length;

      const successfulVisits = visitData.filter((v: any) => v.venda_realizada).length;
      const successRate = visitData.length > 0 
        ? Math.round((successfulVisits / visitData.length) * 100) 
        : 0;

      setStats({
        today: todayVisits,
        thisWeek: weekVisits,
        thisMonth: monthVisits,
        successRate,
      });

      recomputeCharts(visitData);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const recomputeCharts = (base: VisitReport[]) => {
    const byDay = new Map<string, { visitas: number; vendas: number }>();
    base.forEach((v: any) => {
      const key = new Date(v.data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const prev = byDay.get(key) || { visitas: 0, vendas: 0 };
      byDay.set(key, { visitas: prev.visitas + 1, vendas: prev.vendas + (v.venda_realizada ? 1 : 0) });
    });
    const visitsByDay = Array.from(byDay.entries()).map(([day, v]) => ({ day, visitas: v.visitas, vendas: v.vendas }));

    const totalVendas = base.filter((v: any) => v.venda_realizada).length;
    const totalSem = base.length - totalVendas;
    const statusDist = [
      { status: 'com venda', total: totalVendas },
      { status: 'sem venda', total: totalSem },
    ];

    const conversionTrend = visitsByDay.map((d) => ({ day: d.day, taxa: d.visitas > 0 ? Math.round((d.vendas / d.visitas) * 100) : 0 }));
    setChartData({ visitsByDay, statusDist, conversionTrend });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Visitas</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe visitas realizadas</p>
        </div>
        <ScheduleVisitForm onSuccess={fetchVisits} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Visitas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Visitas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Total de visitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Visitas com venda</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Carregando visitas...
                </div>
              ) : visits.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma visita registrada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Especialista</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          {(visit as any).lead?.nome}
                        </TableCell>
                        <TableCell>{(visit as any).especialista?.nome}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(visit.data_visita), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          {visit.venda_realizada ? (
                            <Badge variant="default">Venda Realizada</Badge>
                          ) : (
                            <Badge variant="secondary">Sem Venda</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {visit.venda_realizada ? (
                            `R$ ${visit.valor_total.toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Visitas Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduledVisitsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <AutoSuggestVisits />
        </TabsContent>
      </Tabs>

      {/* Gráficos astronômicos de visitas */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Visitas e Vendas por dia</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.visitsByDay.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
              ) : (
                <ChartContainer variant="astral" config={{ visitas: { label: 'Visitas', color: 'hsl(var(--accent))' }, vendas: { label: 'Vendas', color: 'hsl(var(--success))' } }}>
                  <BarChart data={chartData.visitsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="visitas" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
                    <Bar dataKey="vendas" fill="hsl(var(--success))" radius={[4,4,0,0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Status das visitas</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.statusDist.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
              ) : (
                <ChartContainer variant="astral" config={{ total: { label: 'Total', color: 'hsl(var(--primary))' } }}>
                  <PieChart>
                    <Pie data={chartData.statusDist} dataKey="total" nameKey="status" outerRadius={100}>
                      {chartData.statusDist.map((d, idx) => (
                        <Cell key={d.status} fill={idx === 0 ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Tendência de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.conversionTrend.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
            ) : (
              <ChartContainer variant="astral" config={{ taxa: { label: 'Conversão %', color: 'hsl(var(--primary))' } }}>
                <ComposedChart data={chartData.conversionTrend}>
                  <defs>
                    <linearGradient id="grad-conv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="taxa" stroke="hsl(var(--primary))" fill="url(#grad-conv)" strokeWidth={2} />
                  <Line type="monotone" dataKey="taxa" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Brush dataKey="day" height={20} travellerWidth={8} />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VisitasView;
