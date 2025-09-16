-- ================================================================
-- 🔍 VERIFICAR IDS VÁLIDOS NO SISTEMA
-- ================================================================

-- 1. Ver funnels disponíveis
SELECT 'FUNNELS DISPONÍVEIS' as categoria, id, name 
FROM public.funnels 
LIMIT 5;

-- 2. Ver users disponíveis 
SELECT 'USERS DISPONÍVEIS' as categoria, id, email
FROM auth.users
LIMIT 5;

-- 3. Ver um lead existente para referência
SELECT 'LEAD EXEMPLO' as categoria, 
       id, name, phone, funnel_id, created_by_user_id, whatsapp_number_id
FROM public.leads 
WHERE funnel_id IS NOT NULL
LIMIT 1;