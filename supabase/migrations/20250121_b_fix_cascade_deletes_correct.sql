-- ============================================
-- FIX CASCADE DELETE CONSTRAINTS - VERSÃO CORRIGIDA
-- ============================================
-- Esta migration adiciona CASCADE apenas para tabelas e colunas que REALMENTE EXISTEM

-- ===== TABELAS PRINCIPAIS =====

-- 1. LEADS - Adicionar CASCADE para funnel_id
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_funnel_id_fkey;

ALTER TABLE leads
ADD CONSTRAINT leads_funnel_id_fkey
FOREIGN KEY (funnel_id)
REFERENCES funnels(id)
ON DELETE CASCADE;

-- 2. LEADS - Adicionar CASCADE para kanban_stage_id
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_kanban_stage_id_fkey;

ALTER TABLE leads
ADD CONSTRAINT leads_kanban_stage_id_fkey
FOREIGN KEY (kanban_stage_id)
REFERENCES kanban_stages(id)
ON DELETE CASCADE;

-- 3. LEADS - Adicionar CASCADE para created_by_user_id
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_created_by_user_id_fkey;

ALTER TABLE leads
ADD CONSTRAINT leads_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 4. KANBAN_STAGES - Adicionar CASCADE para funnel_id
ALTER TABLE kanban_stages
DROP CONSTRAINT IF EXISTS kanban_stages_funnel_id_fkey;

ALTER TABLE kanban_stages
ADD CONSTRAINT kanban_stages_funnel_id_fkey
FOREIGN KEY (funnel_id)
REFERENCES funnels(id)
ON DELETE CASCADE;

-- 5. KANBAN_STAGES - Adicionar CASCADE para created_by_user_id
ALTER TABLE kanban_stages
DROP CONSTRAINT IF EXISTS kanban_stages_created_by_user_id_fkey;

ALTER TABLE kanban_stages
ADD CONSTRAINT kanban_stages_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 6. FUNNELS - Adicionar CASCADE para created_by_user_id
ALTER TABLE funnels
DROP CONSTRAINT IF EXISTS funnels_created_by_user_id_fkey;

ALTER TABLE funnels
ADD CONSTRAINT funnels_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 7. MESSAGES - Adicionar CASCADE para created_by_user_id
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_created_by_user_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 8. MESSAGES - Adicionar CASCADE para lead_id (não sender_id!)
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_lead_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

-- 9. WHATSAPP_INSTANCES - Adicionar CASCADE para created_by_user_id
ALTER TABLE whatsapp_instances
DROP CONSTRAINT IF EXISTS whatsapp_instances_created_by_user_id_fkey;

ALTER TABLE whatsapp_instances
ADD CONSTRAINT whatsapp_instances_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 10. AI_AGENTS - Adicionar CASCADE para created_by_user_id
ALTER TABLE ai_agents
DROP CONSTRAINT IF EXISTS ai_agents_created_by_user_id_fkey;

ALTER TABLE ai_agents
ADD CONSTRAINT ai_agents_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- ===== TABELAS DE TAGS =====

-- 11. TAGS - Adicionar CASCADE para created_by_user_id
ALTER TABLE tags
DROP CONSTRAINT IF EXISTS tags_created_by_user_id_fkey;

ALTER TABLE tags
ADD CONSTRAINT tags_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 12. LEAD_TAGS - Adicionar CASCADE para lead_id
ALTER TABLE lead_tags
DROP CONSTRAINT IF EXISTS lead_tags_lead_id_fkey;

ALTER TABLE lead_tags
ADD CONSTRAINT lead_tags_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

-- 13. LEAD_TAGS - Adicionar CASCADE para tag_id
ALTER TABLE lead_tags
DROP CONSTRAINT IF EXISTS lead_tags_tag_id_fkey;

ALTER TABLE lead_tags
ADD CONSTRAINT lead_tags_tag_id_fkey
FOREIGN KEY (tag_id)
REFERENCES tags(id)
ON DELETE CASCADE;

-- ===== TABELAS DE BROADCAST =====

-- 14. BROADCAST_CAMPAIGNS - Adicionar CASCADE para created_by_user_id
ALTER TABLE broadcast_campaigns
DROP CONSTRAINT IF EXISTS broadcast_campaigns_created_by_user_id_fkey;

ALTER TABLE broadcast_campaigns
ADD CONSTRAINT broadcast_campaigns_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 15. BROADCAST_QUEUE - Adicionar CASCADE para campaign_id
ALTER TABLE broadcast_queue
DROP CONSTRAINT IF EXISTS broadcast_queue_campaign_id_fkey;

ALTER TABLE broadcast_queue
ADD CONSTRAINT broadcast_queue_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES broadcast_campaigns(id)
ON DELETE CASCADE;

-- 16. BROADCAST_QUEUE - Adicionar CASCADE para lead_id
ALTER TABLE broadcast_queue
DROP CONSTRAINT IF EXISTS broadcast_queue_lead_id_fkey;

ALTER TABLE broadcast_queue
ADD CONSTRAINT broadcast_queue_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

-- 17. BROADCAST_HISTORY - Adicionar CASCADE para campaign_id
ALTER TABLE broadcast_history
DROP CONSTRAINT IF EXISTS broadcast_history_campaign_id_fkey;

ALTER TABLE broadcast_history
ADD CONSTRAINT broadcast_history_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES broadcast_campaigns(id)
ON DELETE CASCADE;

-- 18. BROADCAST_HISTORY - Adicionar CASCADE para lead_id
ALTER TABLE broadcast_history
DROP CONSTRAINT IF EXISTS broadcast_history_lead_id_fkey;

ALTER TABLE broadcast_history
ADD CONSTRAINT broadcast_history_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

-- ===== TABELAS DE BILLING =====

-- 19. PLAN_SUBSCRIPTIONS - Adicionar CASCADE para user_id
ALTER TABLE plan_subscriptions
DROP CONSTRAINT IF EXISTS plan_subscriptions_user_id_fkey;

ALTER TABLE plan_subscriptions
ADD CONSTRAINT plan_subscriptions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 20. MESSAGE_USAGE_TRACKING - Adicionar CASCADE para user_id
ALTER TABLE message_usage_tracking
DROP CONSTRAINT IF EXISTS message_usage_tracking_user_id_fkey;

ALTER TABLE message_usage_tracking
ADD CONSTRAINT message_usage_tracking_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 21. FREE_TRIAL_USAGE - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_trial_usage') THEN
    ALTER TABLE free_trial_usage
    DROP CONSTRAINT IF EXISTS free_trial_usage_user_id_fkey;

    ALTER TABLE free_trial_usage
    ADD CONSTRAINT free_trial_usage_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 22. PAYMENT_HISTORY - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') THEN
    ALTER TABLE payment_history
    DROP CONSTRAINT IF EXISTS payment_history_user_id_fkey;

    ALTER TABLE payment_history
    ADD CONSTRAINT payment_history_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 23. BILLING_REMINDERS - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_reminders') THEN
    ALTER TABLE billing_reminders
    DROP CONSTRAINT IF EXISTS billing_reminders_user_id_fkey;

    ALTER TABLE billing_reminders
    ADD CONSTRAINT billing_reminders_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 24. USAGE_ALERTS - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_alerts') THEN
    ALTER TABLE usage_alerts
    DROP CONSTRAINT IF EXISTS usage_alerts_user_id_fkey;

    ALTER TABLE usage_alerts
    ADD CONSTRAINT usage_alerts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 25. USER_RATE_LIMITS - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_rate_limits') THEN
    ALTER TABLE user_rate_limits
    DROP CONSTRAINT IF EXISTS user_rate_limits_user_id_fkey;

    ALTER TABLE user_rate_limits
    ADD CONSTRAINT user_rate_limits_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ===== TABELAS DE RELAÇÃO USUÁRIO =====

-- 26. USER_WHATSAPP_NUMBERS - Adicionar CASCADE para profile_id
ALTER TABLE user_whatsapp_numbers
DROP CONSTRAINT IF EXISTS user_whatsapp_numbers_profile_id_fkey;

ALTER TABLE user_whatsapp_numbers
ADD CONSTRAINT user_whatsapp_numbers_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 27. USER_FUNNELS - Adicionar CASCADE para profile_id
ALTER TABLE user_funnels
DROP CONSTRAINT IF EXISTS user_funnels_profile_id_fkey;

ALTER TABLE user_funnels
ADD CONSTRAINT user_funnels_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 28. DEALS - Adicionar CASCADE para created_by_user_id
ALTER TABLE deals
DROP CONSTRAINT IF EXISTS deals_created_by_user_id_fkey;

ALTER TABLE deals
ADD CONSTRAINT deals_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 29. INSTANCES_PUPPETEER - Adicionar CASCADE para user_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instances_puppeteer') THEN
    ALTER TABLE instances_puppeteer
    DROP CONSTRAINT IF EXISTS instances_puppeteer_user_id_fkey;

    ALTER TABLE instances_puppeteer
    ADD CONSTRAINT instances_puppeteer_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- FUNÇÃO SIMPLIFICADA PARA DELETAR CONTA
-- ============================================

CREATE OR REPLACE FUNCTION delete_user_account_cascade(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Com CASCADE configurado, só precisamos deletar o profile
  -- Tudo será deletado automaticamente em cascata

  DELETE FROM profiles WHERE id = p_user_id;

  v_result := json_build_object(
    'success', true,
    'message', format('Account deleted successfully for user %s', p_user_id),
    'note', 'All related data was deleted via CASCADE constraints'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user_account_cascade(UUID) TO authenticated;

COMMENT ON FUNCTION delete_user_account_cascade IS 'Deletes a user account. All related data is automatically deleted via CASCADE constraints.';