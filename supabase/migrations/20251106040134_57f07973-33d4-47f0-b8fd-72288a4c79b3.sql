-- Create user_progression table
CREATE TABLE IF NOT EXISTS public.user_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_checkpoint text NOT NULL DEFAULT 'graduado',
  nivel_atual integer NOT NULL DEFAULT 1,
  vendas_totais integer NOT NULL DEFAULT 0,
  visitas_completadas integer NOT NULL DEFAULT 0,
  leads_cadastrados integer NOT NULL DEFAULT 0,
  diamantes integer NOT NULL DEFAULT 0,
  vidas integer NOT NULL DEFAULT 5,
  ofensiva_dias integer NOT NULL DEFAULT 0,
  ultima_atividade timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create trail_levels table
CREATE TABLE IF NOT EXISTS public.trail_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel integer NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('task', 'checkpoint')),
  titulo text NOT NULL,
  descricao text NOT NULL,
  icone text NOT NULL,
  recompensa_xp integer DEFAULT 0,
  recompensa_diamantes integer DEFAULT 0,
  requisito_tipo text CHECK (requisito_tipo IN ('vendas', 'visitas', 'leads', 'nivel_anterior', 'checkpoint')),
  requisito_quantidade integer DEFAULT 0,
  ordem integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_trail_progress table
CREATE TABLE IF NOT EXISTS public.user_trail_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  level_id uuid REFERENCES public.trail_levels(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  progresso_atual integer DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Enable RLS
ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trail_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progression
CREATE POLICY "Users can view own progression"
  ON public.user_progression FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progression"
  ON public.user_progression FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team progression"
  ON public.user_progression FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gerente'::app_role]) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_progression.user_id AND p.diretor_id = auth.uid()
    )
  );

-- RLS Policies for trail_levels
CREATE POLICY "Everyone can view active trail levels"
  ON public.trail_levels FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage trail levels"
  ON public.trail_levels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_trail_progress
CREATE POLICY "Users can view own progress"
  ON public.user_trail_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_trail_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team progress"
  ON public.user_trail_progress FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gerente'::app_role]) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_trail_progress.user_id AND p.diretor_id = auth.uid()
    )
  );

-- Function to initialize user progression
CREATE OR REPLACE FUNCTION public.initialize_user_progression()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user progression record
  INSERT INTO public.user_progression (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize progress for all levels
  INSERT INTO public.user_trail_progress (user_id, level_id, status, progresso_atual)
  SELECT 
    NEW.user_id,
    tl.id,
    CASE 
      WHEN tl.nivel = 1 THEN 'completed'
      WHEN tl.nivel = 2 THEN 'available'
      ELSE 'locked'
    END,
    CASE WHEN tl.nivel = 1 THEN tl.requisito_quantidade ELSE 0 END
  FROM public.trail_levels tl
  WHERE tl.is_active = true
  ON CONFLICT (user_id, level_id) DO NOTHING;

  -- Mark level 1 as completed
  UPDATE public.user_trail_progress
  SET status = 'completed', completed_at = now()
  WHERE user_id = NEW.user_id 
  AND level_id = (SELECT id FROM public.trail_levels WHERE nivel = 1);

  RETURN NEW;
END;
$$;

-- Trigger to initialize progression when user_points is created
CREATE TRIGGER trigger_initialize_user_progression
  AFTER INSERT ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_progression();

-- Function to update user progression
CREATE OR REPLACE FUNCTION public.update_user_progression()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_nivel RECORD;
  v_current_checkpoint text;
BEGIN
  -- Determine user_id based on trigger source
  IF TG_TABLE_NAME = 'visit_reports' THEN
    v_user_id := NEW.especialista_id;
  ELSIF TG_TABLE_NAME = 'leads' THEN
    v_user_id := NEW.responsavel_id;
  ELSIF TG_TABLE_NAME = 'scheduled_visits' THEN
    v_user_id := NEW.especialista_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Update counters in user_progression
  IF TG_TABLE_NAME = 'visit_reports' AND NEW.venda_realizada = true THEN
    UPDATE public.user_progression
    SET 
      vendas_totais = vendas_totais + 1,
      ultima_atividade = now(),
      updated_at = now()
    WHERE user_id = v_user_id;
  ELSIF TG_TABLE_NAME = 'visit_reports' THEN
    UPDATE public.user_progression
    SET 
      visitas_completadas = visitas_completadas + 1,
      ultima_atividade = now(),
      updated_at = now()
    WHERE user_id = v_user_id;
  ELSIF TG_TABLE_NAME = 'leads' THEN
    UPDATE public.user_progression
    SET 
      leads_cadastrados = leads_cadastrados + 1,
      ultima_atividade = now(),
      updated_at = now()
    WHERE user_id = v_user_id;
  ELSIF TG_TABLE_NAME = 'scheduled_visits' THEN
    UPDATE public.user_progression
    SET 
      ultima_atividade = now(),
      updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  -- Check and update checkpoint
  SELECT current_checkpoint INTO v_current_checkpoint
  FROM public.user_progression
  WHERE user_id = v_user_id;

  -- Update checkpoint based on sales
  UPDATE public.user_progression up
  SET current_checkpoint = CASE
    WHEN up.vendas_totais >= 100 THEN 'distribuidor'
    WHEN up.vendas_totais >= 10 THEN 'consultor'
    ELSE 'graduado'
  END
  WHERE up.user_id = v_user_id;

  -- Update trail progress for all levels
  FOR v_nivel IN 
    SELECT tl.*, utp.id as progress_id, utp.status, utp.progresso_atual
    FROM public.trail_levels tl
    LEFT JOIN public.user_trail_progress utp ON utp.level_id = tl.id AND utp.user_id = v_user_id
    WHERE tl.is_active = true
    ORDER BY tl.ordem
  LOOP
    DECLARE
      v_atual integer := 0;
      v_objetivo integer := v_nivel.requisito_quantidade;
      v_novo_status text;
    BEGIN
      -- Calculate current progress
      IF v_nivel.requisito_tipo = 'vendas' THEN
        SELECT vendas_totais INTO v_atual FROM public.user_progression WHERE user_id = v_user_id;
      ELSIF v_nivel.requisito_tipo = 'visitas' THEN
        SELECT visitas_completadas INTO v_atual FROM public.user_progression WHERE user_id = v_user_id;
      ELSIF v_nivel.requisito_tipo = 'leads' THEN
        SELECT leads_cadastrados INTO v_atual FROM public.user_progression WHERE user_id = v_user_id;
      ELSIF v_nivel.requisito_tipo = 'nivel_anterior' THEN
        -- Check if previous level is completed
        IF EXISTS (
          SELECT 1 FROM public.user_trail_progress utp2
          JOIN public.trail_levels tl2 ON tl2.id = utp2.level_id
          WHERE utp2.user_id = v_user_id 
          AND tl2.nivel = v_nivel.nivel - 1
          AND utp2.status = 'completed'
        ) THEN
          v_atual := 1;
          v_objetivo := 1;
        END IF;
      ELSIF v_nivel.requisito_tipo = 'checkpoint' THEN
        -- Check checkpoint requirement
        IF v_current_checkpoint = 'distribuidor' OR (v_current_checkpoint = 'consultor' AND v_nivel.nivel <= 5) THEN
          v_atual := 1;
          v_objetivo := 1;
        END IF;
      END IF;

      -- Determine new status
      IF v_atual >= v_objetivo AND v_objetivo > 0 THEN
        v_novo_status := 'completed';
        
        -- Award rewards if just completed
        IF v_nivel.status != 'completed' THEN
          IF v_nivel.recompensa_diamantes > 0 THEN
            UPDATE public.user_progression
            SET diamantes = diamantes + v_nivel.recompensa_diamantes
            WHERE user_id = v_user_id;
          END IF;
          
          IF v_nivel.recompensa_xp > 0 THEN
            PERFORM add_points_to_user(
              v_user_id,
              v_nivel.recompensa_xp,
              'Nível completado: ' || v_nivel.titulo,
              'trilha',
              v_nivel.id
            );
          END IF;
        END IF;
      ELSIF v_atual > 0 AND v_objetivo > 0 THEN
        v_novo_status := 'in_progress';
      ELSIF v_nivel.nivel = 2 OR (v_nivel.requisito_tipo = 'nivel_anterior' AND v_atual >= v_objetivo) THEN
        v_novo_status := 'available';
      ELSE
        v_novo_status := 'locked';
      END IF;

      -- Update progress
      UPDATE public.user_trail_progress
      SET 
        status = v_novo_status,
        progresso_atual = v_atual,
        completed_at = CASE WHEN v_novo_status = 'completed' AND status != 'completed' THEN now() ELSE completed_at END,
        updated_at = now()
      WHERE user_id = v_user_id AND level_id = v_nivel.id;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Triggers for progression updates
CREATE TRIGGER trigger_update_progression_on_sale
  AFTER INSERT OR UPDATE ON public.visit_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progression();

CREATE TRIGGER trigger_update_progression_on_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progression();

CREATE TRIGGER trigger_update_progression_on_visit
  AFTER INSERT ON public.scheduled_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progression();

-- Trigger for updated_at
CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON public.user_progression
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_trail_progress_updated_at
  BEFORE UPDATE ON public.user_trail_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial trail levels
INSERT INTO public.trail_levels (nivel, tipo, titulo, descricao, icone, recompensa_xp, recompensa_diamantes, requisito_tipo, requisito_quantidade, ordem) VALUES
(1, 'task', 'Bem-vindo Graduado', 'Complete o tutorial de boas-vindas', 'Star', 10, 1, 'nivel_anterior', 0, 1),
(2, 'task', 'Preencha Lista de Visitas', 'Cadastre 10 leads no sistema', 'ClipboardList', 20, 2, 'leads', 10, 2),
(3, 'task', 'Marque uma Visita', 'Agende seu primeiro contato com um lead', 'Calendar', 15, 1, 'visitas', 1, 3),
(4, 'task', 'Realize sua Primeira Venda', 'Feche seu primeiro negócio', 'DollarSign', 50, 5, 'vendas', 1, 4),
(5, 'checkpoint', 'CONSULTOR', 'Atinja 10 vendas e torne-se Consultor', 'Trophy', 100, 10, 'vendas', 10, 5),
(6, 'task', 'Meta 50 Vendas', 'Continue vendendo e cresça sua carreira', 'TrendingUp', 150, 15, 'vendas', 50, 6),
(7, 'checkpoint', 'DISTRIBUIDOR', 'Atinja 100 vendas e torne-se Distribuidor Independente', 'Crown', 200, 25, 'vendas', 100, 7),
(8, 'task', 'Cadastre seus Produtos', 'Monte seu catálogo de produtos', 'Package', 30, 5, 'checkpoint', 1, 8),
(9, 'task', 'Cadastre Consultores', 'Construa sua equipe de vendas', 'Users', 40, 10, 'checkpoint', 1, 9),
(10, 'task', 'Acesse Relatórios', 'Acompanhe seu desempenho com relatórios detalhados', 'BarChart3', 50, 10, 'checkpoint', 1, 10);

-- Function to update streak (ofensiva)
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_progression
  SET 
    ofensiva_dias = CASE
      WHEN ultima_atividade::date = CURRENT_DATE - INTERVAL '1 day' THEN ofensiva_dias + 1
      WHEN ultima_atividade::date = CURRENT_DATE THEN ofensiva_dias
      ELSE 1
    END,
    updated_at = now()
  WHERE ultima_atividade IS NOT NULL;
END;
$$;