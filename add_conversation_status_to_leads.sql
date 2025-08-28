-- 🔧 ADICIONAR CAMPO CONVERSATION_STATUS À TABELA LEADS
-- Para suporte a "Fechar Conversa" e "Excluir Conversa"

-- Adicionar coluna conversation_status se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'conversation_status'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN conversation_status text DEFAULT 'active' CHECK (conversation_status IN ('active', 'closed', 'archived'));
    
    RAISE NOTICE '✅ Campo conversation_status adicionado à tabela leads';
  ELSE
    RAISE NOTICE '⚠️ Campo conversation_status já existe na tabela leads';
  END IF;
END $$;

-- Atualizar leads existentes para status 'active'
UPDATE public.leads 
SET conversation_status = 'active' 
WHERE conversation_status IS NULL;

-- Criar índice para performance nas consultas
CREATE INDEX IF NOT EXISTS idx_leads_conversation_status 
ON public.leads(conversation_status);

-- Criar índice composto para consultas de chat
CREATE INDEX IF NOT EXISTS idx_leads_status_user_updated 
ON public.leads(conversation_status, created_by_user_id, updated_at DESC);

RAISE NOTICE '🚀 Tabela leads preparada para funcionalidades de conversação';