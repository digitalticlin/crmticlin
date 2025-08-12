-- Adicionar coluna products_services que estava faltando
-- Baseado na descoberta de que product_service_info não existe

DO $$ 
BEGIN
    -- Add products_services column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_prompts' 
        AND column_name = 'products_services'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.ai_agent_prompts 
        ADD COLUMN products_services TEXT DEFAULT '';
        
        RAISE NOTICE 'Added products_services column to ai_agent_prompts table';
    ELSE
        RAISE NOTICE 'products_services column already exists in ai_agent_prompts table';
    END IF;
END $$;