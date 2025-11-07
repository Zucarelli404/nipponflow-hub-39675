import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Package } from "lucide-react";

interface CartItemProps {
  item: {
    id: string;
    product_id: string;
    quantidade: number;
    product: {
      id: string;
      nome: string;
      preco_venda: number;
      imagem_url: string | null;
      disponibilidade: string;
    };
  };
  onUpdateQuantity: (productId: string, quantidade: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const subtotal = item.product.preco_venda * item.quantidade;

  return (
    <div className="flex gap-3 py-3 border-b">
      <div className="h-16 w-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded flex items-center justify-center flex-shrink-0">
        {item.product.imagem_url ? (
          <img 
            src={item.product.imagem_url} 
            alt={item.product.nome}
            className="object-cover w-full h-full rounded"
          />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <h4 className="font-medium text-sm line-clamp-1">{item.product.nome}</h4>
        <p className="text-xs text-muted-foreground">
          {item.product.disponibilidade === 'pronta_entrega' ? 'Pronta Entrega' : 'Entrega em 7 dias'}
        </p>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onUpdateQuantity(item.product_id, Math.max(1, item.quantidade - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm w-8 text-center">{item.quantidade}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onUpdateQuantity(item.product_id, item.quantidade + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <span className="text-sm font-medium text-green-600">
            R$ {subtotal.toFixed(2)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto text-destructive"
            onClick={() => onRemove(item.product_id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
