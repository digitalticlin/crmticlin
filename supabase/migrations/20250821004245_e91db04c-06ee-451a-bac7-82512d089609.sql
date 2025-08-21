
-- =====================================================
-- SISTEMA DE DISPAROS EM MASSA - IMPLEMENTAÇÃO COMPLETA
-- =====================================================

-- 1. Criar tabela de campanhas de broadcast
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'funnel', 'stage', 'tags', 'custom')),
  target_config JSONB DEFAULT '{}',
  schedule_type TEXT DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 2,
  business_hours_only BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de fila de disparos
CREATE TABLE IF NOT EXISTS public.broadcast_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  contact_name TEXT,
  message_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'retry')),
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  external_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de histórico de disparos
CREATE TABLE IF NOT EXISTS public.broadcast_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES public.broadcast_queue(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  external_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de controle de rate limit
CREATE TABLE IF NOT EXISTS public.broadcast_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  messages_sent_current_minute INTEGER DEFAULT 0,
  current_minute TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('minute', NOW()),
  total_messages_today INTEGER DEFAULT 0,
  current_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, current_minute)
);

-- 5. Adicionar RLS às tabelas
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para broadcast_campaigns
CREATE POLICY "Users can manage their own campaigns" 
  ON public.broadcast_campaigns FOR ALL 
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Service role can access all campaigns"
  ON public.broadcast_campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Criar políticas RLS para broadcast_queue
CREATE POLICY "Users can view their campaign queue"
  ON public.broadcast_queue FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM public.broadcast_campaigns 
    WHERE created_by_user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all queue"
  ON public.broadcast_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Criar políticas RLS para broadcast_history
CREATE POLICY "Users can view their campaign history"
  ON public.broadcast_history FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM public.broadcast_campaigns 
    WHERE created_by_user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all history"
  ON public.broadcast_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. Criar políticas RLS para broadcast_rate_limits
CREATE POLICY "Users can manage their own rate limits"
  ON public.broadcast_rate_limits FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all rate limits"
  ON public.broadcast_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_minute TIMESTAMP WITH TIME ZONE;
  v_messages_sent INTEGER;
  v_rate_limit INTEGER := 2;
BEGIN
  v_current_minute := date_trunc('minute', NOW());
  
  SELECT COALESCE(messages_sent_current_minute, 0)
  INTO v_messages_sent
  FROM public.broadcast_rate_limits
  WHERE user_id = p_user_id 
    AND current_minute = v_current_minute;
  
  IF v_messages_sent IS NULL THEN
    INSERT INTO public.broadcast_rate_limits (
      user_id, 
      messages_sent_current_minute, 
      current_minute,
      total_messages_today,
      current_date
    ) VALUES (
      p_user_id, 
      0, 
      v_current_minute,
      0,
      CURRENT_DATE
    );
    v_messages_sent := 0;
  END IF;
  
  RETURN v_messages_sent < v_rate_limit;
END;
$$;

-- 11. Função para incrementar rate limit
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_minute TIMESTAMP WITH TIME ZONE;
BEGIN
  v_current_minute := date_trunc('minute', NOW());
  
  INSERT INTO public.broadcast_rate_limits (
    user_id, 
    messages_sent_current_minute, 
    current_minute,
    total_messages_today,
    current_date
  ) VALUES (
    p_user_id, 
    1, 
    v_current_minute,
    1,
    CURRENT_DATE
  )
  ON CONFLICT (user_id, current_minute) 
  DO UPDATE SET 
    messages_sent_current_minute = broadcast_rate_limits.messages_sent_current_minute + 1,
    total_messages_today = CASE 
      WHEN broadcast_rate_limits.current_date = CURRENT_DATE 
      THEN broadcast_rate_limits.total_messages_today + 1
      ELSE 1
    END,
    current_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$;

-- 12. Função para criar fila de broadcast
CREATE OR REPLACE FUNCTION public.create_broadcast_queue(
  p_campaign_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign RECORD;
  v_recipient_count INTEGER := 0;
  v_whatsapp_instance_id UUID;
  v_lead RECORD;
BEGIN
  SELECT * INTO v_campaign
  FROM public.broadcast_campaigns
  WHERE id = p_campaign_id 
    AND created_by_user_id = p_user_id;
    
  IF v_campaign IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or access denied';
  END IF;
  
  SELECT id INTO v_whatsapp_instance_id
  FROM public.whatsapp_instances
  WHERE created_by_user_id = p_user_id
    AND connection_status = 'connected'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_whatsapp_instance_id IS NULL THEN
    RAISE EXCEPTION 'No active WhatsApp instance found';
  END IF;
  
  CASE v_campaign.target_type
    WHEN 'all' THEN
      FOR v_lead IN 
        SELECT id, phone, name 
        FROM public.leads 
        WHERE created_by_user_id = p_user_id
          AND phone IS NOT NULL 
          AND phone != ''
      LOOP
        INSERT INTO public.broadcast_queue (
          campaign_id,
          whatsapp_instance_id,
          lead_id,
          phone,
          contact_name,
          message_text,
          media_type,
          media_url,
          scheduled_for
        ) VALUES (
          p_campaign_id,
          v_whatsapp_instance_id,
          v_lead.id,
          v_lead.phone,
          v_lead.name,
          v_campaign.message_text,
          v_campaign.media_type,
          v_campaign.media_url,
          COALESCE(v_campaign.scheduled_at, NOW())
        );
        v_recipient_count := v_recipient_count + 1;
      END LOOP;
      
    WHEN 'funnel' THEN
      FOR v_lead IN 
        SELECT l.id, l.phone, l.name 
        FROM public.leads l
        WHERE l.created_by_user_id = p_user_id
          AND l.funnel_id = (v_campaign.target_config->>'funnel_id')::UUID
          AND l.phone IS NOT NULL 
          AND l.phone != ''
      LOOP
        INSERT INTO public.broadcast_queue (
          campaign_id,
          whatsapp_instance_id,
          lead_id,
          phone,
          contact_name,
          message_text,
          media_type,
          media_url,
          scheduled_for
        ) VALUES (
          p_campaign_id,
          v_whatsapp_instance_id,
          v_lead.id,
          v_lead.phone,
          v_lead.name,
          v_campaign.message_text,
          v_campaign.media_type,
          v_campaign.media_url,
          COALESCE(v_campaign.scheduled_at, NOW())
        );
        v_recipient_count := v_recipient_count + 1;
      END LOOP;
      
    WHEN 'stage' THEN
      FOR v_lead IN 
        SELECT l.id, l.phone, l.name 
        FROM public.leads l
        WHERE l.created_by_user_id = p_user_id
          AND l.kanban_stage_id = (v_campaign.target_config->>'stage_id')::UUID
          AND l.phone IS NOT NULL 
          AND l.phone != ''
      LOOP
        INSERT INTO public.broadcast_queue (
          campaign_id,
          whatsapp_instance_id,
          lead_id,
          phone,
          contact_name,
          message_text,
          media_type,
          media_url,
          scheduled_for
        ) VALUES (
          p_campaign_id,
          v_whatsapp_instance_id,
          v_lead.id,
          v_lead.phone,
          v_lead.name,
          v_campaign.message_text,
          v_campaign.media_type,
          v_campaign.media_url,
          COALESCE(v_campaign.scheduled_at, NOW())
        );
        v_recipient_count := v_recipient_count + 1;
      END LOOP;
  END CASE;
  
  UPDATE public.broadcast_campaigns
  SET 
    status = 'running',
    total_recipients = v_recipient_count,
    updated_at = NOW()
  WHERE id = p_campaign_id;
  
  RETURN v_recipient_count;
END;
$$;

-- 13. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_user ON public.broadcast_campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status ON public.broadcast_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_campaign ON public.broadcast_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_status ON public.broadcast_queue(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_scheduled ON public.broadcast_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_campaign ON public.broadcast_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_rate_limits_user_minute ON public.broadcast_rate_limits(user_id, current_minute);

-- 14. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_broadcast_campaigns_updated_at
  BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broadcast_queue_updated_at
  BEFORE UPDATE ON public.broadcast_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Permissões para service_role
GRANT ALL PRIVILEGES ON public.broadcast_campaigns TO service_role;
GRANT ALL PRIVILEGES ON public.broadcast_queue TO service_role;
GRANT ALL PRIVILEGES ON public.broadcast_history TO service_role;
GRANT ALL PRIVILEGES ON public.broadcast_rate_limits TO service_role;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_broadcast_queue(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
