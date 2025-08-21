
-- Função para buscar campanhas do usuário (para contornar problema de tipos)
CREATE OR REPLACE FUNCTION public.get_user_broadcast_campaigns(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  message_text TEXT,
  media_type TEXT,
  media_url TEXT,
  target_type TEXT,
  target_config JSONB,
  schedule_type TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  total_recipients INTEGER,
  sent_count INTEGER,
  failed_count INTEGER,
  rate_limit_per_minute INTEGER,
  business_hours_only BOOLEAN,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.name,
    bc.message_text,
    bc.media_type,
    bc.media_url,
    bc.target_type,
    bc.target_config,
    bc.schedule_type,
    bc.scheduled_at,
    bc.status,
    bc.total_recipients,
    bc.sent_count,
    bc.failed_count,
    bc.rate_limit_per_minute,
    bc.business_hours_only,
    bc.timezone,
    bc.created_at,
    bc.updated_at
  FROM public.broadcast_campaigns bc
  WHERE bc.created_by_user_id = p_user_id
  ORDER BY bc.created_at DESC;
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION public.get_user_broadcast_campaigns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_broadcast_campaigns(UUID) TO service_role;
