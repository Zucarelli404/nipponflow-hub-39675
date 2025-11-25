import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp, Receipt, Calendar as CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine, Brush } from 'recharts';
import { motion } from 'framer-motion';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import KPIStatCard from '@/components/dashboard/KPIStatCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Sale {
  id: string;
  data_visita: string;
  valor_total: number;
  forma_pagamento: string;
  lead?: { nome: string; telefone: string };
  especialista?: { nome: string };
  especialista_id?: string;
  visit_items?: Array<{ descricao: string; quantidade: number }>;
}

interface Invoice {
  id: string;
  user_id: string;
  valor: number;
  status: 'pendente' | 'pago';
  due_date: string;
  descricao?: string;
}

const DistribuidorView = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<{ id: string; nome: string }[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    mySales: 0,
    teamSales: 0,
    revenue: 0,
    avgTicket: 0,
    lucroEstimado: 0,
    boletosPendentes: 0,
    receitasRecebidas: 0,
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

  const STORAGE_KEY = 'distribuidor_filters';

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
    } catch {}
  }, []);

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
    } catch {}
  }, [viewScope, period, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchTeamSalesAndInvoices();
  }, [user?.id]);

  const fetchTeamSalesAndInvoices = async () => {
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
      // @ts-ignore
      const { data: vrData } = await (supabase as any)
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

      const salesData = (vrData || []) as Sale[];
      setSales(salesData);

      const mySalesCount = salesData.filter((s: any) => s.especialista_id === user.id).length;
      const teamSalesCount = salesData.length - mySalesCount;
      const revenueTotal = salesData.reduce((sum: number, s: any) => sum + Number(s.valor_total || 0), 0);
      const avgTicket = salesData.length > 0 ? revenueTotal / salesData.length : 0;

      // TODO: Implementar tabela de invoices no futuro
      // const { data: invData } = await supabase
      //   .from('invoices')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('due_date', { ascending: true });

      const invoicesList: Invoice[] = [];
      setInvoices(invoicesList);

      const pendentes = 0;
      const recebidas = 0;

      const lucroEstimado = revenueTotal * 0.3;

      setStats({
        mySales: mySalesCount,
        teamSales: teamSalesCount,
        revenue: revenueTotal,
        avgTicket,
        lucroEstimado,
        boletosPendentes: pendentes,
        receitasRecebidas: recebidas,
      });

      recomputeCharts(salesData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Erro ao buscar dados do distribuidor:', error);
    } finally {
      setLoading(false);
    }
  };

  const recomputeCharts = (items: Sale[]) => {
    let filtered = [...items];
    if (viewScope === 'individual' && user?.id) {
      filtered = filtered.filter((s: any) => s.especialista_id === user.id);
    }

    const now = new Date();
    const startDate = (() => {
      switch (period) {
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'range':
          return dateRange.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    })();

    const endDate = period === 'range' ? (dateRange.to || now) : now;
    filtered = filtered.filter((s: any) => {
      const d = new Date(s.data_visita);
      return d >= startDate && d <= endDate;
    });

    const byDayMap = new Map<string, { vendas: number; faturamento: number }>();
    filtered.forEach((s: any) => {
      const k = format(new Date(s.data_visita), 'dd/MM');
      const prev = byDayMap.get(k) || { vendas: 0, faturamento: 0 };
      byDayMap.set(k, { vendas: prev.vendas + 1, faturamento: prev.faturamento + Number(s.valor_total || 0) });
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Painel do Distribuidor</h2>
        <p className="text-muted-foreground">Suas vendas, equipe vinculada e recebíveis</p>
      </div>

      {/* Filtros - espelha ConsultorView */}
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
                  <SelectItem value="range">Intervalo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Intervalo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                      : 'Selecione as datas'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={dateRange as any}
                    onSelect={(range: any) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Modo offline com dados mockados: toggle removido */}
          </div>
        </CardContent>
      </Card>

      {/* KPIs - mesmos componentes visuais do ConsultorView */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIStatCard
          title="Minhas vendas"
          icon={<Users className="h-4 w-4" />}
          value={stats.mySales}
          subtext="Últimas movimentações"
          sparkline={sparkMySales}
        />
        <KPIStatCard
          title="Vendas da equipe"
          icon={<ShoppingCart className="h-4 w-4" />}
          value={stats.teamSales}
          subtext="Associadas ao seu distribuidor"
          sparkline={sparkTeamSales}
          lineColor="#22c55e"
          gradientFrom="rgba(34,197,94,0.25)"
        />
        <KPIStatCard
          title="Faturamento"
          icon={<DollarSign className="h-4 w-4" />}
          value={`R$ ${stats.revenue.toFixed(2)}`}
          subtext="Somatória no período"
          sparkline={sparkRevenue}
          lineColor="#0ea5e9"
          gradientFrom="rgba(14,165,233,0.35)"
          gradientTo="rgba(14,165,233,0)"
        />
        <KPIStatCard
          title="Ticket médio"
          icon={<TrendingUp className="h-4 w-4" />}
          value={`R$ ${stats.avgTicket.toFixed(2)}`}
          subtext="Receita por venda"
          sparkline={sparkAvgTicket}
          lineColor="#f59e0b"
          gradientFrom="rgba(245,158,11,0.35)"
          gradientTo="rgba(245,158,11,0)"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ vendas: { label: 'Vendas', color: 'hsl(var(--chart-1))' }, faturamento: { label: 'Faturamento', color: 'hsl(var(--chart-2))' } }}
              className="min-h-[220px]"
            >
              <ComposedChart data={chartData.salesByDay} height={220}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="faturamento" fill="hsl(var(--chart-2))" stroke="hsl(var(--chart-2))" fillOpacity={0.2} />
                <Bar dataKey="vendas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <ReferenceLine y={0} stroke="#000" />
                <Brush dataKey="day" height={20} travellerWidth={10} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pix: { label: 'PIX', color: 'hsl(var(--chart-1))' },
                cartao_credito: { label: 'Cartão', color: 'hsl(var(--chart-2))' },
                boleto: { label: 'Boleto', color: 'hsl(var(--chart-3))' },
                dinheiro: { label: 'Dinheiro', color: 'hsl(var(--chart-4))' },
                parcelado: { label: 'Parcelado', color: 'hsl(var(--chart-5))' },
                outros: { label: 'Outros', color: 'hsl(var(--chart-6))' },
              }}
              className="min-h-[220px]"
            >
              <PieChart width={400} height={220}>
                <Pie data={chartData.paymentDist} dataKey="valor" nameKey="metodo" cx="50%" cy="50%" outerRadius={60} label>
                  {chartData.paymentDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 6) + 1}))`} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vendas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vendas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="min-h-[160px] flex items-center justify-center text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma venda encontrada no período selecionado (modo offline)
                    </TableCell>
                  </TableRow>
                ) : sales.map((sale) => (
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

      {/* Recebíveis (boletos) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Recebidas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.receitasRecebidas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos compensados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Pendentes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.boletosPendentes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Contas a receber</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="min-h-[160px] flex items-center justify-center text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum boleto encontrado</TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.descricao || 'Boleto'}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'pendente' ? 'secondary' : 'default'} className="capitalize">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(inv.due_date), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">R$ {Number(inv.valor || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DistribuidorView;
