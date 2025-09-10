-- =====================================================
-- 🔧 CONFIGURAR ACESSO COMPLETO PARA vendas02@geuniformes.com.br
-- Profile ID: d0bdb8e2-556f-48da-af90-63f14c119340
-- Admin ID: 7c197601-01cc-4f71-a4d8-7c1357cac113
-- =====================================================

-- 1. Verificar dados atuais do usuário
SELECT 
    '1. PROFILE VENDAS02' as info,
    id,
    email,
    role,
    created_by_user_id
FROM profiles 
WHERE id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- 2. Atribuir instância WhatsApp (mesma do admin)
INSERT INTO user_whatsapp_numbers (
    profile_id,
    whatsapp_number_id,
    created_by_user_id,
    created_at
) VALUES (
    'd0bdb8e2-556f-48da-af90-63f14c119340',  -- vendas02
    'c1fb1905-7e52-4752-a471-a7818c121801',  -- admgeuniformesgmailcom
    '7c197601-01cc-4f71-a4d8-7c1357cac113',  -- Admin
    now()
)
ON CONFLICT (profile_id, whatsapp_number_id) DO NOTHING;

-- 3. Verificar se funil já está atribuído (logs mostram que está)
SELECT 
    '3. FUNIS ATRIBUIDOS' as info,
    uf.*,
    f.name as funnel_name
FROM user_funnels uf
JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- 4. Criar stages para o funil se não existirem
INSERT INTO kanban_stages (funnel_id, name, order_position, created_by_user_id)
SELECT 
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',
    stage_name,
    stage_order,
    '7c197601-01cc-4f71-a4d8-7c1357cac113'
FROM (
    VALUES 
        ('Entrada', 1),
        ('Qualificação', 2),
        ('Proposta', 3),
        ('Negociação', 4),
        ('Fechamento', 5),
        ('Perdido', 6)
) AS stages(stage_name, stage_order)
WHERE NOT EXISTS (
    SELECT 1 FROM kanban_stages 
    WHERE funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
);

-- 5. Verificar resultado das atribuições
SELECT 
    '5. WHATSAPP ATRIBUIDO' as info,
    uwn.*,
    wi.instance_name,
    wi.connection_status
FROM user_whatsapp_numbers uwn
JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- 6. Contar leads que o usuário pode ver
SELECT 
    '6. LEADS ACESSIVEIS' as info,
    COUNT(*) as total_leads,
    COUNT(DISTINCT whatsapp_number_id) as total_instancias
FROM leads
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 7. Verificar stages do funil
SELECT 
    '7. STAGES DO FUNIL' as info,
    id,
    name,
    order_position
FROM kanban_stages
WHERE funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
ORDER BY order_position;