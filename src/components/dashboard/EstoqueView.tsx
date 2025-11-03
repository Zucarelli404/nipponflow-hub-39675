import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertTriangle, TrendingUp, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProductForm from '@/components/estoque/ProductForm';
import ProductsList from '@/components/estoque/ProductsList';
import StockMovementsList from '@/components/estoque/StockMovementsList';

const EstoqueView = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    movements: 0,
    totalValue: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async () => {
    // Total de produtos
    const { count: totalProducts } = await (supabase as any)
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Produtos com estoque baixo
    const { data: products } = await (supabase as any)
      .from('products')
      .select('quantidade_atual, quantidade_minima, preco_custo, quantidade_atual')
      .eq('ativo', true);

    const lowStock = products?.filter(
      p => p.quantidade_atual <= p.quantidade_minima
    ).length || 0;

    // Valor total do estoque
    const totalValue = products?.reduce(
      (sum, p) => sum + (p.preco_custo || 0) * p.quantidade_atual,
      0
    ) || 0;

    // Movimentações do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: movements } = await (supabase as any)
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    setStats({
      totalProducts: totalProducts || 0,
      lowStock,
      movements: movements || 0,
      totalValue,
    });
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground">Controle de produtos e materiais</p>
        </div>
        <ProductForm onSuccess={handleSuccess} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.movements}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Em estoque</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="movements">Movimentações</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="space-y-4">
              <ProductsList key={refreshKey} />
            </TabsContent>
            <TabsContent value="movements" className="space-y-4">
              <StockMovementsList key={refreshKey} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstoqueView;
