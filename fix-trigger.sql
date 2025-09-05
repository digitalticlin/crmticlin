-- CORRIGIR TRIGGER QUE ESTÁ CAUSANDO O ERRO

-- Verificar qual é o nome correto da coluna na tabela leads
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name ILIKE '%whatsapp%'
ORDER BY column_name;

-- Corrigir o trigger com o nome correto da coluna
CREATE OR REPLACE FUNCTION update_leads_owner_on_instance_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Usar o nome correto da coluna (provavelmente whatsapp_number_id)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE leads 
        SET owner_id = NEW.profile_id
        WHERE whatsapp_number_id = NEW.whatsapp_number_id  -- Usar nome correto
        AND owner_id IS NULL;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;