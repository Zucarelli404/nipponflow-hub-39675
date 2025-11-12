import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, TrendingUp, Package, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import VisitReportForm from '@/components/visits/VisitReportForm';
import { motion } from 'framer-motion';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine, Brush } from 'recharts';

interface Sale {
  id: string;
  data_visita: string;
  valor_total: number;
  forma_pagamento: string;
  lead: {
    nome: string;
    telefone: string;
  };
  especialista: {
    nome: string;
  };
  visit_items: Array<{
    descricao: string;
    quantidade: number;
  }>;
}

const VendasView = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    revenue: 0,
    avgTicket: 0,
    itemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chartData, setChartData] = useState({
    salesByDay: [] as Array<{ day: string; vendas: number; faturamento: number }>,
    paymentDist: [] as Array<{ metodo: string; valor: number }>,
    revenueTrend: [] as Array<{ day: string; receita: number }>,
  });

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchSales();
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { data, error } = await (supabase as any)
        .from('visit_reports')
        .select(`
          *,
          lead:leads(nome, telefone),
          especialista:profiles!visit_reports_especialista_id_fkey(nome),
          visit_items(*)
        `)
        .eq('venda_realizada', true)
        .order('data_visita', { ascending: false })
        .limit(20);

      if (error) throw error;

      const salesData = data || [];
      setSales(salesData);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todaySales = salesData.filter((s: any) => 
        new Date(s.data_visita) >= todayStart
      ).length;

      const monthlyRevenue = salesData
        .filter((s: any) => new Date(s.data_visita) >= monthStart)
        .reduce((sum: number, s: any) => sum + Number(s.valor_total || 0), 0);

      const avgTicket = salesData.length > 0
        ? salesData.reduce((sum: number, s: any) => sum + Number(s.valor_total || 0), 0) / salesData.length
        : 0;

      const totalItems = salesData.reduce((sum: number, s: any) => 
        sum + (s.visit_items?.reduce((itemSum: number, item: any) => 
          itemSum + item.quantidade, 0
        ) || 0), 0
      );

      setStats({
        today: todaySales,
        revenue: monthlyRevenue,
        avgTicket,
        itemsSold: totalItems,
      });

      // Charts
      recomputeCharts(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const recomputeCharts = (base: Sale[]) => {
    const byDayMap = new Map<string, { vendas: number; faturamento: number }>();
    base.forEach((s: any) => {
      const key = new Date(s.data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const prev = byDayMap.get(key) || { vendas: 0, faturamento: 0 };
      byDayMap.set(key, { vendas: prev.vendas + 1, faturamento: prev.faturamento + Number(s.valor_total || 0) });
    });
    const salesByDay = Array.from(byDayMap.entries()).map(([day, v]) => ({ day, vendas: v.vendas, faturamento: v.faturamento }));

    const payMap = new Map<string, number>();
    base.forEach((s: any) => {
      const key = (s.forma_pagamento || 'outros').replace('_', ' ');
      payMap.set(key, (payMap.get(key) || 0) + Number(s.valor_total || 0));
    });
    const paymentDist = Array.from(payMap.entries()).map(([metodo, valor]) => ({ metodo, valor }));

    const revenueTrend = salesByDay.map((d) => ({ day: d.day, receita: d.faturamento }));
    setChartData({ salesByDay, paymentDist, revenueTrend });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
          <p className="text-muted-foreground">Acompanhe vendas e faturamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Venda</DialogTitle>
            </DialogHeader>
            <VisitReportForm
              leadId={selectedLeadId || undefined}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Pedidos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.avgTicket.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Média geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsSold}</div>
            <p className="text-xs text-muted-foreground">Itens vendidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Carregando vendas...
            </div>
          ) : sales.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma venda registrada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
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
                        <div className="text-xs text-muted-foreground">
                          {(sale as any).lead?.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{(sale as any).especialista?.nome}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(sale.data_visita), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sale.forma_pagamento?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.visit_items?.length || 0} {sale.visit_items?.length === 1 ? 'item' : 'itens'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {sale.valor_total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gráficos astronômicos de vendas */}
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
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="faturamento" fill="hsl(var(--warning))" radius={[4,4,0,0]} />
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
                <ChartContainer variant="astral" config={{ valor: { label: 'Valor', color: 'hsl(var(--success))' } }}>
                  <PieChart>
                    <Pie data={chartData.paymentDist} dataKey="valor" nameKey="metodo" outerRadius={100}>
                      {chartData.paymentDist.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={["hsl(var(--success))","hsl(var(--primary))","hsl(var(--accent))","hsl(var(--warning))"][idx % 4]} />
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
                    <linearGradient id="grad-receita-vendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#grad-receita-vendas)" strokeWidth={2} />
                  <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <ReferenceLine y={stats.avgTicket} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Ticket médio" />
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

export default VendasView;
