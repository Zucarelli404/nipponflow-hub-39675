import { Check, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

  const handleConfirm = () => {
    toast({
      title: "Solicitação Enviada!",
      description: `Sua solicitação do produto "${product.nome}" foi registrada com sucesso.`,
    });
    onOpenChange(false);
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

          {/* Preço */}
          <div className="text-3xl font-bold text-green-600">
            R$ {product.preco_venda.toFixed(2)}
          </div>

          {/* Disponibilidade - DESTAQUE */}
          <div className={cn(
            "p-4 rounded-lg flex items-center gap-3 border-2",
            info.bgColor,
            info.borderColor
          )}>
            <Icon className={cn("h-6 w-6 flex-shrink-0", info.color)} />
            <span className={cn("font-semibold text-base", info.color)}>
              {info.text}
            </span>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Confirmar Solicitação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
