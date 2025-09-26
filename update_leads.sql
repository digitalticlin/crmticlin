-- SQL para atualizar todos os leads do usuário e75375eb-37a8-4afa-8fa3-1f13e4855439
UPDATE public.leads
SET
  kanban_stage_id = 'b7c39bd6-cfa9-4a7d-98d2-b8bad866deb4',
  funnel_id = 'af47dcaa-3981-407c-92c6-0b450fcb5de7'
WHERE created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439';