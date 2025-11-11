--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'diretor',
    'gerente'
);


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'rascunho',
    'publicado',
    'arquivado'
);


--
-- Name: course_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_type AS ENUM (
    'ebook',
    'aula',
    'live',
    'teleaula'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'novo',
    'em_atendimento',
    'fechado',
    'perdido'
);


--
-- Name: message_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_direction AS ENUM (
    'in',
    'out'
);


--
-- Name: message_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_type AS ENUM (
    'text',
    'image',
    'document',
    'audio',
    'video'
);


--
-- Name: add_points_to_user(uuid, integer, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_points_to_user(p_user_id uuid, p_points integer, p_motivo text, p_categoria text, p_referencia_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_current_points integer;
  v_current_level integer;
  v_new_total integer;
  v_new_level integer;
BEGIN
  -- Inserir ou atualizar user_points
  INSERT INTO user_points (user_id, total_points, current_level)
  VALUES (p_user_id, p_points, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_points.total_points + p_points,
    updated_at = now()
  RETURNING total_points, current_level INTO v_new_total, v_current_level;

  -- Calcular novo nível (100 pontos por nível)
  v_new_level := FLOOR(v_new_total / 100) + 1;

  -- Atualizar nível se mudou
  IF v_new_level > v_current_level THEN
    UPDATE user_points
    SET 
      current_level = v_new_level,
      points_to_next_level = (v_new_level * 100) - v_new_total
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_points
    SET points_to_next_level = (v_current_level * 100) - v_new_total
    WHERE user_id = p_user_id;
  END IF;

  -- Registrar no histórico
  INSERT INTO points_history (user_id, pontos, motivo, categoria, referencia_id)
  VALUES (p_user_id, p_points, p_motivo, p_categoria, p_referencia_id);
END;
$$;


--
-- Name: auto_assign_first_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_assign_first_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: can_view_course(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_course(_user_id uuid, _course_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN course_role_permissions crp ON crp.role_id = ur.role_id
    WHERE ur.user_id = _user_id
      AND crp.course_id = _course_id
  ) OR has_role(_user_id, 'admin'::app_role);
$$;


--
-- Name: can_view_lead(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_lead(_viewer_id uuid, _responsavel_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (
    -- É admin
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _viewer_id AND role = 'admin')
    OR
    -- É o responsável
    _viewer_id = _responsavel_id
    OR
    -- É diretor e o responsável faz parte de sua equipe
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = _responsavel_id
      WHERE ur.user_id = _viewer_id 
      AND ur.role = 'diretor'
      AND (p.diretor_id = _viewer_id OR p.id = _viewer_id)
    )
    OR
    -- É gerente
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _viewer_id AND role = 'gerente')
  );
$$;


--
-- Name: can_view_profile(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (
    -- É admin
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _viewer_id AND role = 'admin')
    OR
    -- É o próprio usuário
    _viewer_id = _profile_id
    OR
    -- É diretor e o profile faz parte de sua equipe
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = _profile_id
      WHERE ur.user_id = _viewer_id 
      AND ur.role = 'diretor'
      AND (p.diretor_id = _viewer_id OR p.id = _viewer_id)
    )
    OR
    -- É gerente e está na mesma equipe
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles viewer_profile ON viewer_profile.id = _viewer_id
      JOIN public.profiles target_profile ON target_profile.id = _profile_id
      WHERE ur.user_id = _viewer_id 
      AND ur.role = 'gerente'
      AND viewer_profile.diretor_id = target_profile.diretor_id
    )
  );
$$;


--
-- Name: can_view_visit(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_visit(_viewer_id uuid, _especialista_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (
    -- É admin
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _viewer_id AND role = 'admin')
    OR
    -- É o próprio especialista
    _viewer_id = _especialista_id
    OR
    -- É diretor e o especialista faz parte de sua equipe
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = _especialista_id
      WHERE ur.user_id = _viewer_id 
      AND ur.role = 'diretor'
      AND p.diretor_id = _viewer_id
    )
  );
$$;


--
-- Name: check_and_grant_badges(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_and_grant_badges(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_badge RECORD;
  v_vendas_count integer;
  v_visitas_count integer;
  v_leads_count integer;
  v_nivel integer;
BEGIN
  -- Obter estatísticas do usuário
  SELECT COUNT(*) INTO v_vendas_count
  FROM visit_reports
  WHERE especialista_id = p_user_id AND venda_realizada = true;

  SELECT COUNT(*) INTO v_visitas_count
  FROM visit_reports
  WHERE especialista_id = p_user_id;

  SELECT COUNT(*) INTO v_leads_count
  FROM leads
  WHERE responsavel_id = p_user_id;

  SELECT current_level INTO v_nivel
  FROM user_points
  WHERE user_id = p_user_id;

  -- Verificar badges de vendas
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE tipo = 'vendas' AND is_active = true
  LOOP
    IF v_vendas_count >= v_badge.meta_valor THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Verificar badges de visitas
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE tipo = 'visitas' AND is_active = true
  LOOP
    IF v_visitas_count >= v_badge.meta_valor THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Verificar badges de leads
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE tipo = 'leads' AND is_active = true
  LOOP
    IF v_leads_count >= v_badge.meta_valor THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Verificar badges de nível
  FOR v_badge IN 
    SELECT * FROM badges 
    WHERE tipo = 'nivel' AND is_active = true
  LOOP
    IF v_nivel >= v_badge.meta_valor THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;


--
-- Name: generate_unique_link(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_link() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
END;
$$;


--
-- Name: get_team_ids(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_team_ids(_diretor_id uuid) RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT array_agg(id)
  FROM public.profiles
  WHERE diretor_id = _diretor_id OR id = _diretor_id;
$$;


--
-- Name: handle_lead_converted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_lead_converted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Se lead mudou para status convertido
  IF OLD.status != 'convertido' AND NEW.status = 'convertido' THEN
    IF NEW.responsavel_id IS NOT NULL THEN
      PERFORM add_points_to_user(
        NEW.responsavel_id,
        30,
        'Lead convertido: ' || NEW.nome,
        'lead',
        NEW.id
      );

      -- Verificar e conceder badges
      PERFORM check_and_grant_badges(NEW.responsavel_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_lead_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_lead_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Adicionar pontos pela captura de lead
  IF NEW.responsavel_id IS NOT NULL THEN
    PERFORM add_points_to_user(
      NEW.responsavel_id,
      5,
      'Novo lead capturado: ' || NEW.nome,
      'lead',
      NEW.id
    );

    -- Verificar e conceder badges
    PERFORM check_and_grant_badges(NEW.responsavel_id);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_visit_completed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_visit_completed() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
  -- Adicionar pontos pela visita completada
  PERFORM add_points_to_user(
    NEW.especialista_id,
    10,
    'Visita realizada',
    'visita',
    NEW.id
  );

  -- Se foi uma venda, adicionar pontos extras
  IF NEW.venda_realizada = true THEN
    PERFORM add_points_to_user(
      NEW.especialista_id,
      50,
      'Venda realizada: ' || COALESCE(NEW.valor_total::text, '0'),
      'venda',
      NEW.id
    );
    
    -- Pontos extras baseados no valor da venda (1 ponto a cada R$ 100)
    IF NEW.valor_total IS NOT NULL AND NEW.valor_total > 0 THEN
      PERFORM add_points_to_user(
        NEW.especialista_id,
        FLOOR(NEW.valor_total / 100)::integer,
        'Bônus por valor de venda',
        'venda',
        NEW.id
      );
    END IF;
  END IF;

  -- Verificar e conceder badges
  PERFORM check_and_grant_badges(NEW.especialista_id);

  RETURN NEW;
END;
$_$;


--
-- Name: handle_visit_updated(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_visit_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Se venda foi marcada como realizada agora
  IF OLD.venda_realizada = false AND NEW.venda_realizada = true THEN
    PERFORM add_points_to_user(
      NEW.especialista_id,
      50,
      'Venda realizada: ' || COALESCE(NEW.valor_total::text, '0'),
      'venda',
      NEW.id
    );
    
    -- Pontos extras baseados no valor da venda
    IF NEW.valor_total IS NOT NULL AND NEW.valor_total > 0 THEN
      PERFORM add_points_to_user(
        NEW.especialista_id,
        FLOOR(NEW.valor_total / 100)::integer,
        'Bônus por valor de venda',
        'venda',
        NEW.id
      );
    END IF;

    -- Verificar e conceder badges
    PERFORM check_and_grant_badges(NEW.especialista_id);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: has_any_role(uuid, public.app_role[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;


--
-- Name: has_module_permission(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_module_permission(_user_id uuid, _module_code text, _permission text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_module_permissions rmp ON rmp.role_id = ur.role_id
    JOIN modules m ON m.id = rmp.module_id
    WHERE ur.user_id = _user_id
      AND m.codigo = _module_code
      AND (
        (_permission = 'view' AND rmp.can_view = true) OR
        (_permission = 'create' AND rmp.can_create = true) OR
        (_permission = 'edit' AND rmp.can_edit = true) OR
        (_permission = 'delete' AND rmp.can_delete = true)
      )
  );
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


--
-- Name: initialize_user_points(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_user_points() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Para cada usuário que ainda não tem pontos
  FOR v_user IN 
    SELECT DISTINCT u.id 
    FROM auth.users u
    LEFT JOIN user_points up ON up.user_id = u.id
    WHERE up.user_id IS NULL
  LOOP
    INSERT INTO user_points (user_id, total_points, current_level)
    VALUES (v_user.id, 0, 1)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$;


--
-- Name: initialize_user_progression(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_user_progression() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: is_in_director_team(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_in_director_team(_user_id uuid, _target_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Retorna true se:
  -- 1. É o próprio usuário
  -- 2. O target_user é da equipe do diretor (diretor_id = _user_id)
  -- 3. É admin (tem acesso a tudo)
  SELECT (
    _user_id = _target_user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _target_user_id AND diretor_id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
  );
$$;


--
-- Name: notify_product_availability(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_product_availability() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_goals_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_goals_progress() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_goal RECORD;
  v_vendas_count integer;
  v_visitas_count integer;
  v_leads_count integer;
  v_is_completed boolean;
BEGIN
  -- Atualizar metas individuais do usuário
  FOR v_goal IN 
    SELECT * FROM goals 
    WHERE (user_id = NEW.especialista_id OR user_id = NEW.responsavel_id)
      AND status = 'ativa'
      AND data_inicio <= CURRENT_DATE 
      AND data_fim >= CURRENT_DATE
  LOOP
    v_is_completed := false;

    -- Verificar categoria da meta
    IF v_goal.categoria = 'vendas' AND NEW.venda_realizada = true THEN
      -- Contar vendas do usuário no período
      SELECT COUNT(*) INTO v_vendas_count
      FROM visit_reports
      WHERE especialista_id = v_goal.user_id
        AND venda_realizada = true
        AND created_at >= v_goal.data_inicio
        AND created_at <= v_goal.data_fim;

      UPDATE goals
      SET 
        valor_atual = v_vendas_count,
        status = CASE WHEN v_vendas_count >= meta_valor THEN 'concluida' ELSE status END
      WHERE id = v_goal.id;

      v_is_completed := v_vendas_count >= v_goal.meta_valor;

    ELSIF v_goal.categoria = 'visitas' THEN
      -- Contar visitas do usuário no período
      SELECT COUNT(*) INTO v_visitas_count
      FROM visit_reports
      WHERE especialista_id = v_goal.user_id
        AND created_at >= v_goal.data_inicio
        AND created_at <= v_goal.data_fim;

      UPDATE goals
      SET 
        valor_atual = v_visitas_count,
        status = CASE WHEN v_visitas_count >= meta_valor THEN 'concluida' ELSE status END
      WHERE id = v_goal.id;

      v_is_completed := v_visitas_count >= v_goal.meta_valor;

    ELSIF v_goal.categoria = 'leads' THEN
      -- Contar leads do usuário no período
      SELECT COUNT(*) INTO v_leads_count
      FROM leads
      WHERE responsavel_id = v_goal.user_id
        AND created_at >= v_goal.data_inicio
        AND created_at <= v_goal.data_fim;

      UPDATE goals
      SET 
        valor_atual = v_leads_count,
        status = CASE WHEN v_leads_count >= meta_valor THEN 'concluida' ELSE status END
      WHERE id = v_goal.id;

      v_is_completed := v_leads_count >= v_goal.meta_valor;
    END IF;

    -- Se meta foi completada, dar pontos de recompensa
    IF v_is_completed AND v_goal.status = 'ativa' THEN
      PERFORM add_points_to_user(
        v_goal.user_id,
        v_goal.pontos_recompensa,
        'Meta concluída: ' || v_goal.titulo,
        'meta',
        v_goal.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


--
-- Name: update_product_order_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_product_order_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_progression(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_progression() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_user_streak(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_streak() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    acao text NOT NULL,
    alvo_tipo text,
    alvo_id uuid,
    detalhes jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    icone text NOT NULL,
    cor text DEFAULT '#3b82f6'::text,
    pontos_necessarios integer,
    tipo text NOT NULL,
    meta_valor integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    nome text NOT NULL,
    telefone text NOT NULL,
    email text,
    cidade text,
    experiencia text,
    disponibilidade text,
    observacoes text,
    status text DEFAULT 'novo'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: course_role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    tipo public.course_type NOT NULL,
    status public.course_status DEFAULT 'rascunho'::public.course_status NOT NULL,
    conteudo_url text,
    duracao_minutos integer,
    data_live timestamp with time zone,
    autor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo text NOT NULL,
    categoria text NOT NULL,
    meta_valor numeric NOT NULL,
    valor_atual numeric DEFAULT 0,
    unidade text DEFAULT 'unidades'::text,
    pontos_recompensa integer DEFAULT 0,
    premio_descricao text,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    user_id uuid,
    diretor_id uuid,
    status text DEFAULT 'ativa'::text,
    is_recurring boolean DEFAULT false,
    recurrence_period text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lead_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tags (
    lead_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    telefone text NOT NULL,
    origem text DEFAULT 'whatsapp'::text,
    status public.lead_status DEFAULT 'novo'::public.lead_status NOT NULL,
    responsavel_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    direction public.message_direction NOT NULL,
    tipo public.message_type DEFAULT 'text'::public.message_type NOT NULL,
    conteudo text,
    media_url text,
    autor_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_length_limit CHECK ((length(conteudo) <= 10000))
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    codigo text NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    autor_id uuid NOT NULL,
    texto text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    unique_link text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: points_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pontos integer NOT NULL,
    motivo text NOT NULL,
    categoria text NOT NULL,
    referencia_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: product_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    notified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    notified_at timestamp with time zone
);


--
-- Name: product_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    valor_unitario numeric(10,2) NOT NULL,
    valor_total numeric(10,2) NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    observacoes text,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    motivo_rejeicao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_requests_quantidade_check CHECK ((quantidade > 0)),
    CONSTRAINT product_requests_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'entregue'::text, 'cancelado'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    preco_venda numeric(10,2) NOT NULL,
    categoria text,
    imagem_url text,
    disponibilidade text DEFAULT 'pronta_entrega'::text,
    estrelas integer DEFAULT 0,
    total_pedidos integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_disponibilidade_check CHECK ((disponibilidade = ANY (ARRAY['pronta_entrega'::text, 'entrega_7_dias'::text]))),
    CONSTRAINT products_estrelas_check CHECK (((estrelas >= 0) AND (estrelas <= 5)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    diretor_id uuid
);


--
-- Name: reward_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    pontos_gastos integer NOT NULL,
    status text DEFAULT 'pendente'::text,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    custo_pontos integer NOT NULL,
    tipo text NOT NULL,
    quantidade_disponivel integer,
    imagem_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_module_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_module_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    module_id uuid NOT NULL,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: scheduled_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    data_visita timestamp with time zone NOT NULL,
    observacoes text,
    status text DEFAULT 'agendada'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scheduled_visits_status_check CHECK ((status = ANY (ARRAY['agendada'::text, 'realizada'::text, 'cancelada'::text])))
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    chave text NOT NULL,
    valor jsonb NOT NULL,
    descricao text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shopping_cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopping_cart (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shopping_cart_quantidade_check CHECK ((quantidade > 0))
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cor text DEFAULT '#3b82f6'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trail_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trail_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nivel integer NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    icone text NOT NULL,
    recompensa_xp integer DEFAULT 0,
    recompensa_diamantes integer DEFAULT 0,
    requisito_tipo text,
    requisito_quantidade integer DEFAULT 0,
    ordem integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT trail_levels_requisito_tipo_check CHECK ((requisito_tipo = ANY (ARRAY['vendas'::text, 'visitas'::text, 'leads'::text, 'nivel_anterior'::text, 'checkpoint'::text]))),
    CONSTRAINT trail_levels_tipo_check CHECK ((tipo = ANY (ARRAY['task'::text, 'checkpoint'::text])))
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    conquistado_em timestamp with time zone DEFAULT now()
);


--
-- Name: user_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    points_to_next_level integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_progression; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_progression (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_checkpoint text DEFAULT 'graduado'::text NOT NULL,
    nivel_atual integer DEFAULT 1 NOT NULL,
    vendas_totais integer DEFAULT 0 NOT NULL,
    visitas_completadas integer DEFAULT 0 NOT NULL,
    leads_cadastrados integer DEFAULT 0 NOT NULL,
    diamantes integer DEFAULT 0 NOT NULL,
    vidas integer DEFAULT 5 NOT NULL,
    ofensiva_dias integer DEFAULT 0 NOT NULL,
    ultima_atividade timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role_id uuid
);


--
-- Name: user_trail_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_trail_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    level_id uuid NOT NULL,
    status text DEFAULT 'locked'::text NOT NULL,
    progresso_atual integer DEFAULT 0,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_trail_progress_status_check CHECK ((status = ANY (ARRAY['locked'::text, 'available'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: visit_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visit_report_id uuid NOT NULL,
    descricao text NOT NULL,
    quantidade integer NOT NULL,
    valor_unitario numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT visit_items_quantidade_check CHECK ((quantidade > 0)),
    CONSTRAINT visit_items_valor_unitario_check CHECK ((valor_unitario >= (0)::numeric))
);


--
-- Name: visit_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    data_visita timestamp with time zone NOT NULL,
    km_percorrido numeric(10,2),
    venda_realizada boolean DEFAULT false NOT NULL,
    forma_pagamento text,
    valor_total numeric(10,2) DEFAULT 0,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT visit_reports_forma_pagamento_check CHECK ((forma_pagamento = ANY (ARRAY['dinheiro'::text, 'cartao_credito'::text, 'cartao_debito'::text, 'pix'::text, 'boleto'::text])))
);


--
-- Name: whatsapp_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    instance_name text NOT NULL,
    evolution_api_url text NOT NULL,
    api_key text NOT NULL,
    status text DEFAULT 'disconnected'::text NOT NULL,
    qr_code text,
    phone_number text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: course_role_permissions course_role_permissions_course_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_role_permissions
    ADD CONSTRAINT course_role_permissions_course_id_role_id_key UNIQUE (course_id, role_id);


--
-- Name: course_role_permissions course_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_role_permissions
    ADD CONSTRAINT course_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: lead_tags lead_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_pkey PRIMARY KEY (lead_id, tag_id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leads leads_telefone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_telefone_key UNIQUE (telefone);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: modules modules_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_codigo_key UNIQUE (codigo);


--
-- Name: modules modules_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_nome_key UNIQUE (nome);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_unique_link_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_unique_link_key UNIQUE (unique_link);


--
-- Name: points_history points_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history
    ADD CONSTRAINT points_history_pkey PRIMARY KEY (id);


--
-- Name: product_notifications product_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_notifications
    ADD CONSTRAINT product_notifications_pkey PRIMARY KEY (id);


--
-- Name: product_notifications product_notifications_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_notifications
    ADD CONSTRAINT product_notifications_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: product_requests product_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_requests
    ADD CONSTRAINT product_requests_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reward_redemptions reward_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: role_module_permissions role_module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_module_permissions
    ADD CONSTRAINT role_module_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_module_permissions role_module_permissions_role_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_module_permissions
    ADD CONSTRAINT role_module_permissions_role_id_module_id_key UNIQUE (role_id, module_id);


--
-- Name: roles roles_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nome_key UNIQUE (nome);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: scheduled_visits scheduled_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_visits
    ADD CONSTRAINT scheduled_visits_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (chave);


--
-- Name: shopping_cart shopping_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_pkey PRIMARY KEY (id);


--
-- Name: shopping_cart shopping_cart_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: tags tags_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_nome_key UNIQUE (nome);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: trail_levels trail_levels_nivel_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trail_levels
    ADD CONSTRAINT trail_levels_nivel_key UNIQUE (nivel);


--
-- Name: trail_levels trail_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trail_levels
    ADD CONSTRAINT trail_levels_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- Name: user_points user_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_pkey PRIMARY KEY (id);


--
-- Name: user_points user_points_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_user_id_key UNIQUE (user_id);


--
-- Name: user_progression user_progression_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progression
    ADD CONSTRAINT user_progression_pkey PRIMARY KEY (id);


--
-- Name: user_progression user_progression_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progression
    ADD CONSTRAINT user_progression_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_trail_progress user_trail_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trail_progress
    ADD CONSTRAINT user_trail_progress_pkey PRIMARY KEY (id);


--
-- Name: user_trail_progress user_trail_progress_user_id_level_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trail_progress
    ADD CONSTRAINT user_trail_progress_user_id_level_id_key UNIQUE (user_id, level_id);


--
-- Name: visit_items visit_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_items
    ADD CONSTRAINT visit_items_pkey PRIMARY KEY (id);


--
-- Name: visit_reports visit_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_reports
    ADD CONSTRAINT visit_reports_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_connections whatsapp_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_connections whatsapp_connections_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_key UNIQUE (user_id);


--
-- Name: idx_courses_autor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_autor_id ON public.courses USING btree (autor_id);


--
-- Name: idx_courses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_created_at ON public.courses USING btree (created_at DESC);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_courses_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_tipo ON public.courses USING btree (tipo);


--
-- Name: idx_product_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_notifications_user ON public.product_notifications USING btree (user_id);


--
-- Name: idx_product_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_requests_status ON public.product_requests USING btree (status);


--
-- Name: idx_product_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_requests_user ON public.product_requests USING btree (user_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_categoria ON public.products USING btree (categoria);


--
-- Name: idx_products_estrelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_estrelas ON public.products USING btree (estrelas DESC);


--
-- Name: idx_profiles_diretor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_diretor_id ON public.profiles USING btree (diretor_id);


--
-- Name: idx_scheduled_visits_especialista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_visits_especialista ON public.scheduled_visits USING btree (especialista_id);


--
-- Name: idx_scheduled_visits_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_visits_lead ON public.scheduled_visits USING btree (lead_id);


--
-- Name: idx_shopping_cart_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shopping_cart_user ON public.shopping_cart USING btree (user_id);


--
-- Name: idx_visit_items_report; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_items_report ON public.visit_items USING btree (visit_report_id);


--
-- Name: idx_visit_reports_especialista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_reports_especialista ON public.visit_reports USING btree (especialista_id);


--
-- Name: idx_visit_reports_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_reports_lead ON public.visit_reports USING btree (lead_id);


--
-- Name: profiles auto_assign_first_admin_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_assign_first_admin_trigger AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_assign_first_admin();


--
-- Name: products on_product_availability_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_product_availability_change AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.notify_product_availability();


--
-- Name: user_points trigger_initialize_user_progression; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_initialize_user_progression AFTER INSERT ON public.user_points FOR EACH ROW EXECUTE FUNCTION public.initialize_user_progression();


--
-- Name: leads trigger_lead_converted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_lead_converted AFTER UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_lead_converted();


--
-- Name: leads trigger_lead_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_lead_created AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_lead_created();


--
-- Name: leads trigger_update_goals_on_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_goals_on_lead AFTER INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_goals_progress();


--
-- Name: visit_reports trigger_update_goals_on_visit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_goals_on_visit AFTER INSERT OR UPDATE ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.update_goals_progress();


--
-- Name: leads trigger_update_progression_on_lead; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_progression_on_lead AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_user_progression();


--
-- Name: visit_reports trigger_update_progression_on_sale; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_progression_on_sale AFTER INSERT OR UPDATE ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.update_user_progression();


--
-- Name: scheduled_visits trigger_update_progression_on_visit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_progression_on_visit AFTER INSERT ON public.scheduled_visits FOR EACH ROW EXECUTE FUNCTION public.update_user_progression();


--
-- Name: visit_reports trigger_visit_completed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_visit_completed AFTER INSERT ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.handle_visit_completed();


--
-- Name: visit_reports trigger_visit_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_visit_updated AFTER UPDATE ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.handle_visit_updated();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_requests update_product_orders_on_approval; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_orders_on_approval AFTER INSERT OR UPDATE ON public.product_requests FOR EACH ROW EXECUTE FUNCTION public.update_product_order_count();


--
-- Name: product_requests update_product_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_requests_updated_at BEFORE UPDATE ON public.product_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_visits update_scheduled_visits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_visits_updated_at BEFORE UPDATE ON public.scheduled_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shopping_cart update_shopping_cart_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shopping_cart_updated_at BEFORE UPDATE ON public.shopping_cart FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_progression update_user_progression_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_progression_updated_at BEFORE UPDATE ON public.user_progression FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_trail_progress update_user_trail_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_trail_progress_updated_at BEFORE UPDATE ON public.user_trail_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: visit_reports update_visit_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_visit_reports_updated_at BEFORE UPDATE ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: whatsapp_connections update_whatsapp_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: candidates candidates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: course_role_permissions course_role_permissions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_role_permissions
    ADD CONSTRAINT course_role_permissions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_role_permissions course_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_role_permissions
    ADD CONSTRAINT course_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: courses courses_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_diretor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lead_tags lead_tags_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_tags lead_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: leads leads_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id);


--
-- Name: messages messages_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id);


--
-- Name: messages messages_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: notes notes_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id);


--
-- Name: notes notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: points_history points_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history
    ADD CONSTRAINT points_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_notifications product_notifications_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_notifications
    ADD CONSTRAINT product_notifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_notifications product_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_notifications
    ADD CONSTRAINT product_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_requests product_requests_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_requests
    ADD CONSTRAINT product_requests_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: product_requests product_requests_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_requests
    ADD CONSTRAINT product_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_requests product_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_requests
    ADD CONSTRAINT product_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_diretor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions reward_redemptions_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: reward_redemptions reward_redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions reward_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: role_module_permissions role_module_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_module_permissions
    ADD CONSTRAINT role_module_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: role_module_permissions role_module_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_module_permissions
    ADD CONSTRAINT role_module_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: scheduled_visits scheduled_visits_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_visits
    ADD CONSTRAINT scheduled_visits_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: scheduled_visits scheduled_visits_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_visits
    ADD CONSTRAINT scheduled_visits_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: shopping_cart shopping_cart_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shopping_cart shopping_cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_points user_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_progression user_progression_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progression
    ADD CONSTRAINT user_progression_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_trail_progress user_trail_progress_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trail_progress
    ADD CONSTRAINT user_trail_progress_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.trail_levels(id) ON DELETE CASCADE;


--
-- Name: user_trail_progress user_trail_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trail_progress
    ADD CONSTRAINT user_trail_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visit_items visit_items_visit_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_items
    ADD CONSTRAINT visit_items_visit_report_id_fkey FOREIGN KEY (visit_report_id) REFERENCES public.visit_reports(id) ON DELETE CASCADE;


--
-- Name: visit_reports visit_reports_especialista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_reports
    ADD CONSTRAINT visit_reports_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: visit_reports visit_reports_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_reports
    ADD CONSTRAINT visit_reports_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: whatsapp_connections whatsapp_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leads Admin can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: badges Admin can manage badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage badges" ON public.badges USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_role_permissions Admin can manage course permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage course permissions" ON public.course_role_permissions USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: modules Admin can manage modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage modules" ON public.modules USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: role_module_permissions Admin can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage permissions" ON public.role_module_permissions USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admin can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage products" ON public.products TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: rewards Admin can manage rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage rewards" ON public.rewards USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: roles Admin can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage roles" ON public.roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: settings Admin can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage settings" ON public.settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: trail_levels Admin can manage trail levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage trail levels" ON public.trail_levels TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: courses Admin e Diretor podem criar cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin e Diretor podem criar cursos" ON public.courses FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'diretor'::public.app_role]));


--
-- Name: courses Admin pode deletar cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode deletar cursos" ON public.courses FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: candidates Admin pode gerenciar candidatos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode gerenciar candidatos" ON public.candidates USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: organizations Admin pode gerenciar organizações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode gerenciar organizações" ON public.organizations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: candidates Admin pode visualizar candidatos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode visualizar candidatos" ON public.candidates FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notes Authenticated users can insert notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert notes" ON public.notes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = autor_id));


--
-- Name: lead_tags Authenticated users can view lead tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view lead tags" ON public.lead_tags FOR SELECT TO authenticated USING (true);


--
-- Name: messages Authenticated users can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated USING (true);


--
-- Name: notes Authenticated users can view notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view notes" ON public.notes FOR SELECT TO authenticated USING (true);


--
-- Name: settings Authenticated users can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);


--
-- Name: tags Authenticated users can view tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view tags" ON public.tags FOR SELECT TO authenticated USING (true);


--
-- Name: visit_items Authenticated users can view visit items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view visit items" ON public.visit_items FOR SELECT TO authenticated USING (true);


--
-- Name: courses Autor, Admin e Diretor podem atualizar cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor, Admin e Diretor podem atualizar cursos" ON public.courses FOR UPDATE USING (((auth.uid() = autor_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'diretor'::public.app_role])));


--
-- Name: products Everyone can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active products" ON public.products FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: rewards Everyone can view active rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active rewards" ON public.rewards FOR SELECT USING ((is_active = true));


--
-- Name: trail_levels Everyone can view active trail levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active trail levels" ON public.trail_levels FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: badges Everyone can view badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT USING ((is_active = true));


--
-- Name: course_role_permissions Everyone can view course permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view course permissions" ON public.course_role_permissions FOR SELECT USING (true);


--
-- Name: modules Everyone can view modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view modules" ON public.modules FOR SELECT USING (true);


--
-- Name: role_module_permissions Everyone can view permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view permissions" ON public.role_module_permissions FOR SELECT USING (true);


--
-- Name: roles Everyone can view roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view roles" ON public.roles FOR SELECT USING (true);


--
-- Name: lead_tags Gerente and Admin can delete lead tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can delete lead tags" ON public.lead_tags FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: lead_tags Gerente and Admin can insert lead tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can insert lead tags" ON public.lead_tags FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: leads Gerente and Admin can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: messages Gerente and Admin can insert messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: tags Gerente and Admin can insert tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: leads Gerente and Admin can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can update leads" ON public.leads FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: tags Gerente and Admin can update tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gerente and Admin can update tags" ON public.tags FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: goals Managers can create goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can create goals" ON public.goals FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role, 'diretor'::public.app_role]));


--
-- Name: scheduled_visits Managers can insert scheduled visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can insert scheduled visits" ON public.scheduled_visits FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: product_requests Managers can update all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update all requests" ON public.product_requests FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role]));


--
-- Name: goals Managers can update goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update goals" ON public.goals FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role, 'diretor'::public.app_role]));


--
-- Name: reward_redemptions Managers can update redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update redemptions" ON public.reward_redemptions FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role]));


--
-- Name: scheduled_visits Managers can update scheduled visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update scheduled visits" ON public.scheduled_visits FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: visit_reports Managers can update visit reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update visit reports" ON public.visit_reports FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]));


--
-- Name: reward_redemptions Managers can view all redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view all redemptions" ON public.reward_redemptions FOR SELECT USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role]));


--
-- Name: points_history Managers can view team points history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view team points history" ON public.points_history FOR SELECT USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role, 'diretor'::public.app_role]));


--
-- Name: user_trail_progress Managers can view team progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view team progress" ON public.user_trail_progress FOR SELECT TO authenticated USING ((public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role]) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_trail_progress.user_id) AND (p.diretor_id = auth.uid()))))));


--
-- Name: user_progression Managers can view team progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view team progression" ON public.user_progression FOR SELECT TO authenticated USING ((public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role]) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_progression.user_id) AND (p.diretor_id = auth.uid()))))));


--
-- Name: candidates Public can insert for valid orgs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert for valid orgs" ON public.candidates FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE (organizations.id = candidates.organization_id))));


--
-- Name: organizations Qualquer um pode visualizar organizações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer um pode visualizar organizações" ON public.organizations FOR SELECT USING (true);


--
-- Name: visit_reports Specialists can insert own visit reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Specialists can insert own visit reports" ON public.visit_reports FOR INSERT TO authenticated WITH CHECK (((auth.uid() = especialista_id) OR public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role])));


--
-- Name: courses Todos podem visualizar cursos publicados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar cursos publicados" ON public.courses FOR SELECT USING (((status = 'publicado'::public.course_status) OR (auth.uid() = autor_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'diretor'::public.app_role])));


--
-- Name: product_requests Users can create own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own requests" ON public.product_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: reward_redemptions Users can create redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: whatsapp_connections Users can delete own whatsapp connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own whatsapp connection" ON public.whatsapp_connections FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: audit_logs Users can insert own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: whatsapp_connections Users can insert own whatsapp connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own whatsapp connection" ON public.whatsapp_connections FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: visit_items Users can insert visit items for their reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert visit items for their reports" ON public.visit_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.visit_reports
  WHERE ((visit_reports.id = visit_items.visit_report_id) AND ((visit_reports.especialista_id = auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['gerente'::public.app_role, 'admin'::public.app_role]))))));


--
-- Name: shopping_cart Users can manage own cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own cart" ON public.shopping_cart TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_notifications Users can manage own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own notifications" ON public.product_notifications TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notes Users can update own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE TO authenticated USING ((auth.uid() = autor_id));


--
-- Name: product_requests Users can update own pending requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pending requests" ON public.product_requests FOR UPDATE TO authenticated USING (((auth.uid() = user_id) AND (status = 'pendente'::text)));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: user_trail_progress Users can update own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own progress" ON public.user_trail_progress FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_progression Users can update own progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own progression" ON public.user_progression FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: whatsapp_connections Users can update own whatsapp connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own whatsapp connection" ON public.whatsapp_connections FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: leads Users can view accessible leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible leads" ON public.leads FOR SELECT TO authenticated USING (public.can_view_lead(auth.uid(), responsavel_id));


--
-- Name: profiles Users can view accessible profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible profiles" ON public.profiles FOR SELECT TO authenticated USING (public.can_view_profile(auth.uid(), id));


--
-- Name: scheduled_visits Users can view accessible scheduled visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible scheduled visits" ON public.scheduled_visits FOR SELECT TO authenticated USING (public.can_view_visit(auth.uid(), especialista_id));


--
-- Name: visit_reports Users can view accessible visit reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view accessible visit reports" ON public.visit_reports FOR SELECT TO authenticated USING (public.can_view_visit(auth.uid(), especialista_id));


--
-- Name: audit_logs Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_badges Users can view own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: goals Users can view own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (((auth.uid() = user_id) OR (tipo = 'geral'::text) OR ((diretor_id = auth.uid()) AND (tipo = 'equipe'::text)) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role])));


--
-- Name: user_points Users can view own points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: points_history Users can view own points history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own points history" ON public.points_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_trail_progress Users can view own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own progress" ON public.user_trail_progress FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_progression Users can view own progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own progression" ON public.user_progression FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: reward_redemptions Users can view own redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: product_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.product_requests FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role])));


--
-- Name: whatsapp_connections Users can view own whatsapp connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own whatsapp connection" ON public.whatsapp_connections FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can view team badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team badges" ON public.user_badges FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_badges.user_id) AND (p.diretor_id = auth.uid())))) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role])));


--
-- Name: user_points Users can view team points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team points" ON public.user_points FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = user_points.user_id) AND ((p.diretor_id = auth.uid()) OR (auth.uid() = user_points.user_id))))) OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'gerente'::public.app_role])));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: candidates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

--
-- Name: course_role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: points_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

--
-- Name: product_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: product_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: role_module_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: shopping_cart; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: trail_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trail_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

--
-- Name: user_progression; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_trail_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_trail_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: visit_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visit_items ENABLE ROW LEVEL SECURITY;

--
-- Name: visit_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


