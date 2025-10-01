-- Adicionar colunas para suporte a encaminhamento de mensagens
-- is_forwarded: indica se a mensagem é um encaminhamento
-- original_message_id: referência à mensagem original encaminhada

-- Adicionar coluna is_forwarded (boolean, padrão false)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT FALSE;

-- Adicionar coluna original_message_id (referência à mensagem original)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS original_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de queries de encaminhamento
CREATE INDEX IF NOT EXISTS idx_messages_is_forwarded
ON public.messages(is_forwarded)
WHERE is_forwarded = true;

CREATE INDEX IF NOT EXISTS idx_messages_original_message_id
ON public.messages(original_message_id)
WHERE original_message_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.messages.is_forwarded IS 'Indica se a mensagem foi encaminhada de outra mensagem';
COMMENT ON COLUMN public.messages.original_message_id IS 'ID da mensagem original quando esta é um encaminhamento';
