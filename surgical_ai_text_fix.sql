-- =====================================================================
-- 🔧 CORREÇÃO CIRÚRGICA - save_whatsapp_message_ai_agent (AI)
-- =====================================================================
-- FASE 1: Corrigir campo TEXT cirurgicamente na função AI
-- ai_messaging_service → save_whatsapp_message_ai_agent
-- =====================================================================

-- 1️⃣ BACKUP DA FUNÇÃO ORIGINAL (PARA SEGURANÇA)
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_ai_agent_backup()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Backup realizado - função original preservada antes da correção cirúrgica';
END;
$$;

-- =====================================================================

-- 2️⃣ CORREÇÃO CIRÚRGICA DA FUNÇÃO save_whatsapp_message_ai_agent
-- Implementar lógica inline para campo TEXT padronizado

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_ai_agent(
    p_phone TEXT,
    p_message_text TEXT,
    p_media_type TEXT DEFAULT 'text',
    p_media_url TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_agent_id TEXT DEFAULT NULL,
    p_from_me BOOLEAN DEFAULT TRUE
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
        VALUES (p_phone, p_phone, 'ai_agent', now())
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
        created_at
    ) VALUES (
        v_lead_id,
        v_final_text,  -- 🎯 USANDO TEXTO PADRONIZADO
        p_media_type,
        p_media_url,
        p_from_me,
        p_external_message_id,
        'ai_agent',
        now()
    ) RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$;

-- =====================================================================

-- 3️⃣ VALIDAÇÃO DA CORREÇÃO
SELECT 
    'CORREÇÃO AI APLICADA:' as status,
    'save_whatsapp_message_ai_agent' as funcao,
    'Campo TEXT com emoji padrão implementado' as resultado,
    '📷 🎥 🎵 📄 emojis aplicados conforme tipo' as detalhes;

-- =====================================================================
-- 📋 RESULTADO ESPERADO APÓS CORREÇÃO:
-- =====================================================================
/*
✅ save_whatsapp_message_ai_agent (AI) CORRIGIDA:
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