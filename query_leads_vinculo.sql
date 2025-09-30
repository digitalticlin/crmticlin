SELECT
    l.id AS lead_id,
    l.name AS lead_name,
    l.kanban_stage_id,
    ks.title AS stage_name,
    l.funnel_id,
    f.name AS funnel_name,
    l.whatsapp_number_id,
    wi.phone_number AS whatsapp_number,
    wi.name AS whatsapp_instance_name
FROM leads l
LEFT JOIN kanban_stages ks ON l.kanban_stage_id = ks.id
LEFT JOIN funnels f ON l.funnel_id = f.id
LEFT JOIN whatsapp_instances wi ON l.whatsapp_number_id = wi.id
WHERE l.created_by_user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
ORDER BY l.created_at DESC;