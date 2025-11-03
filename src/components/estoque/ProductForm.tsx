import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface ProductFormProps {
  onSuccess?: () => void;
  product?: any;
}

const ProductForm = ({ onSuccess, product }: ProductFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: product?.nome || '',
    codigo: product?.codigo || '',
    descricao: product?.descricao || '',
    unidade_medida: product?.unidade_medida || 'UN',
    quantidade_atual: product?.quantidade_atual || 0,
    quantidade_minima: product?.quantidade_minima || 0,
    preco_custo: product?.preco_custo || '',
    preco_venda: product?.preco_venda || '',
    categoria: product?.categoria || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        preco_custo: formData.preco_custo ? parseFloat(formData.preco_custo as string) : null,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda as string) : null,
      };

      let error;
      if (product) {
        ({ error } = await (supabase as any)
          .from('products')
          .update(data)
          .eq('id', product.id));
      } else {
        ({ error } = await (supabase as any)
          .from('products')
          .insert([data]));
      }

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Produto ${product ? 'atualizado' : 'cadastrado'} com sucesso.`,
      });

      setOpen(false);
      onSuccess?.();
      
      if (!product) {
        setFormData({
          nome: '',
          codigo: '',
          descricao: '',
          unidade_medida: 'UN',
          quantidade_atual: 0,
          quantidade_minima: 0,
          preco_custo: '',
          preco_venda: '',
          categoria: '',
        });
      }
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {product ? 'Editar' : 'Novo Produto'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                disabled={!!product}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="unidade_medida">Unidade de Medida</Label>
              <Select
                value={formData.unidade_medida}
                onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade (UN)</SelectItem>
                  <SelectItem value="KG">Quilograma (KG)</SelectItem>
                  <SelectItem value="LT">Litro (LT)</SelectItem>
                  <SelectItem value="MT">Metro (MT)</SelectItem>
                  <SelectItem value="CX">Caixa (CX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantidade_atual">Quantidade Atual</Label>
              <Input
                id="quantidade_atual"
                type="number"
                value={formData.quantidade_atual}
                onChange={(e) => setFormData({ ...formData, quantidade_atual: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
              <Input
                id="quantidade_minima"
                type="number"
                value={formData.quantidade_minima}
                onChange={(e) => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preco_custo">Preço de Custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                value={formData.preco_custo}
                onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                value={formData.preco_venda}
                onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
