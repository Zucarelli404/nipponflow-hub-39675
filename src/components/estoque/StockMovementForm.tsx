import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StockMovementFormProps {
  product: any;
  onSuccess?: () => void;
  type?: 'entrada' | 'saida' | 'ajuste';
  children?: ReactNode;
}

const StockMovementForm = ({ product, onSuccess, type = 'entrada', children }: StockMovementFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    tipo: type,
    quantidade: '',
    motivo: '',
    observacoes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantidade = parseInt(formData.quantidade);
      
      if (quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      if (formData.tipo === 'saida' && quantidade > product.quantidade_atual) {
        throw new Error('Quantidade insuficiente em estoque');
      }

      const quantidadeAnterior = product.quantidade_atual;
      let quantidadeNova = quantidadeAnterior;

      if (formData.tipo === 'entrada') {
        quantidadeNova = quantidadeAnterior + quantidade;
      } else if (formData.tipo === 'saida') {
        quantidadeNova = quantidadeAnterior - quantidade;
      } else if (formData.tipo === 'ajuste') {
        quantidadeNova = quantidade;
      }

      // Registrar movimentação
      const { error: movError } = await (supabase as any)
        .from('stock_movements')
        .insert([{
          product_id: product.id,
          tipo: formData.tipo,
          quantidade,
          quantidade_anterior: quantidadeAnterior,
          quantidade_nova: quantidadeNova,
          motivo: formData.motivo,
          observacoes: formData.observacoes,
          user_id: user?.id,
        }]);

      if (movError) throw movError;

      // Atualizar quantidade do produto
      const { error: updateError } = await (supabase as any)
        .from('products')
        .update({ quantidade_atual: quantidadeNova })
        .eq('id', product.id);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso!',
        description: 'Movimentação registrada com sucesso.',
      });

      setOpen(false);
      onSuccess?.();
      
      setFormData({
        tipo: type,
        quantidade: '',
        motivo: '',
        observacoes: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = () => {
    switch (formData.tipo) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'ajuste': return 'Ajuste';
      default: return 'Movimentação';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Nova Movimentação</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTipoLabel()} de Estoque - {product.nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Estoque atual</p>
            <p className="text-2xl font-bold">{product.quantidade_atual} {product.unidade_medida}</p>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Movimentação</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantidade">
              {formData.tipo === 'ajuste' ? 'Nova Quantidade' : 'Quantidade'} *
            </Label>
            <Input
              id="quantidade"
              type="number"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo</Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ex: Compra, Venda, Devolução, Inventário..."
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registrando...' : 'Registrar Movimentação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementForm;
