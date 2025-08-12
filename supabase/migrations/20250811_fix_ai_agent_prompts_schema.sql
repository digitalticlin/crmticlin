-- Fix AI Agent Prompts Schema
-- Ensure the objectives column exists in ai_agent_prompts table

-- First check if the column already exists
DO $$ 
BEGIN
    -- Add objectives column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agent_prompts' 
        AND column_name = 'objectives'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.ai_agent_prompts 
        ADD COLUMN objectives JSONB NOT NULL DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added objectives column to ai_agent_prompts table';
    ELSE
        RAISE NOTICE 'objectives column already exists in ai_agent_prompts table';
    END IF;
END $$;

-- Create index for objectives column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_objectives 
ON public.ai_agent_prompts USING GIN (objectives);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';