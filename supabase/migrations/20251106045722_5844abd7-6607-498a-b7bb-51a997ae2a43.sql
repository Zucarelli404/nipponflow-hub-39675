-- Initialize user_progression for existing users who have user_points but no progression
INSERT INTO public.user_progression (user_id)
SELECT DISTINCT up.user_id
FROM public.user_points up
LEFT JOIN public.user_progression uprg ON uprg.user_id = up.user_id
WHERE uprg.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Initialize user_trail_progress for all users with user_points
INSERT INTO public.user_trail_progress (user_id, level_id, status, progresso_atual)
SELECT 
  up.user_id,
  tl.id,
  CASE 
    WHEN tl.nivel = 1 THEN 'completed'
    WHEN tl.nivel = 2 THEN 'available'
    ELSE 'locked'
  END,
  CASE WHEN tl.nivel = 1 THEN tl.requisito_quantidade ELSE 0 END
FROM public.user_points up
CROSS JOIN public.trail_levels tl
WHERE tl.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.user_trail_progress utp 
  WHERE utp.user_id = up.user_id AND utp.level_id = tl.id
)
ON CONFLICT (user_id, level_id) DO NOTHING;

-- Mark level 1 as completed for all users
UPDATE public.user_trail_progress
SET status = 'completed', completed_at = now()
WHERE level_id = (SELECT id FROM public.trail_levels WHERE nivel = 1)
AND status != 'completed';