-- Migração: Consolidar campos de prompts na tabela ai_agents
-- Esta migração move todos os campos de prompt da tabela ai_agent_prompts para ai_agents
-- e depois remove a tabela ai_agent_prompts para simplificar a estrutura

-- Função auxiliar para verificar e adicionar colunas
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

-- 1. ADICIONAR TODAS AS COLUNAS DE PROMPT NA TABELA AI_AGENTS

-- Função do Agente
SELECT add_column_if_not_exists('ai_agents', 'agent_function', 'TEXT DEFAULT ''''');

-- Objetivo do Agente
SELECT add_column_if_not_exists('ai_agents', 'agent_objective', 'TEXT DEFAULT ''''');

-- Estilo de Comunicação
SELECT add_column_if_not_exists('ai_agents', 'communication_style', 'TEXT DEFAULT ''''');

-- Dicas de Frases para Estilo
SELECT add_column_if_not_exists('ai_agents', 'communication_style_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- Informações sobre a Empresa
SELECT add_column_if_not_exists('ai_agents', 'company_info', 'TEXT DEFAULT ''''');

-- Explicar Produtos e Serviços
SELECT add_column_if_not_exists('ai_agents', 'products_services', 'TEXT DEFAULT ''''');

-- Dicas de Frases para Produtos/Serviços
SELECT add_column_if_not_exists('ai_agents', 'products_services_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- Regras e Diretrizes (JSONB para múltiplos itens)
SELECT add_column_if_not_exists('ai_agents', 'rules_guidelines', 'JSONB DEFAULT ''[]''::jsonb');

-- Proibições ao Agente (JSONB para múltiplos itens)
SELECT add_column_if_not_exists('ai_agents', 'prohibitions', 'JSONB DEFAULT ''[]''::jsonb');

-- Objeções de Clientes (JSONB com objetos: objeção + resposta)
SELECT add_column_if_not_exists('ai_agents', 'client_objections', 'JSONB DEFAULT ''[]''::jsonb');

-- Dicas de Frases
SELECT add_column_if_not_exists('ai_agents', 'phrase_tips', 'TEXT DEFAULT ''''');

-- Exemplos de Dicas de Frases
SELECT add_column_if_not_exists('ai_agents', 'phrase_tips_examples', 'JSONB DEFAULT ''[]''::jsonb');

-- Flow Passo a Passo
SELECT add_column_if_not_exists('ai_agents', 'flow', 'JSONB DEFAULT ''[]''::jsonb');

-- 2. MIGRAR DADOS EXISTENTES DE AI_AGENT_PROMPTS PARA AI_AGENTS

-- Verificar se existe dados para migrar
DO $$
DECLARE
    prompt_record RECORD;
    migration_count INTEGER := 0;
BEGIN
    -- Verificar se a tabela ai_agent_prompts existe e tem dados
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_prompts' AND table_schema = 'public') THEN
        
        -- Migrar dados existentes
        FOR prompt_record IN 
            SELECT 
                agent_id,
                COALESCE(agent_function, '') as agent_function,
                COALESCE(agent_objective, '') as agent_objective,
                COALESCE(communication_style, '') as communication_style,
                COALESCE(communication_style_examples, '[]'::jsonb) as communication_style_examples,
                COALESCE(company_info, '') as company_info,
                COALESCE(product_service_info, '') as product_service_info, -- Campo antigo
                COALESCE(products_services, '') as products_services, -- Campo novo
                COALESCE(products_services_examples, '[]'::jsonb) as products_services_examples,
                COALESCE(rules_guidelines, '[]'::jsonb) as rules_guidelines,
                COALESCE(prohibitions, '[]'::jsonb) as prohibitions,
                COALESCE(client_objections, '[]'::jsonb) as client_objections,
                COALESCE(phrase_tips, '') as phrase_tips,
                COALESCE(phrase_tips_examples, '[]'::jsonb) as phrase_tips_examples,
                COALESCE(flow, '[]'::jsonb) as flow
            FROM ai_agent_prompts
        LOOP
            -- Atualizar o agente correspondente com os dados do prompt
            UPDATE ai_agents SET
                agent_function = prompt_record.agent_function,
                agent_objective = prompt_record.agent_objective,
                communication_style = prompt_record.communication_style,
                communication_style_examples = prompt_record.communication_style_examples,
                company_info = prompt_record.company_info,
                products_services = COALESCE(NULLIF(prompt_record.products_services, ''), prompt_record.product_service_info), -- Usar novo campo ou fallback para antigo
                products_services_examples = prompt_record.products_services_examples,
                rules_guidelines = prompt_record.rules_guidelines,
                prohibitions = prompt_record.prohibitions,
                client_objections = prompt_record.client_objections,
                phrase_tips = prompt_record.phrase_tips,
                phrase_tips_examples = prompt_record.phrase_tips_examples,
                flow = prompt_record.flow,
                updated_at = now()
            WHERE id = prompt_record.agent_id;
            
            migration_count := migration_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Migrados % registros de prompts para a tabela ai_agents', migration_count;
        
    ELSE
        RAISE NOTICE 'Tabela ai_agent_prompts não encontrada ou já removida';
    END IF;
END $$;

-- 3. CRIAR ÍNDICES GIN PARA COLUNAS JSONB NA TABELA AI_AGENTS

CREATE INDEX IF NOT EXISTS idx_ai_agents_communication_style_examples 
ON public.ai_agents USING GIN (communication_style_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agents_products_services_examples 
ON public.ai_agents USING GIN (products_services_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agents_rules_guidelines 
ON public.ai_agents USING GIN (rules_guidelines);

CREATE INDEX IF NOT EXISTS idx_ai_agents_prohibitions 
ON public.ai_agents USING GIN (prohibitions);

CREATE INDEX IF NOT EXISTS idx_ai_agents_client_objections 
ON public.ai_agents USING GIN (client_objections);

CREATE INDEX IF NOT EXISTS idx_ai_agents_phrase_tips_examples 
ON public.ai_agents USING GIN (phrase_tips_examples);

CREATE INDEX IF NOT EXISTS idx_ai_agents_flow 
ON public.ai_agents USING GIN (flow);

-- 4. REMOVER TABELA AI_AGENT_PROMPTS APÓS MIGRAÇÃO

DO $$
BEGIN
    -- Verificar se a tabela existe antes de tentar removê-la
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_prompts' AND table_schema = 'public') THEN
        DROP TABLE public.ai_agent_prompts CASCADE;
        RAISE NOTICE 'Tabela ai_agent_prompts removida com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ai_agent_prompts já foi removida anteriormente';
    END IF;
END $$;

-- 5. LIMPAR FUNÇÃO AUXILIAR
DROP FUNCTION add_column_if_not_exists(text, text, text);

-- 6. NOTIFICAR RECARREGAMENTO DO SCHEMA
NOTIFY pgrst, 'reload schema';

-- 7. MOSTRAR ESTRUTURA FINAL DA TABELA AI_AGENTS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

RAISE NOTICE 'Migração concluída: Todos os campos de prompt foram consolidados na tabela ai_agents';