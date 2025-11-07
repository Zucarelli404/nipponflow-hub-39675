import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Package, ShoppingCart as CartIcon, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductRequestDialog } from "./ProductRequestDialog";
import { ProductFilters, FilterState } from "./ProductFilters";
import { ShoppingCart } from "./ShoppingCart";
import { ProductNotifications } from "./ProductNotifications";
import { useShoppingCart } from "@/hooks/useShoppingCart";
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
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getTotalItems } = useShoppingCart();
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    categoria: null,
    disponibilidade: 'todas',
    precoMin: 0,
    precoMax: 10000,
    ordenacao: 'popularidade',
  });

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

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Busca por texto
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          if (!p.nome.toLowerCase().includes(term) && 
              !p.descricao?.toLowerCase().includes(term)) {
            return false;
          }
        }
        
        // Filtro de categoria
        if (filters.categoria && p.categoria !== filters.categoria) {
          return false;
        }
        
        // Filtro de disponibilidade
        if (filters.disponibilidade !== 'todas' && 
            p.disponibilidade !== filters.disponibilidade) {
          return false;
        }
        
        // Filtro de preço
        if (p.preco_venda < filters.precoMin || 
            p.preco_venda > filters.precoMax) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (filters.ordenacao) {
          case 'popularidade':
            return b.total_pedidos - a.total_pedidos;
          case 'preco_menor':
            return a.preco_venda - b.preco_venda;
          case 'preco_maior':
            return b.preco_venda - a.preco_venda;
          case 'nome':
            return a.nome.localeCompare(b.nome);
          default:
            return 0;
        }
      });
  }, [products, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Loja de Produtos</h2>
          <p className="text-muted-foreground mt-1">Selecione os produtos para solicitar</p>
        </div>
        <div className="flex items-center gap-2">
          <ProductNotifications 
            onProductClick={(productId) => {
              const product = products.find(p => p.id === productId);
              if (product) {
                setSelectedProduct(product);
                setDialogOpen(true);
              }
            }}
          />
          <Button variant="outline" onClick={() => window.location.href = '/?view=historico-produtos'}>
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          <Button 
            variant="default" 
            className="relative"
            onClick={() => setCartOpen(true)}
          >
            <CartIcon className="h-4 w-4 mr-2" />
            Carrinho
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <ProductFilters filters={filters} onFiltersChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
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

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12 col-span-full">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {products.length === 0 
              ? 'Nenhum produto disponível no momento.'
              : 'Nenhum produto encontrado com os filtros aplicados.'
            }
          </p>
        </div>
      )}

      <ProductRequestDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ShoppingCart 
        open={cartOpen}
        onOpenChange={setCartOpen}
      />
    </div>
  );
};
