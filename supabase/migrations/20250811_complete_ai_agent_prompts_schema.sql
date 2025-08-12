-- Migração Completa: Adicionar todas as colunas necessárias para ai_agent_prompts
-- Esta migração alinha o schema do banco com os campos utilizados no frontend

-- Função para adicionar coluna apenas se não existir
CREATE OR REPLACE FUNCTION add_column_if_not_exists(table_name text, column_name text, column_definition text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = add_column_if_not_exists.table_name 
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE 'ALTER TABLE public.' || table_name || ' ADD COLUMN ' || column_name || ' ' || column_definition;
        RAISE NOTICE 'Coluna % adicionada à tabela %', column_name, table_name;
    ELSE
        RAISE NOTICE 'Coluna % já existe na tabela %', column_name, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Adicionar todas as colunas necessárias

-- 1. OBJETIVO DO AGENTE
SELECT add_column_if_not_exists('ai_agent_prompts', 'agent_objective', 'TEXT DEFAULT ''''');

-- 2. EXEMPLOS DE ESTILO DE COMUNICAÇÃO
SELECT add_column_if_not_exists('ai_agent_prompts', 'communication_style_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 3. EXEMPLOS DE PRODUTOS/SERVIÇOS
SELECT add_column_if_not_exists('ai_agent_prompts', 'products_services_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 4. REGRAS E DIRETRIZES
SELECT add_column_if_not_exists('ai_agent_prompts', 'rules_guidelines', 'TEXT DEFAULT ''''');

-- 5. EXEMPLOS DE REGRAS/DIRETRIZES  
SELECT add_column_if_not_exists('ai_agent_prompts', 'rules_guidelines_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 6. EXEMPLOS DE PROIBIÇÕES
SELECT add_column_if_not_exists('ai_agent_prompts', 'prohibitions_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 7. OBJEÇÕES DE CLIENTES
SELECT add_column_if_not_exists('ai_agent_prompts', 'client_objections', 'TEXT DEFAULT ''''');

-- 8. EXEMPLOS DE OBJEÇÕES DE CLIENTES
SELECT add_column_if_not_exists('ai_agent_prompts', 'client_objections_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 9. DICAS DE FRASES
SELECT add_column_if_not_exists('ai_agent_prompts', 'phrase_tips', 'TEXT DEFAULT ''''');

-- 10. EXEMPLOS DE DICAS DE FRASES
SELECT add_column_if_not_exists('ai_agent_prompts', 'phrase_tips_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- 11. FLUXO DE CONVERSAÇÃO
SELECT add_column_if_not_exists('ai_agent_prompts', 'flow', 'JSONB DEFAULT ''[]''::jsonb');

-- Criar índices GIN para as colunas JSONB para melhor performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_communication_style_examples 
ON public.ai_agent_prompts USING GIN (communication_style_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_products_services_examples 
ON public.ai_agent_prompts USING GIN (products_services_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_rules_guidelines_examples 
ON public.ai_agent_prompts USING GIN (rules_guidelines_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_prohibitions_examples 
ON public.ai_agent_prompts USING GIN (prohibitions_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_client_objections_examples 
ON public.ai_agent_prompts USING GIN (client_objections_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_phrase_tips_examples 
ON public.ai_agent_prompts USING GIN (phrase_tips_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agent_prompts_flow 
ON public.ai_agent_prompts USING GIN (flow);

-- Limpar função auxiliar
DROP FUNCTION add_column_if_not_exists(text, text, text);

-- Notificar schema reload
NOTIFY pgrst, 'reload schema';

-- Mostrar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_prompts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;