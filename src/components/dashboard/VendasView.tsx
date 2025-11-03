import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
        <p className="text-muted-foreground">Acompanhe vendas e faturamento</p>
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
    </div>
  );
};

export default VendasView;
