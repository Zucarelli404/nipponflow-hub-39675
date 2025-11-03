-- Adicionar role de admin para o primeiro usuário que se registrar
-- ou para um email específico

-- Função para adicionar admin automaticamente ao primeiro usuário
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não existe nenhum user_role ainda, este é o primeiro usuário
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar após inserção na tabela profiles
CREATE TRIGGER auto_assign_first_admin_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();