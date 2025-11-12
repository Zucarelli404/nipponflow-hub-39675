import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine, Brush } from 'recharts';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import KPIStatCard from '@/components/dashboard/KPIStatCard';

interface Sale {
  id: string;
  data_visita: string;
  valor_total: number;
  forma_pagamento: string;
  lead: { nome: string; telefone: string };
  especialista: { nome: string };
  visit_items: Array<{ descricao: string; quantidade: number }>;
  // opcional no tipo, utilizado no filtro
  especialista_id?: string;
}

const ConsultorView = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<{ id: string; nome: string }[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({
    mySales: 0,
    teamSales: 0,
    revenue: 0,
    avgTicket: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    salesByDay: [] as Array<{ day: string; vendas: number; faturamento: number }>,
    paymentDist: [] as Array<{ metodo: string; valor: number }>,
    revenueTrend: [] as Array<{ day: string; receita: number }>,
  });
  const [viewScope, setViewScope] = useState<'individual' | 'equipe'>('individual');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'month' | 'range'>('30d');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const STORAGE_KEY = 'consultor_filters';

  // Carregar preferências salvas
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.viewScope) setViewScope(saved.viewScope);
        if (saved.period) setPeriod(saved.period);
        if (saved.dateRange) {
          setDateRange({
            from: saved.dateRange.from ? new Date(saved.dateRange.from) : undefined,
            to: saved.dateRange.to ? new Date(saved.dateRange.to) : undefined,
          });
        }
      }
    } catch (e) {
      // ignora erros de parse
    }
  }, []);

  // Persistir preferências
  useEffect(() => {
    try {
      const payload = {
        viewScope,
        period,
        dateRange: { from: dateRange.from?.toISOString(), to: dateRange.to?.toISOString() },
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      // ignora erros de persistência
    }
  }, [viewScope, period, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchTeamAndSales();
  }, [user?.id]);

  const fetchTeamAndSales = async () => {
    if (!user?.id) return;
    try {
      const { data: teamData } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('diretor_id', user.id)
        .limit(5);

      const teamMembers = teamData || [];
      setTeam(teamMembers as any);

      const ids = [user.id, ...teamMembers.map((t: any) => t.id)];
      // @ts-ignore - Tabela será criada pela migration
      const { data } = await (supabase as any)
        .from('visit_reports')
        .select(`
          *,
          lead:leads(nome, telefone),
          especialista:profiles!visit_reports_especialista_id_fkey(nome),
          visit_items(*)
        `)
        .eq('venda_realizada', true)
        .in('especialista_id', ids)
        .order('data_visita', { ascending: false })
        .limit(50);

      const salesData = (data || []) as Sale[];
      setSales(salesData);

      const mySalesCount = salesData.filter((s: any) => s.especialista_id === user.id).length;
      const teamSalesCount = salesData.length - mySalesCount;
      const revenueTotal = salesData.reduce((sum: number, s: any) => sum + Number(s.valor_total || 0), 0);
      const avgTicket = salesData.length > 0 ? revenueTotal / salesData.length : 0;

      setStats({ mySales: mySalesCount, teamSales: teamSalesCount, revenue: revenueTotal, avgTicket });

      // Inicializar gráficos com filtros atuais
      recomputeCharts(salesData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Erro ao buscar dados do consultor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recalcula os gráficos conforme filtros
  const recomputeCharts = (base: Sale[]) => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = now;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'range':
        start = dateRange.from;
        end = dateRange.to || now;
        break;
      default:
        start = undefined;
    }

    const filtered = base.filter((s: any) => {
      const d = new Date(s.data_visita);
      const byScope = viewScope === 'individual' ? s.especialista_id === user?.id : true;
      const byPeriod = start ? d >= start && d <= (end || now) : true;
      return byScope && byPeriod;
    });

    const byDayMap = new Map<string, { vendas: number; faturamento: number }>();
    filtered.forEach((s: any) => {
      const key = format(new Date(s.data_visita), 'dd/MM');
      const prev = byDayMap.get(key) || { vendas: 0, faturamento: 0 };
      byDayMap.set(key, { vendas: prev.vendas + 1, faturamento: prev.faturamento + Number(s.valor_total || 0) });
    });
    const salesByDay = Array.from(byDayMap.entries()).map(([day, v]) => ({ day, vendas: v.vendas, faturamento: v.faturamento }));

    const payMap = new Map<string, number>();
    filtered.forEach((s: any) => {
      const key = (s.forma_pagamento || 'outros').replace('_', ' ');
      const prev = payMap.get(key) || 0;
      payMap.set(key, prev + Number(s.valor_total || 0));
    });
    const paymentDist = Array.from(payMap.entries()).map(([metodo, valor]) => ({ metodo, valor }));

    const revenueTrend = salesByDay.map((d) => ({ day: d.day, receita: d.faturamento }));
    setChartData({ salesByDay, paymentDist, revenueTrend });
  };

  // Helpers de sparkline para KPIs
  const aggregateSpark = (items: Sale[]): Array<{ label: string; value: number }> => {
    const byDay = new Map<string, number>();
    items.forEach((s: any) => {
      const key = format(new Date(s.data_visita), 'dd/MM');
      byDay.set(key, (byDay.get(key) || 0) + 1);
    });
    return Array.from(byDay.entries()).map(([label, value]) => ({ label, value }));
  };

  const sparkRevenue = useMemo(
    () => chartData.revenueTrend.map((d) => ({ label: d.day, value: d.receita })),
    [chartData.revenueTrend]
  );
  const sparkAvgTicket = useMemo(
    () => chartData.salesByDay.map((d) => ({ label: d.day, value: d.vendas > 0 ? d.faturamento / d.vendas : 0 })),
    [chartData.salesByDay]
  );
  const sparkMySales = useMemo(
    () => aggregateSpark(sales.filter((s: any) => s.especialista_id === user?.id)),
    [sales, user?.id]
  );
  const sparkTeamSales = useMemo(
    () => aggregateSpark(sales.filter((s: any) => s.especialista_id !== user?.id)),
    [sales, user?.id]
  );

  // Atualiza gráficos quando filtros mudarem
  useEffect(() => {
    if (sales.length > 0) {
      recomputeCharts(sales);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, viewScope, dateRange.from, dateRange.to, user?.id, sales.length]);

  // Modo offline: dados vêm do cliente mockado (sem geração de demo)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Painel do Consultor</h2>
        <p className="text-muted-foreground">Suas vendas e da equipe ligada a você</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="mb-2 block">Escopo</Label>
              <RadioGroup value={viewScope} onValueChange={(v) => setViewScope(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="scope-individual" />
                  <Label htmlFor="scope-individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equipe" id="scope-equipe" />
                  <Label htmlFor="scope-equipe">Equipe</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-2 block">Período</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="range">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Intervalo personalizado</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" disabled={period !== 'range'}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      : 'Selecionar intervalo'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange as any}
                    onSelect={(rng: any) => setDateRange(rng || {})}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Modo offline com dados mockados: toggle removido */}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIStatCard
          title="Minhas Vendas"
          icon={<ShoppingCart className="h-4 w-4" />}
          value={stats.mySales}
          subtext="Finalizadas"
          sparkline={sparkMySales}
          lineColor="#22c55e"
          gradientFrom="rgba(34,197,94,0.35)"
          gradientTo="rgba(34,197,94,0)"
        />
        <KPIStatCard
          title="Equipe (máx 5)"
          icon={<Users className="h-4 w-4" />}
          value={stats.teamSales}
          subtext="Vendas da equipe"
          sparkline={sparkTeamSales}
          lineColor="#a855f7"
          gradientFrom="rgba(168,85,247,0.35)"
          gradientTo="rgba(168,85,247,0)"
        />
        <KPIStatCard
          title="Faturamento"
          icon={<DollarSign className="h-4 w-4" />}
          value={`R$ ${stats.revenue.toFixed(2)}`}
          subtext="Total combinado"
          sparkline={sparkRevenue}
          lineColor="#0ea5e9"
          gradientFrom="rgba(14,165,233,0.35)"
          gradientTo="rgba(14,165,233,0)"
        />
        <KPIStatCard
          title="Ticket Médio"
          icon={<TrendingUp className="h-4 w-4" />}
          value={`R$ ${stats.avgTicket.toFixed(2)}`}
          subtext="Vendas combinadas"
          sparkline={sparkAvgTicket}
          lineColor="#f59e0b"
          gradientFrom="rgba(245,158,11,0.35)"
          gradientTo="rgba(245,158,11,0)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas (Você + Equipe)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Carregando dados...</div>
          ) : sales.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Nenhuma venda encontrada no período selecionado (modo offline)</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Consultor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{(sale as any).lead?.nome}</div>
                        <div className="text-xs text-muted-foreground">{(sale as any).lead?.telefone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{(sale as any).especialista?.nome}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(sale.data_visita), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{sale.forma_pagamento?.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{sale.visit_items?.length || 0}</TableCell>
                    <TableCell className="text-right font-medium">R$ {Number(sale.valor_total || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gráficos (mockados a partir dos dados) */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
          <CardHeader>
            <CardTitle>Vendas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.salesByDay.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
            ) : (
              <ChartContainer
                variant="astral"
                config={{
                  vendas: { label: 'Vendas', color: 'hsl(var(--primary))' },
                  faturamento: { label: 'Faturamento', color: 'hsl(var(--warning))' },
                }}
              >
                <BarChart data={chartData.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faturamento" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.paymentDist.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
            ) : (
              <ChartContainer
                variant="astral"
                config={{
                  valor: { label: 'Valor', color: 'hsl(var(--success))' },
                }}
              >
                <PieChart>
                  <Pie data={chartData.paymentDist} dataKey="valor" nameKey="metodo" outerRadius={100}>
                    {chartData.paymentDist.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))'][idx % 4]} />
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
            <CardTitle>Receita ao longo dos dias</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.revenueTrend.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes</div>
            ) : (
            <ChartContainer variant="astral" config={{ receita: { label: 'Receita', color: 'hsl(var(--primary))' } }}>
              <ComposedChart data={chartData.revenueTrend}>
                <defs>
                  <linearGradient id="grad-receita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#grad-receita)" strokeWidth={2} />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <ReferenceLine y={stats.avgTicket} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Ticket médio" />
                <Brush dataKey="day" height={20} travellerWidth={8} />
              </ComposedChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {team.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipe ligada a você</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {team.map((m) => (
                <span key={m.id} className="px-2 py-1 rounded bg-muted">{m.nome}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsultorView;
