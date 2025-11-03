# Instruções de Migration - Sistema de Candidatos

Para implementar o novo sistema de formulários de candidatos com links únicos, você precisa executar o SQL abaixo no seu banco de dados.

## Como Executar

1. Acesse o backend do projeto
2. Vá até a seção de SQL Editor ou Database
3. Cole e execute o código SQL abaixo

## Código SQL

```sql
-- Create organizations table with unique links
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  unique_link text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Authenticated users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage organizations"
  ON public.organizations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add new fields to candidates table for the detailed questionnaire
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS idade integer,
  ADD COLUMN IF NOT EXISTS casado boolean,
  ADD COLUMN IF NOT EXISTS tem_filhos boolean,
  ADD COLUMN IF NOT EXISTS nasceu_regiao boolean,
  ADD COLUMN IF NOT EXISTS tempo_regiao text,
  ADD COLUMN IF NOT EXISTS familia_regiao boolean,
  ADD COLUMN IF NOT EXISTS experiencia_comercial boolean,
  ADD COLUMN IF NOT EXISTS nota_gostar_pessoas integer CHECK (nota_gostar_pessoas BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS nota_proatividade integer CHECK (nota_proatividade BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS nota_ambicao integer CHECK (nota_ambicao BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS maior_renda_mensal numeric,
  ADD COLUMN IF NOT EXISTS renda_desejada numeric,
  ADD COLUMN IF NOT EXISTS nota_ensinavel integer CHECK (nota_ensinavel BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS situacao_emprego text,
  ADD COLUMN IF NOT EXISTS disponibilidade_horario jsonb,
  ADD COLUMN IF NOT EXISTS tempo_desempregado text,
  ADD COLUMN IF NOT EXISTS como_soube text;

-- Update RLS policies for candidates to allow public access with organization link
CREATE POLICY "Public can insert candidates with organization link"
  ON public.candidates FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NOT NULL);

-- Function to generate unique link
CREATE OR REPLACE FUNCTION generate_unique_link()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_link text;
  link_exists boolean;
BEGIN
  LOOP
    new_link := encode(gen_random_bytes(8), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE unique_link = new_link) INTO link_exists;
    EXIT WHEN NOT link_exists;
  END LOOP;
  RETURN new_link;
END;
$$;

-- Insert a default organization if none exists
INSERT INTO public.organizations (nome, unique_link)
VALUES ('Organização Principal', generate_unique_link())
ON CONFLICT (unique_link) DO NOTHING;
```

## O que foi criado

1. **Tabela `organizations`**: Armazena as organizações e seus links únicos
2. **Novos campos na tabela `candidates`**: Todos os campos do questionário detalhado
3. **Políticas RLS**: Permissões de acesso público para inserção de candidatos
4. **Função `generate_unique_link()`**: Gera links únicos automaticamente
5. **Organização padrão**: Criada automaticamente

## Próximos Passos

Após executar a migration:
1. Acesse Configurações > Links no sistema
2. Crie novas organizações conforme necessário
3. Compartilhe os links de candidatura gerados
4. Os candidatos poderão preencher o formulário completo via link público
