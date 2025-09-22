-- ============================================
-- MIGRATION: Adicionar coluna expires_at na plan_subscriptions
-- Data: 2025-09-22
-- ============================================

-- Adicionar coluna expires_at se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plan_subscriptions'
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.plan_subscriptions
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

        -- Definir valores padrão para registros existentes
        UPDATE public.plan_subscriptions
        SET expires_at = CASE
            WHEN is_trial = true THEN created_at + INTERVAL '30 days'
            ELSE created_at + INTERVAL '1 month'
        END
        WHERE expires_at IS NULL;
    END IF;
END $$;

-- Criar índice para otimizar queries por expires_at
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_expires_at
ON public.plan_subscriptions(expires_at)
WHERE expires_at IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.plan_subscriptions.expires_at IS 'Data de expiração do plano ou trial';