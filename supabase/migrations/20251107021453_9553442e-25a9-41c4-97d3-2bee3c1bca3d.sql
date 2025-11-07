-- Tabela para notificações de produtos
CREATE TABLE IF NOT EXISTS public.product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

-- Tabela para solicitações de produtos
CREATE TABLE IF NOT EXISTS public.product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_unitario NUMERIC(10,2) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'entregue', 'cancelado')),
  observacoes TEXT,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para carrinho de compras
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_notifications_user ON product_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_user ON product_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON shopping_cart(user_id);

-- RLS para product_notifications
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
ON product_notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS para product_requests
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
ON product_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gerente'::app_role]));

CREATE POLICY "Users can create own requests"
ON product_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests"
ON product_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Managers can update all requests"
ON product_requests FOR UPDATE
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gerente'::app_role]));

-- RLS para shopping_cart
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
ON shopping_cart FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar product_requests updated_at
CREATE TRIGGER update_product_requests_updated_at
  BEFORE UPDATE ON product_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar shopping_cart updated_at
CREATE TRIGGER update_shopping_cart_updated_at
  BEFORE UPDATE ON shopping_cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para notificar quando produto fica disponível
CREATE OR REPLACE FUNCTION public.notify_product_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se mudou de entrega_7_dias para pronta_entrega
  IF OLD.disponibilidade = 'entrega_7_dias' AND NEW.disponibilidade = 'pronta_entrega' THEN
    -- Marca notificações existentes como não notificadas
    UPDATE product_notifications
    SET notified = false, notified_at = now()
    WHERE product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para mudança de disponibilidade
CREATE TRIGGER on_product_availability_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_availability();

-- Função para atualizar total_pedidos quando produto é solicitado
CREATE OR REPLACE FUNCTION public.update_product_order_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    UPDATE products
    SET total_pedidos = total_pedidos + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para atualizar contagem de pedidos
CREATE TRIGGER update_product_orders_on_approval
  AFTER INSERT OR UPDATE ON product_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_product_order_count();