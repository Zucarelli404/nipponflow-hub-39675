
-- Migration: 20251016154414
-- Plataforma Genius - Nipponflex
-- Database schema with RBAC and authentication

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'diretor', 'gerente');

-- 2. Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_atendimento', 'fechado', 'perdido');

-- 3. Create enum for message direction
CREATE TYPE public.message_direction AS ENUM ('in', 'out');

-- 4. Create enum for message type
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'document', 'audio', 'video');

-- 5. User roles table (following security best practices - roles separate from users)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- 6. Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  origem TEXT DEFAULT 'whatsapp',
  status public.lead_status DEFAULT 'novo' NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  direction public.message_direction NOT NULL,
  tipo public.message_type DEFAULT 'text' NOT NULL,
  conteudo TEXT,
  media_url TEXT,
  autor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  autor_id UUID REFERENCES auth.users(id) NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Lead tags junction table
CREATE TABLE public.lead_tags (
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (lead_id, tag_id)
);

-- 12. Settings table (for EvolutionAPI and other configs)
CREATE TABLE public.settings (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13. Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  alvo_tipo TEXT,
  alvo_id UUID,
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Security definer function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: Users can view all, update own
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles: Only admins can manage roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Leads: All authenticated users can view, gerente and admin can modify
CREATE POLICY "Authenticated users can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerente and Admin can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

CREATE POLICY "Gerente and Admin can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

CREATE POLICY "Admin can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Messages: All authenticated users can view, gerente and admin can insert
CREATE POLICY "Authenticated users can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerente and Admin can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

-- Notes: All authenticated users can view, users can insert/update own notes
CREATE POLICY "Authenticated users can view notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = autor_id);

-- Tags: All can view, gerente and admin can manage
CREATE POLICY "Authenticated users can view tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerente and Admin can insert tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

CREATE POLICY "Gerente and Admin can update tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

-- Lead tags: All can view, gerente and admin can manage
CREATE POLICY "Authenticated users can view lead tags"
  ON public.lead_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerente and Admin can insert lead tags"
  ON public.lead_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

CREATE POLICY "Gerente and Admin can delete lead tags"
  ON public.lead_tags FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerente', 'admin']::public.app_role[]));

-- Settings: All can view, only admin can manage
CREATE POLICY "Authenticated users can view settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit logs: All can view own logs, admin can view all
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default tags
INSERT INTO public.tags (nome, cor) VALUES
  ('Interessado', '#10b981'),
  ('Orçamento', '#f59e0b'),
  ('Urgente', '#ef4444'),
  ('Seguimento', '#3b82f6'),
  ('Qualificado', '#8b5cf6');

-- Enable realtime for messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
