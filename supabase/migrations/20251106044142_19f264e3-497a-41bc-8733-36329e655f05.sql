-- Atualizar o nível 6 para ser um checkpoint "Consultor Avançado"
UPDATE public.trail_levels
SET 
  tipo = 'checkpoint',
  titulo = 'CONSULTOR AVANÇADO',
  descricao = 'Atinja 50 vendas e torne-se Consultor Avançado',
  icone = 'Award',
  recompensa_diamantes = 20,
  recompensa_xp = 150
WHERE nivel = 6;

-- Atualizar o status dos usuários existentes que já atingiram 50 vendas
UPDATE public.user_trail_progress utp
SET status = 'completed', completed_at = now()
FROM public.user_progression up
WHERE utp.level_id = (SELECT id FROM public.trail_levels WHERE nivel = 6)
  AND up.user_id = utp.user_id
  AND up.vendas_totais >= 50
  AND utp.status != 'completed';