import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductRequestDialog } from "./ProductRequestDialog";
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
  categoria: string | null;
}

export const ProductStore = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('total_pedidos', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">Loja de Produtos</h2>
        <p className="text-muted-foreground mt-1">Selecione os produtos para solicitar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105">
            <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
              {product.imagem_url ? (
                <img 
                  src={product.imagem_url} 
                  alt={product.nome} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground" />
              )}
              {product.categoria && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {product.categoria}
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg line-clamp-1">{product.nome}</h3>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < product.estrelas 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {product.total_pedidos} pedidos
                  </span>
                </div>
              </div>

              <div className="text-2xl font-bold text-green-600">
                R$ {product.preco_venda.toFixed(2)}
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  setSelectedProduct(product);
                  setDialogOpen(true);
                }}
              >
                SOLICITAR PRODUTO
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
        </div>
      )}

      <ProductRequestDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
