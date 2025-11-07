import { useState } from "react";
import { Check, Clock, Package, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  preco_venda: number;
  imagem_url: string | null;
  disponibilidade: 'pronta_entrega' | 'entrega_7_dias';
  estrelas: number;
  total_pedidos: number;
}

interface ProductRequestDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductRequestDialog = ({ product, open, onOpenChange }: ProductRequestDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useShoppingCart();
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const disponibilidadeInfo = {
    pronta_entrega: {
      icon: Check,
      text: "Disponível a pronta entrega",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800"
    },
    entrega_7_dias: {
      icon: Clock,
      text: "Entrega somente em 7 dias",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800"
    }
  };

  const info = disponibilidadeInfo[product.disponibilidade];
  const Icon = info.icon;
  const valorTotal = product.preco_venda * quantidade;

  const handleConfirm = async () => {
    if (!product || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_requests')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantidade,
          valor_unitario: product.preco_venda,
          valor_total: valorTotal,
          observacoes: observacoes || null,
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: `Sua solicitação de ${product.nome} foi enviada com sucesso.`,
      });
      onOpenChange(false);
      setQuantidade(1);
      setObservacoes("");
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantidade);
    onOpenChange(false);
    setQuantidade(1);
    setObservacoes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Foto do produto */}
          <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center overflow-hidden">
            {product.imagem_url ? (
              <img 
                src={product.imagem_url} 
                alt={product.nome} 
                className="object-cover w-full h-full"
              />
            ) : (
              <Package className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          {/* Nome e Descrição */}
          <div>
            <h3 className="font-bold text-xl">{product.nome}</h3>
            {product.descricao && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {product.descricao}
              </p>
            )}
          </div>

          {/* Preço unitário */}
          <div>
            <div className="text-sm text-muted-foreground">Preço unitário</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {product.preco_venda.toFixed(2)}
            </div>
          </div>

          {/* Disponibilidade */}
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-3 border-2",
            info.bgColor,
            info.borderColor
          )}>
            <Icon className={cn("h-5 w-5 flex-shrink-0", info.color)} />
            <span className={cn("font-semibold text-sm", info.color)}>
              {info.text}
            </span>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center w-20"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidade(quantidade + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Valor Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold">Valor Total:</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {valorTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button 
            variant="outline"
            onClick={handleAddToCart} 
            disabled={loading}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 flex-1"
          >
            Solicitar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
