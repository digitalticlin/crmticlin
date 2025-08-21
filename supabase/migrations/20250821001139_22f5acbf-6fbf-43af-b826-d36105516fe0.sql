
-- ========================================
-- SISTEMA COMPLETO DE DISPARO EM MASSA
-- Backend 100% Funcional e Escalável
-- ========================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "pgmq";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. TABELAS PRINCIPAIS

-- Campanhas de Broadcast
CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'funnel', 'stage', 'tags', 'custom')),
  target_config JSONB DEFAULT '{}',
  schedule_type TEXT DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  rate_limit_per_minute INTEGER DEFAULT 2,
  business_hours_only BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fila de Mensagens para Envio
CREATE TABLE IF NOT EXISTS broadcast_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  whatsapp_instance_id UUID NOT NULL,
  phone TEXT NOT NULL,
  contact_name TEXT,
  message_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'retry')),
  priority INTEGER DEFAULT 5,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Envios
CREATE TABLE IF NOT EXISTS broadcast_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  queue_id UUID,
  lead_id UUID NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL,
  external_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate Limiting por Usuário
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  messages_per_minute INTEGER DEFAULT 2,
  messages_sent_this_minute INTEGER DEFAULT 0,
  current_minute TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('minute', NOW()),
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_user_status ON broadcast_campaigns(created_by_user_id, status);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_scheduled ON broadcast_campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_broadcast_queue_campaign ON broadcast_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_status_priority ON broadcast_queue(status, priority DESC, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_processing ON broadcast_queue(status, scheduled_for) WHERE status IN ('queued', 'retry');

CREATE INDEX IF NOT EXISTS idx_broadcast_history_campaign ON broadcast_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_sent_at ON broadcast_history(sent_at);

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_current_minute ON user_rate_limits(current_minute);

-- 4. RLS POLICIES

-- Campanhas
ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own campaigns" ON broadcast_campaigns
  FOR ALL USING (created_by_user_id = auth.uid());

CREATE POLICY "Service role full access campaigns" ON broadcast_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fila
ALTER TABLE broadcast_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their campaign queues" ON broadcast_queue
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM broadcast_campaigns WHERE created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access queue" ON broadcast_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Histórico
ALTER TABLE broadcast_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their campaign history" ON broadcast_history
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM broadcast_campaigns WHERE created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access history" ON broadcast_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Rate Limits
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their rate limits" ON user_rate_limits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role full access rate limits" ON user_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_broadcast_campaigns_updated_at
  BEFORE UPDATE ON broadcast_campaigns
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broadcast_queue_updated_at
  BEFORE UPDATE ON broadcast_queue
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_rate_limits_updated_at
  BEFORE UPDATE ON user_rate_limits
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. FUNÇÕES AUXILIARES

-- Função para criar fila de envio
CREATE OR REPLACE FUNCTION create_broadcast_queue(
  p_campaign_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_lead RECORD;
  v_instance_id UUID;
  v_recipients_count INTEGER := 0;
BEGIN
  -- Buscar campanha
  SELECT * INTO v_campaign
  FROM broadcast_campaigns 
  WHERE id = p_campaign_id AND created_by_user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found or access denied';
  END IF;

  -- Buscar instância WhatsApp padrão do usuário
  SELECT id INTO v_instance_id
  FROM whatsapp_instances 
  WHERE created_by_user_id = p_user_id 
    AND connection_status = 'connected'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'No connected WhatsApp instance found';
  END IF;

  -- Criar fila baseada no tipo de alvo
  IF v_campaign.target_type = 'all' THEN
    -- Todos os leads do usuário
    INSERT INTO broadcast_queue (
      campaign_id, lead_id, whatsapp_instance_id, phone, contact_name,
      message_text, media_type, media_url, priority
    )
    SELECT 
      p_campaign_id, l.id, v_instance_id, l.phone, l.name,
      v_campaign.message_text, v_campaign.media_type, v_campaign.media_url, 5
    FROM leads l
    WHERE l.created_by_user_id = p_user_id
      AND l.phone IS NOT NULL
      AND l.phone != '';
      
  ELSIF v_campaign.target_type = 'funnel' THEN
    -- Leads de funil específico
    INSERT INTO broadcast_queue (
      campaign_id, lead_id, whatsapp_instance_id, phone, contact_name,
      message_text, media_type, media_url, priority
    )
    SELECT 
      p_campaign_id, l.id, v_instance_id, l.phone, l.name,
      v_campaign.message_text, v_campaign.media_type, v_campaign.media_url, 5
    FROM leads l
    WHERE l.created_by_user_id = p_user_id
      AND l.funnel_id = (v_campaign.target_config->>'funnel_id')::UUID
      AND l.phone IS NOT NULL
      AND l.phone != '';
      
  ELSIF v_campaign.target_type = 'stage' THEN
    -- Leads de estágio específico
    INSERT INTO broadcast_queue (
      campaign_id, lead_id, whatsapp_instance_id, phone, contact_name,
      message_text, media_type, media_url, priority
    )
    SELECT 
      p_campaign_id, l.id, v_instance_id, l.phone, l.name,
      v_campaign.message_text, v_campaign.media_type, v_campaign.media_url, 5
    FROM leads l
    WHERE l.created_by_user_id = p_user_id
      AND l.kanban_stage_id = (v_campaign.target_config->>'stage_id')::UUID
      AND l.phone IS NOT NULL
      AND l.phone != '';
  END IF;

  -- Contar recipients
  GET DIAGNOSTICS v_recipients_count = ROW_COUNT;
  
  -- Atualizar campanha
  UPDATE broadcast_campaigns 
  SET 
    total_recipients = v_recipients_count,
    status = CASE 
      WHEN v_recipients_count > 0 THEN 'running'
      ELSE 'failed'
    END,
    updated_at = NOW()
  WHERE id = p_campaign_id;
  
  RETURN v_recipients_count;
END;
$$;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_minute TIMESTAMP WITH TIME ZONE;
  v_rate_limit RECORD;
BEGIN
  v_current_minute := date_trunc('minute', NOW());
  
  -- Buscar ou criar rate limit do usuário
  SELECT * INTO v_rate_limit
  FROM user_rate_limits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_rate_limits (user_id, current_minute)
    VALUES (p_user_id, v_current_minute);
    RETURN true;
  END IF;
  
  -- Reset contador se mudou o minuto
  IF v_rate_limit.current_minute < v_current_minute THEN
    UPDATE user_rate_limits
    SET 
      messages_sent_this_minute = 0,
      current_minute = v_current_minute,
      last_reset = NOW()
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  -- Verificar se ainda pode enviar
  RETURN v_rate_limit.messages_sent_this_minute < v_rate_limit.messages_per_minute;
END;
$$;

-- Função para incrementar rate limit
CREATE OR REPLACE FUNCTION increment_rate_limit(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_rate_limits
  SET messages_sent_this_minute = messages_sent_this_minute + 1
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_rate_limits (user_id, messages_sent_this_minute)
    VALUES (p_user_id, 1);
  END IF;
END;
$$;

-- 7. CONFIGURAR PGMQ QUEUES
SELECT pgmq.create_queue('broadcast_sender_queue');
SELECT pgmq.create_queue('broadcast_scheduler_queue');
SELECT pgmq.create_queue('broadcast_retry_queue');

-- 8. GRANTS PARA SERVICE ROLE
GRANT ALL ON broadcast_campaigns TO service_role;
GRANT ALL ON broadcast_queue TO service_role;
GRANT ALL ON broadcast_history TO service_role;
GRANT ALL ON user_rate_limits TO service_role;

GRANT EXECUTE ON FUNCTION create_broadcast_queue(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_rate_limit(UUID) TO service_role;
