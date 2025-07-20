
-- ANÁLISE E CORREÇÃO ESTRUTURAL DAS TABELAS
-- Problema: Inconsistências após remoção de cascata e possíveis referências órfãs

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA LEADS
-- Garantir que todas as colunas essenciais existem e têm tipos corretos
ALTER TABLE public.leads 
  ALTER COLUMN funnel_id DROP NOT NULL,
  ALTER COLUMN whatsapp_number_id DROP NOT NULL;

-- Adicionar colunas que podem estar faltando (se não existirem)
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'realtime';

-- 2. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA MESSAGES
-- Garantir que referências são opcionais para suportar dados órfãos
ALTER TABLE public.messages 
  ALTER COLUMN lead_id DROP NOT NULL,
  ALTER COLUMN whatsapp_number_id DROP NOT NULL;

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'realtime',
  ADD COLUMN IF NOT EXISTS external_message_id TEXT;

-- 3. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES (LIMPEZA COMPLETA)
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
DROP POLICY IF EXISTS "service_role_messages_full_access" ON messages;
DROP POLICY IF EXISTS "service_role_messages_policy" ON messages;

-- 4. CRIAR POLÍTICAS RLS MAIS FLEXÍVEIS PARA SUPORTAR DADOS ÓRFÃOS
-- Política SELECT: Acesso via user_id direto OU via instância OU via lead
CREATE POLICY "messages_flexible_select" ON messages
  FOR SELECT TO authenticated
  USING (
    -- Acesso direto por usuário
    created_by_user_id = auth.uid()
    OR
    -- Acesso via instância (se existir)
    (whatsapp_number_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    ))
    OR
    -- Acesso via lead (se existir)
    (lead_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    ))
  );

-- Política INSERT: Permitir inserção com validação flexível
CREATE POLICY "messages_flexible_insert" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Usuário deve ser o criador
    created_by_user_id = auth.uid()
    AND (
      -- E pelo menos uma das referências deve ser válida
      (whatsapp_number_id IS NULL OR EXISTS (
        SELECT 1 FROM whatsapp_instances wi 
        WHERE wi.id = messages.whatsapp_number_id 
        AND wi.created_by_user_id = auth.uid()
      ))
      AND
      (lead_id IS NULL OR EXISTS (
        SELECT 1 FROM leads l 
        WHERE l.id = messages.lead_id 
        AND l.created_by_user_id = auth.uid()
      ))
    )
  );

-- Política UPDATE: Permitir atualização com validação flexível
CREATE POLICY "messages_flexible_update" ON messages
  FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR
    (whatsapp_number_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    ))
    OR
    (lead_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    ))
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- Política DELETE: Permitir deleção com validação flexível
CREATE POLICY "messages_flexible_delete" ON messages
  FOR DELETE TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR
    (whatsapp_number_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    ))
    OR
    (lead_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    ))
  );

-- 5. MANTER POLÍTICAS SERVICE_ROLE PARA EDGE FUNCTIONS
CREATE POLICY "service_role_messages_access" ON messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. VERIFICAR E CORRIGIR ÍNDICES PARA PERFORMANCE
-- Índices essenciais para as consultas RLS
CREATE INDEX IF NOT EXISTS idx_messages_created_by_user_id ON messages(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_number_id ON messages(whatsapp_number_id) WHERE whatsapp_number_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_by_user_id ON leads(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_created_by_user_id ON whatsapp_instances(created_by_user_id);

-- 7. FUNÇÃO PARA LIMPAR REFERÊNCIAS ÓRFÃS (OPCIONAL)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_references()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_messages_count INTEGER;
  orphan_leads_count INTEGER;
BEGIN
  -- Contar mensagens órfãs (sem lead válido nem instância válida)
  SELECT COUNT(*) INTO orphan_messages_count
  FROM messages m
  WHERE (m.lead_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM leads l WHERE l.id = m.lead_id
  ))
  OR (m.whatsapp_number_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM whatsapp_instances wi WHERE wi.id = m.whatsapp_number_id
  ));
  
  -- Contar leads órfãos (sem instância válida)
  SELECT COUNT(*) INTO orphan_leads_count
  FROM leads l
  WHERE l.whatsapp_number_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM whatsapp_instances wi WHERE wi.id = l.whatsapp_number_id
  );
  
  RETURN format('Encontradas %s mensagens órfãs e %s leads órfãos', 
                orphan_messages_count, orphan_leads_count);
END;
$$;
