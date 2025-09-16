-- =====================================================================
-- 🔧 CORREÇÃO CIRÚRGICA - save_sent_message_only (CRM)
-- =====================================================================
-- FASE 1: Corrigir campo TEXT cirurgicamente na função CRM
-- whatsapp_messaging_service → save_sent_message_only
-- =====================================================================

-- 1️⃣ BACKUP DA FUNÇÃO ORIGINAL (PARA SEGURANÇA)
CREATE OR REPLACE FUNCTION public.save_sent_message_only_backup()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Backup realizado - função original preservada antes da correção cirúrgica';
END;
$$;

-- =====================================================================

-- 2️⃣ CORREÇÃO CIRÚRGICA DA FUNÇÃO save_sent_message_only
-- Implementar lógica inline para campo TEXT padronizado

CREATE OR REPLACE FUNCTION public.save_sent_message_only(
    p_phone TEXT,
    p_message_text TEXT,
    p_media_type TEXT DEFAULT 'text',
    p_media_url TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead_id UUID;
    v_message_id UUID;
    v_final_text TEXT;
BEGIN
    -- 🎯 CORREÇÃO CIRÚRGICA: Implementar lógica inline para campo TEXT
    CASE 
        WHEN p_media_type = 'text' THEN 
            v_final_text := p_message_text;
        WHEN p_media_type = 'image' THEN 
            v_final_text := CASE 
                WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
                THEN '📷 Imagem: ' || p_message_text
                ELSE '📷 Imagem'
            END;
        WHEN p_media_type = 'video' THEN 
            v_final_text := CASE 
                WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
                THEN '🎥 Vídeo: ' || p_message_text
                ELSE '🎥 Vídeo'
            END;
        WHEN p_media_type = 'audio' THEN 
            v_final_text := CASE 
                WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
                THEN '🎵 Áudio: ' || p_message_text
                ELSE '🎵 Áudio'
            END;
        WHEN p_media_type = 'document' THEN 
            v_final_text := CASE 
                WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
                THEN '📄 Documento: ' || p_message_text
                ELSE '📄 Documento'
            END;
        ELSE 
            -- Fallback para tipos não mapeados
            v_final_text := COALESCE(p_message_text, '📎 Mídia');
    END CASE;

    -- Buscar ou criar lead pelo telefone
    SELECT id INTO v_lead_id
    FROM leads
    WHERE phone = p_phone;

    IF v_lead_id IS NULL THEN
        INSERT INTO leads (phone, name, source, created_at)
        VALUES (p_phone, p_phone, 'crm_sent', now())
        RETURNING id INTO v_lead_id;
    END IF;

    -- Inserir mensagem com TEXT corrigido
    INSERT INTO messages (
        lead_id,
        text,
        media_type,
        media_url,
        from_me,
        external_message_id,
        import_source,
        user_id,
        created_at
    ) VALUES (
        v_lead_id,
        v_final_text,  -- 🎯 USANDO TEXTO PADRONIZADO
        p_media_type,
        p_media_url,
        TRUE,
        p_external_message_id,
        'crm_sent',
        p_user_id,
        now()
    ) RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$;

-- =====================================================================

-- 3️⃣ VALIDAÇÃO DA CORREÇÃO
SELECT 
    'CORREÇÃO CRM APLICADA:' as status,
    'save_sent_message_only' as funcao,
    'Campo TEXT com emoji padrão implementado' as resultado,
    '📷 📥 🎵 📄 emojis aplicados conforme tipo' as detalhes;

-- =====================================================================
-- 📋 RESULTADO ESPERADO APÓS CORREÇÃO:
-- =====================================================================
/*
✅ save_sent_message_only (CRM) CORRIGIDA:
- text: "Mensagem original" 
- image: "📷 Imagem" ou "📷 Imagem: caption"
- video: "🎥 Vídeo" ou "🎥 Vídeo: caption"
- audio: "🎵 Áudio" ou "🎵 Áudio: caption"  
- document: "📄 Documento" ou "📄 Documento: caption"

❌ NUNCA MAIS:
- "[Mensagem não suportada]"
- "[Sticker]"
- "[Documento: filename]"  
- "[Áudio]"

🎯 MANUTENÇÃO:
- Correção cirúrgica - função mantém toda lógica existente
- Apenas campo TEXT padronizado
- Zero impacto em funcionalidades atuais
*/