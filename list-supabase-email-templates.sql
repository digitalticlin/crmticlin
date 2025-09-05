-- SQL PARA LISTAR CONFIGURAÇÕES DE EMAIL NO SUPABASE
-- ATENÇÃO: Estes comandos podem não funcionar devido a permissões, mas vamos tentar

-- =========================================
-- 1. TENTAR ACESSAR CONFIGURAÇÕES DE AUTH (pode falhar por permissões)
-- =========================================

-- Verificar se existe tabela de configurações de auth
SELECT 'Tentando acessar configurações de auth...' as info;

-- Verificar se existe alguma tabela de configuração
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name ILIKE '%auth%' 
   OR table_name ILIKE '%config%' 
   OR table_name ILIKE '%template%'
   OR table_name ILIKE '%email%'
ORDER BY table_schema, table_name;

-- =========================================
-- 2. VERIFICAR SCHEMA AUTH (se acessível)
-- =========================================

-- Listar tabelas no schema auth (pode falhar)
SELECT 'Tentando listar tabelas do schema auth...' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- =========================================
-- 3. VERIFICAR FUNÇÕES RELACIONADAS A EMAIL
-- =========================================

-- Listar funções que podem estar relacionadas com email
SELECT 
    'Funções relacionadas a email/auth:' as info,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE (routine_definition ILIKE '%email%' 
    OR routine_definition ILIKE '%invite%' 
    OR routine_definition ILIKE '%template%'
    OR routine_name ILIKE '%email%'
    OR routine_name ILIKE '%invite%'
    OR routine_name ILIKE '%auth%')
AND routine_schema = 'public'
ORDER BY routine_name;

-- =========================================
-- 4. VERIFICAR VARIÁVEIS DE CONFIGURAÇÃO (se existirem)
-- =========================================

-- Verificar se existe alguma tabela de configuração do sistema
SELECT 'Procurando tabelas de configuração...' as info;

SELECT 
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND (c.column_name ILIKE '%config%' 
    OR c.column_name ILIKE '%template%' 
    OR c.column_name ILIKE '%email%'
    OR c.column_name ILIKE '%smtp%'
    OR t.table_name ILIKE '%config%'
    OR t.table_name ILIKE '%setting%')
ORDER BY c.table_name, c.column_name;

-- =========================================
-- 5. VERIFICAR EDGE FUNCTIONS DEPLOYADAS
-- =========================================

-- Infelizmente não é possível listar Edge Functions via SQL
-- Mas podemos ver as referências no código
SELECT 'Edge Functions detectadas no código:' as info;
SELECT 'send_native_invite - Convites nativos via Supabase Auth' as function_info;
SELECT 'send_team_invite - Convites via Resend (fallback)' as function_info;

-- =========================================
-- 6. VERIFICAR LOGS DE CONVITES (dados reais)
-- =========================================

-- Ver últimos convites enviados
SELECT 
    'Últimos convites enviados:' as info,
    full_name,
    email,
    invite_status,
    invite_sent_at,
    CASE 
        WHEN invite_token IS NOT NULL THEN 'Token gerado'
        ELSE 'Sem token'
    END as token_status,
    created_at
FROM profiles 
WHERE invite_sent_at IS NOT NULL
   OR invite_status IS NOT NULL
ORDER BY COALESCE(invite_sent_at, created_at) DESC
LIMIT 5;

-- =========================================
-- 7. INFORMAÇÕES SOBRE O SISTEMA ATUAL
-- =========================================

SELECT 'RESUMO DO SISTEMA DE EMAIL ATUAL:' as sistema;
SELECT '1. send_native_invite - Chama send_team_invite (Resend)' as etapa1;
SELECT '2. send_team_invite - Usa template HTML customizado' as etapa2; 
SELECT '3. NÃO usa templates do Supabase Dashboard' as importante;
SELECT '4. Template está hardcoded na Edge Function' as localizacao;

-- =========================================
-- 8. STATUS DAS CONFIGURAÇÕES
-- =========================================

SELECT 'DIAGNÓSTICO:' as diagnostico;
SELECT 'Templates Supabase: NÃO UTILIZADOS' as template_supabase;
SELECT 'Templates Edge Function: UTILIZADOS (Resend)' as template_edge;
SELECT 'Email Provider: Resend API' as provider;
SELECT 'Customização: HTML hardcoded na função' as customizacao;