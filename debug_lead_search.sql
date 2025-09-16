-- Debug: Investigar por que leads "novos" não são encontrados na busca

-- 1. Verificar se já existe lead dos telefones que estão falhando
SELECT id, phone, created_by_user_id, name, last_message
FROM public.leads
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::uuid;

-- 2. Verificar se há problema de formatação no telefone
-- Baseado nos logs: instanceId: "digitalticlingmailcom"
-- Simular a limpeza de telefone da RPC
SELECT
    'telefone_original' as tipo,
    '5562999999999@s.whatsapp.net' as exemplo,
    regexp_replace('5562999999999@s.whatsapp.net', '[^0-9]', '', 'g') as limpo;

-- 3. Buscar leads que podem estar com telefones similares
SELECT id, phone, created_by_user_id, name
FROM public.leads
WHERE phone LIKE '5562%'
   AND created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::uuid;