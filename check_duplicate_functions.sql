-- =====================================================================
-- 🔍 VERIFICAR SE SÃO 2 FUNÇÕES DIFERENTES OU DUPLICADAS
-- =====================================================================
-- Verificar todas as funções save_whatsapp_message_service_role
-- =====================================================================

-- 1️⃣ LISTAR TODAS AS FUNÇÕES COM ESSE NOME
SELECT 
    p.proname as function_name,
    p.oid as function_oid,
    pg_get_function_identity_arguments(p.oid) as parameters,
    array_length(proargtypes, 1) as param_count,
    p.provolatile as volatility,
    p.proisstrict as is_strict,
    p.prosecdef as security_definer,
    obj_description(p.oid) as description,
    pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
ORDER BY p.oid;

-- =====================================================================

-- 2️⃣ COMPARAR ASSINATURAS DETALHADAS
SELECT 
    'FUNÇÃO ' || row_number() OVER (ORDER BY p.oid) as funcao_numero,
    p.oid as function_oid,
    pg_get_function_arguments(p.oid) as argumentos_completos,
    array_length(proargtypes, 1) as total_parametros,
    proargtypes as tipos_parametros,
    proargnames as nomes_parametros,
    substring(prosrc, 1, 200) || '...' as inicio_codigo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
ORDER BY p.oid;

-- =====================================================================

-- 3️⃣ VERIFICAR SE HÁ OVERLOAD (PostgreSQL permite múltiplas funções mesmo nome)
SELECT 
    'ANÁLISE DE OVERLOAD:' as info,
    COUNT(*) as total_funcoes,
    COUNT(DISTINCT proargtypes) as assinaturas_diferentes,
    CASE 
        WHEN COUNT(*) > 1 AND COUNT(DISTINCT proargtypes) > 1 THEN '✅ SÃO FUNÇÕES DIFERENTES (OVERLOAD)'
        WHEN COUNT(*) > 1 AND COUNT(DISTINCT proargtypes) = 1 THEN '❌ SÃO FUNÇÕES DUPLICADAS'
        ELSE '✅ APENAS UMA FUNÇÃO'
    END as resultado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role';

-- =====================================================================

-- 4️⃣ SE FOREM DIFERENTES, MOSTRAR AS DIFERENÇAS
SELECT 
    'DIFERENÇAS NOS PARÂMETROS:' as analise,
    p.oid as function_oid,
    'Função ' || row_number() OVER (ORDER BY p.oid) as funcao,
    pg_get_function_arguments(p.oid) as parametros,
    -- Identificar qual tem p_base64_data
    CASE 
        WHEN pg_get_function_arguments(p.oid) LIKE '%p_base64_data%' THEN '✅ TEM p_base64_data'
        ELSE '❌ NÃO TEM p_base64_data'
    END as tem_base64_data,
    -- Contar parâmetros
    array_length(proargtypes, 1) as total_params
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
ORDER BY p.oid;

-- =====================================================================
-- 📋 OBJETIVO DESTA VERIFICAÇÃO
-- =====================================================================
/*
🎯 ESTA VERIFICAÇÃO VAI DETERMINAR:

1. ✅ Se realmente existem 2 funções diferentes (overload válido)
2. ❌ Se são funções duplicadas (erro de criação)
3. 🔍 Qual função tem p_base64_data (para CRM interno)
4. 🔍 Qual função NÃO tem p_base64_data (para VPS webhook)

📱 RESULTADO ESPERADO:
- Função VPS (webhook): 9 parâmetros, SEM p_base64_data
- Função CRM (interno): 10 parâmetros, COM p_base64_data

🎯 PRÓXIMOS PASSOS:
- Se são diferentes: Renomear uma para evitar confusão
- Se são duplicadas: Dropar uma e manter a correta
- Corrigir apenas a função que recebe da VPS
*/