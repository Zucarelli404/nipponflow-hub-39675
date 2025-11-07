import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
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
}

export const useShoppingCart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          id,
          product_id,
          quantidade,
          product:products(id, nome, preco_venda, imagem_url, disponibilidade)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data as CartItem[]);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o carrinho.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantidade: number = 1) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantidade: quantidade,
        }, {
          onConflict: 'user_id,product_id',
        });

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Sucesso",
        description: "Produto adicionado ao carrinho!",
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar ao carrinho.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Sucesso",
        description: "Produto removido do carrinho.",
      });
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover do carrinho.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (productId: string, quantidade: number) => {
    if (!user || quantidade < 1) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .update({ quantidade })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchCart();
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toast({
        title: "Sucesso",
        description: "Carrinho limpo.",
      });
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar o carrinho.",
        variant: "destructive",
      });
    }
  };

  const checkout = async (observacoes?: string) => {
    if (!user || cartItems.length === 0) return;

    setLoading(true);
    try {
      const requests = cartItems.map(item => ({
        user_id: user.id,
        product_id: item.product_id,
        quantidade: item.quantidade,
        valor_unitario: item.product.preco_venda,
        valor_total: item.product.preco_venda * item.quantidade,
        observacoes,
      }));

      const { error } = await supabase
        .from('product_requests')
        .insert(requests);

      if (error) throw error;

      await clearCart();
      toast({
        title: "Sucesso!",
        description: "Solicitações enviadas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar as solicitações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantidade, 0);
  };

  const getTotalValue = () => {
    return cartItems.reduce((sum, item) => 
      sum + (item.product.preco_venda * item.quantidade), 0
    );
  };

  return {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    getTotalItems,
    getTotalValue,
    refreshCart: fetchCart,
  };
};
