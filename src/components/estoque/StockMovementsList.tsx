import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Edit3 } from 'lucide-react';

interface StockMovement {
  id: string;
  tipo: string;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  motivo: string;
  observacoes: string;
  created_at: string;
  products: {
    nome: string;
    codigo: string;
    unidade_medida: string;
  };
  profiles: {
    nome: string;
  } | null;
}

const StockMovementsList = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('stock_movements')
      .select(`
        *,
        products (nome, codigo, unidade_medida),
        profiles (nome)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setMovements(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4" />;
      case 'ajuste':
        return <Edit3 className="h-4 w-4" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, any> = {
      entrada: 'default',
      saida: 'secondary',
      ajuste: 'outline',
    };

    const labels: Record<string, string> = {
      entrada: 'Entrada',
      saida: 'Saída',
      ajuste: 'Ajuste',
    };

    return (
      <Badge variant={variants[tipo]} className="flex items-center gap-1">
        {getTipoIcon(tipo)}
        {labels[tipo]}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Carregando movimentações...</div>;
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma movimentação registrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead className="text-right">Anterior</TableHead>
            <TableHead className="text-right">Nova</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Usuário</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="text-sm">
                {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{movement.products.nome}</p>
                  <p className="text-xs text-muted-foreground">{movement.products.codigo}</p>
                </div>
              </TableCell>
              <TableCell>{getTipoBadge(movement.tipo)}</TableCell>
              <TableCell className="text-right font-medium">
                {movement.tipo === 'entrada' && '+'}
                {movement.tipo === 'saida' && '-'}
                {movement.quantidade} {movement.products.unidade_medida}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {movement.quantidade_anterior}
              </TableCell>
              <TableCell className="text-right font-medium">
                {movement.quantidade_nova}
              </TableCell>
              <TableCell>{movement.motivo || '-'}</TableCell>
              <TableCell>{movement.profiles?.nome || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockMovementsList;
