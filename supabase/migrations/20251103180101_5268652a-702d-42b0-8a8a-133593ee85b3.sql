-- Corrigir search_path nas funções para segurança

DROP TRIGGER IF EXISTS auto_assign_first_admin_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_assign_first_admin();

-- Recriar função com search_path seguro
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se não existe nenhum user_role ainda, este é o primeiro usuário
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER auto_assign_first_admin_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();