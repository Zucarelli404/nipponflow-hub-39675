-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_venda NUMERIC(10,2) NOT NULL,
  categoria TEXT,
  imagem_url TEXT,
  disponibilidade TEXT DEFAULT 'pronta_entrega' CHECK (disponibilidade IN ('pronta_entrega', 'entrega_7_dias')),
  estrelas INTEGER DEFAULT 0 CHECK (estrelas >= 0 AND estrelas <= 5),
  total_pedidos INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Everyone can view active products"
ON public.products FOR SELECT
TO authenticated
USING (is_active = true);

-- Admin can manage products
CREATE POLICY "Admin can manage products"
ON public.products FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_categoria ON public.products(categoria);
CREATE INDEX idx_products_estrelas ON public.products(estrelas DESC);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (nome, descricao, preco_venda, categoria, disponibilidade, estrelas, total_pedidos) VALUES
('Produto Premium A', 'Produto de alta qualidade com acabamento premium e garantia estendida', 299.90, 'Premium', 'pronta_entrega', 5, 150),
('Produto Standard B', 'Produto com excelente custo-benefício para uso diário', 149.90, 'Standard', 'pronta_entrega', 4, 89),
('Produto Especial C', 'Edição especial com recursos exclusivos e design diferenciado', 199.90, 'Especial', 'entrega_7_dias', 5, 120),
('Produto Basic D', 'Produto básico e funcional para necessidades essenciais', 99.90, 'Basic', 'pronta_entrega', 3, 45),
('Produto Elite E', 'Linha elite com tecnologia avançada e suporte personalizado', 399.90, 'Elite', 'entrega_7_dias', 5, 200),
('Produto Plus F', 'Versão aprimorada com recursos adicionais', 179.90, 'Plus', 'pronta_entrega', 4, 67),
('Produto Master G', 'Solução completa para profissionais', 349.90, 'Master', 'pronta_entrega', 5, 95),
('Produto Start H', 'Ideal para quem está começando', 79.90, 'Start', 'pronta_entrega', 3, 32);