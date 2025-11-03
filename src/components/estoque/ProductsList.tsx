import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Package, Edit, TrendingUp, TrendingDown } from 'lucide-react';
import ProductForm from './ProductForm';
import StockMovementForm from './StockMovementForm';

interface Product {
  id: string;
  nome: string;
  codigo: string;
  categoria: string;
  quantidade_atual: number;
  quantidade_minima: number;
  preco_venda: number;
  unidade_medida: string;
}

const ProductsList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setProducts(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando produtos...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum produto cadastrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Qtd. Atual</TableHead>
            <TableHead className="text-right">Qtd. Mínima</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const lowStock = product.quantidade_atual <= product.quantidade_minima;
            
            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                <TableCell className="font-medium">{product.nome}</TableCell>
                <TableCell>{product.categoria || '-'}</TableCell>
                <TableCell className="text-right">
                  {product.quantidade_atual} {product.unidade_medida}
                </TableCell>
                <TableCell className="text-right">
                  {product.quantidade_minima} {product.unidade_medida}
                </TableCell>
                <TableCell>
                  {lowStock ? (
                    <Badge variant="destructive">Estoque Baixo</Badge>
                  ) : (
                    <Badge variant="default">Normal</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {product.preco_venda ? `R$ ${product.preco_venda.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <StockMovementForm product={product} onSuccess={fetchProducts} type="entrada">
                      <Button size="sm" variant="outline">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </StockMovementForm>
                    <StockMovementForm product={product} onSuccess={fetchProducts} type="saida">
                      <Button size="sm" variant="outline">
                        <TrendingDown className="h-4 w-4" />
                      </Button>
                    </StockMovementForm>
                    <ProductForm product={product} onSuccess={fetchProducts} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsList;
