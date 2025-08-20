-- Adicionar colunas para configuração de IA e notificações nos estágios do kanban
-- Data: 2025-01-19
-- Descrição: Adiciona campos para controle de IA e notificações WhatsApp nos estágios

-- Adicionar coluna para descrição que a IA usa para identificar este estágio
ALTER TABLE public.kanban_stages 
ADD COLUMN IF NOT EXISTS ai_stage_description TEXT DEFAULT '';

-- Adicionar coluna para controlar se deve notificar via WhatsApp quando lead entra neste estágio
ALTER TABLE public.kanban_stages 
ADD COLUMN IF NOT EXISTS ai_notify_enabled BOOLEAN DEFAULT false;

-- Adicionar coluna para telefone que receberá as notificações
ALTER TABLE public.kanban_stages 
ADD COLUMN IF NOT EXISTS notify_phone TEXT DEFAULT '';

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.kanban_stages.ai_stage_description 
IS 'Descrição para a IA identificar quando um lead deve estar neste estágio do funil';

COMMENT ON COLUMN public.kanban_stages.ai_notify_enabled 
IS 'Controla se deve enviar notificação WhatsApp quando um lead for movido para este estágio';

COMMENT ON COLUMN public.kanban_stages.notify_phone 
IS 'Telefone no formato internacional (+5511999999999) que receberá notificações deste estágio';

-- Criar índice para performance em consultas de notificação ativa
CREATE INDEX IF NOT EXISTS idx_kanban_stages_ai_notify_enabled 
ON public.kanban_stages(ai_notify_enabled) 
WHERE ai_notify_enabled = true;