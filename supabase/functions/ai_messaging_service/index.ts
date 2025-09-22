import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// ✅ CONFIGURAÇÃO DA VPS (carregada por variáveis de ambiente do Edge Function)
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL'),
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '60000')
};
serve(async (req)=>{
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('[AI Messaging Service] 🚀 Iniciando processamento - N8N AI Agent com suporte a áudio NATIVO corrigido');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const aiAgentApiKey = Deno.env.get('AI_AGENT_API_KEY');
    // ✅ VALIDAÇÃO DE API KEY
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[AI Messaging Service] ❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido no body da requisição'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ EXTRAIR DADOS DO PAYLOAD N8N
    const { apiKey, instanceId, leadId, createdByUserId, phone, message, mediaType, mediaUrl, agentId, audioBase64, audioMetadata } = requestBody;
    // ✅ AUTENTICAÇÃO VIA .env COM FALLBACK FLEXÍVEL
    // - Aceita Authorization: Bearer <AI_AGENT_API_KEY>
    // - Aceita x-api-key / apikey no header
    // - Aceita apiKey no body (legado)
    // - Permite desabilitar exigência via AI_AGENT_REQUIRE_KEY=false
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;
    const headerApiKey = req.headers.get('x-api-key') || req.headers.get('X-Api-Key') || req.headers.get('apikey') || req.headers.get('APIKEY') || null;
    const providedApiKey = bearer || headerApiKey || apiKey || null;
    const requireKey = (Deno.env.get('AI_AGENT_REQUIRE_KEY') ?? 'true').toLowerCase() === 'true';
    if (requireKey) {
      if (!aiAgentApiKey || !providedApiKey || providedApiKey !== aiAgentApiKey) {
        console.error('[AI Messaging Service] ❌ Autenticação falhou (requireKey=true):', {
          hasEnvKey: !!aiAgentApiKey,
          hasProvided: !!providedApiKey,
          mode: bearer ? 'bearer' : headerApiKey ? 'header' : apiKey ? 'body' : 'none'
        });
        return new Response(JSON.stringify({
          success: false,
          error: 'Não autorizado'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      if (!aiAgentApiKey) {
        console.warn('[AI Messaging Service] ⚠️ AI_AGENT_REQUIRE_KEY=false, mas AI_AGENT_API_KEY não está definido');
      } else {
        console.log('[AI Messaging Service] 🔓 AI_AGENT_REQUIRE_KEY=false — prosseguindo sem validar chave no request');
      }
    }
    // ✅ VALIDAÇÃO DOS PARÂMETROS OBRIGATÓRIOS
    if (!instanceId || !leadId || !createdByUserId || !phone) {
      console.error('[AI Messaging Service] ❌ Parâmetros obrigatórios ausentes:', {
        instanceId: !!instanceId,
        leadId: !!leadId,
        createdByUserId: !!createdByUserId,
        phone: !!phone,
        message: !!message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId, leadId, createdByUserId e phone são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ PROCESSAR ÁUDIO COM DETECÇÃO INTELIGENTE DE FORMATO
    let processedMediaUrl = mediaUrl;
    let processedMediaType = mediaType || 'text';
    let messageText = message || '';
    let vpsMessageText = message || ''; // ✅ SEPARAR TEXTO PARA VPS E BANCO
    let isPTT = false;
    let audioFilename = null;
    let audioDuration = null;
    let finalMimeType = null;
    if (audioBase64 && audioBase64.trim().length > 0) {
      console.log('[AI Messaging Service] 🎵 Processando áudio Base64 NATIVO:', {
        audioSize: audioBase64.length,
        sizeKB: Math.round(audioBase64.length / 1024),
        hasMetadata: !!audioMetadata,
        pttFlag: audioMetadata?.ptt,
        originalMimeType: audioMetadata?.mimeType
      });
      // ✅ CORREÇÃO CRÍTICA: DETECTAR FORMATO REAL DO ÁUDIO
      let detectedMimeType = 'audio/ogg'; // padrão
      if (audioMetadata?.mimeType) {
        // 🎯 USAR MIME TYPE DO N8N SE DISPONÍVEL
        detectedMimeType = audioMetadata.mimeType;
        console.log('[AI Messaging Service] 🎯 Usando MIME type do N8N:', detectedMimeType);
      } else {
        // 🔍 FALLBACK: Detectar pelo header do Base64
        try {
          const audioBuffer = new Uint8Array(atob(audioBase64.substring(0, 100)).split('').map((c)=>c.charCodeAt(0)));
          // Verificar headers de arquivo
          if (audioBuffer[0] === 0xFF && audioBuffer[1] === 0xFB) {
            detectedMimeType = 'audio/mp3';
          } else if (audioBuffer[0] === 0x4F && audioBuffer[1] === 0x67 && audioBuffer[2] === 0x67 && audioBuffer[3] === 0x53) {
            detectedMimeType = 'audio/ogg';
          } else {
            // Padrão MP3 se não conseguir detectar (ElevenLabs usa MP3)
            detectedMimeType = 'audio/mp3';
          }
          console.log('[AI Messaging Service] 🔍 MIME type detectado automaticamente:', detectedMimeType);
        } catch (detectError) {
          console.log('[AI Messaging Service] ⚠️ Erro na detecção, usando MP3 como padrão');
          detectedMimeType = 'audio/mp3';
        }
      }
      // ✅ VERIFICAR SE É ÁUDIO PTT NATIVO
      if (audioMetadata && audioMetadata.ptt === true) {
        console.log('[AI Messaging Service] 🎙️ Áudio PTT nativo detectado');
        // 🎯 USAR FORMATO DETECTADO CORRETAMENTE
        processedMediaUrl = `data:${detectedMimeType};base64,${audioBase64}`;
        processedMediaType = 'audio';
        isPTT = true;
        audioFilename = audioMetadata.filename || `ptt_${Date.now()}.${detectedMimeType.includes('mp3') ? 'mp3' : 'ogg'}`;
        audioDuration = audioMetadata.seconds || Math.ceil(audioBase64.length / 4000);
        // ✅ CORREÇÃO PRINCIPAL: SEPARAR MENSAGEM VPS E BANCO
        messageText = ''; // ❗ BANCO: vazio para áudio PTT
        vpsMessageText = ' '; // ❗ VPS: espaço para passar validação mas não atrapalhar áudio
        finalMimeType = detectedMimeType;
        console.log('[AI Messaging Service] ✅ Áudio configurado como PTT nativo:', {
          filename: audioFilename,
          duration: audioDuration,
          isPTT: true,
          mimeType: finalMimeType,
          messageIsEmpty: messageText === '',
          vpsMessage: vpsMessageText,
          dataUrlPrefix: processedMediaUrl.substring(0, 50) + '...'
        });
      } else {
        console.log('[AI Messaging Service] ⚠️ Áudio como encaminhamento (sem PTT)');
        // Converter Base64 para DataURL no formato correto
        processedMediaUrl = `data:${detectedMimeType};base64,${audioBase64}`;
        processedMediaType = 'audio';
        messageText = messageText || ''; // ✅ MANTER MENSAGEM ORIGINAL OU VAZIA
        vpsMessageText = messageText || ' '; // ✅ VPS: espaço se vazio
        finalMimeType = detectedMimeType;
      }
      console.log('[AI Messaging Service] ✅ Áudio convertido para DataURL:', {
        mediaType: processedMediaType,
        dataUrlLength: processedMediaUrl.length,
        isPTT: isPTT,
        mimeTypeUsed: finalMimeType,
        finalMessageText: messageText === '' ? 'EMPTY' : messageText,
        vpsMessageText: vpsMessageText
      });
    }
    console.log('[AI Messaging Service] 📤 Processando mensagem do AI Agent:', {
      instanceId,
      leadId,
      createdByUserId,
      phone: phone.substring(0, 4) + '****',
      messageLength: messageText.length,
      mediaType: processedMediaType,
      hasAudio: !!audioBase64,
      hasMediaUrl: !!processedMediaUrl,
      isPTT: isPTT,
      agentId: agentId || 'N/A'
    });
    // ✅ CLIENTE SUPABASE COM SERVICE ROLE (BYPASS RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🎯 NOVA VERIFICAÇÃO: LIMITE DE MENSAGENS AI
    console.log('[AI Messaging Service] 🔍 Verificando limite de mensagens AI...');

    const { data: usageCheck, error: usageError } = await supabase.rpc(
      'check_and_increment_ai_usage',
      {
        p_user_id: createdByUserId,
        p_increment: false // Primeiro só verifica
      }
    );

    if (usageError) {
      console.error('[AI Messaging Service] ❌ Erro ao verificar uso:', usageError);
    } else if (!usageCheck.allowed) {
      console.error('[AI Messaging Service] ❌ Limite de mensagens atingido:', usageCheck);

      // Retornar erro específico baseado no motivo
      if (usageCheck.reason === 'PLATFORM_BLOCKED') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Plataforma bloqueada por inadimplência',
          code: 'PLATFORM_BLOCKED',
          blocked_since: usageCheck.blocked_since,
          message: 'Regularize seu pagamento para continuar usando o sistema'
        }), {
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (usageCheck.reason === 'LIMIT_EXCEEDED') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Limite de mensagens AI atingido',
          code: 'LIMIT_EXCEEDED',
          usage: {
            used: usageCheck.used,
            limit: usageCheck.limit,
            percentage: usageCheck.percentage
          },
          message: 'Faça upgrade do seu plano para enviar mais mensagens'
        }), {
          status: 429, // Too Many Requests
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (usageCheck.reason === 'NO_ACTIVE_PLAN') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhum plano ativo encontrado',
          code: 'NO_ACTIVE_PLAN',
          message: 'Contrate um plano para usar mensagens AI'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('[AI Messaging Service] ✅ Limite verificado:', {
      used: usageCheck?.used,
      limit: usageCheck?.limit,
      percentage: usageCheck?.percentage,
      plan_type: usageCheck?.is_trial ? 'trial' : 'paid'
    });
    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se instância pertence ao usuário
    const { data: instanceData, error: instanceError } = await supabase.from('whatsapp_instances').select('id, vps_instance_id, instance_name, connection_status, created_by_user_id').eq('id', instanceId).eq('created_by_user_id', createdByUserId).single();
    if (instanceError || !instanceData) {
      console.error('[AI Messaging Service] ❌ Instância não encontrada ou não pertence ao usuário:', {
        instanceId,
        createdByUserId,
        error: instanceError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Instância não encontrada ou não autorizada'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ VERIFICAR SE INSTÂNCIA ESTÁ CONECTADA
    if (instanceData.connection_status !== 'connected') {
      console.error('[AI Messaging Service] ❌ Instância não está conectada:', {
        instanceId,
        status: instanceData.connection_status
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Instância não está conectada (status: ${instanceData.connection_status})`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se lead pertence ao usuário
    const { data: leadData, error: leadError } = await supabase.from('leads').select('id, phone, name, created_by_user_id').eq('id', leadId).eq('created_by_user_id', createdByUserId).single();
    if (leadError || !leadData) {
      console.error('[AI Messaging Service] ❌ Lead não encontrado ou não pertence ao usuário:', {
        leadId,
        createdByUserId,
        error: leadError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead não encontrado ou não autorizado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const vpsInstanceId = instanceData.vps_instance_id;
    if (!vpsInstanceId) {
      console.error('[AI Messaging Service] ❌ VPS Instance ID não encontrado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração da instância incompleta'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 🚨 CORREÇÃO CRÍTICA: Se vps_instance_id é UUID, usar instance_name
    let realVpsInstanceId = vpsInstanceId;
    // Detectar se é UUID (formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vpsInstanceId);
    if (isUUID) {
      console.log(`[AI Messaging Service] 🔧 vps_instance_id é UUID (${vpsInstanceId}), usando instance_name como fallback`);
      realVpsInstanceId = instanceData.instance_name;
      if (!realVpsInstanceId) {
        console.error('[AI Messaging Service] ❌ instance_name também não encontrado');
        return new Response(JSON.stringify({
          success: false,
          error: 'Configuração da instância incompleta - instance_name ausente'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    console.log(`[AI Messaging Service] 🎯 Using real VPS instance ID: ${realVpsInstanceId} (original: ${vpsInstanceId})`);
    console.log('[AI Messaging Service] 🤖 Enviando mensagem do AI Agent:', {
      instanceName: instanceData.instance_name,
      vpsInstanceId: realVpsInstanceId,
      originalVpsInstanceId: vpsInstanceId,
      leadName: leadData.name,
      phoneMatch: phone.replace(/\D/g, '') === leadData.phone.replace(/\D/g, ''),
      mediaType: processedMediaType,
      hasAudio: !!audioBase64,
      isPTT: isPTT,
      agentId: agentId || 'N/A'
    });
    // ✅ PREPARAR PAYLOAD PARA VPS COM CORREÇÃO CRÍTICA DE INSTANCE ID
    const pttFields = isPTT ? {
      ptt: true,
      filename: audioFilename,
      seconds: audioDuration,
      waveform: audioMetadata?.waveform || null,
      audioMimeType: finalMimeType
    } : {};
    const vpsPayload = {
      instanceId: realVpsInstanceId,
      phone: phone.replace(/\D/g, ''),
      message: vpsMessageText,
      mediaType: processedMediaType,
      mediaUrl: processedMediaUrl || null,
      ...pttFields
    };
    console.log('[AI Messaging Service] 📡 Enviando para VPS (CORREÇÃO CRITICAL: instanceId deve ser nome real):', {
      url: `${VPS_CONFIG.baseUrl}/queue/add-message`,
      vpsInstanceIdFromDB: vpsInstanceId,
      payload: {
        ...vpsPayload,
        phone: vpsPayload.phone.substring(0, 4) + '****',
        mediaUrl: vpsPayload.mediaUrl ? vpsPayload.mediaUrl.substring(0, 50) + '...' : null,
        messageIsEmpty: vpsPayload.message === '',
        messageIsSpace: vpsPayload.message === ' ',
        isPTT: isPTT
      }
    });
    // ✅ ENVIAR PARA VPS
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/queue/add-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        // redundância opcional compatível com middleware do servidor
        'x-api-token': VPS_CONFIG.authToken,
        'User-Agent': 'Supabase-AI-Agent/1.0'
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });
    // ✅ TRATAMENTO DE RESPOSTA DA VPS
    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('[AI Messaging Service] ❌ Erro HTTP da VPS:', {
        status: vpsResponse.status,
        statusText: vpsResponse.statusText,
        errorText: errorText.substring(0, 300),
        vpsUrl: `${VPS_CONFIG.baseUrl}/queue/add-message`,
        sentPayload: {
          instanceId: vpsInstanceId,
          phone: phone.substring(0, 4) + '****',
          messageLength: vpsMessageText.length,
          messageContent: vpsMessageText === ' ' ? 'SINGLE_SPACE' : vpsMessageText,
          mediaType: processedMediaType,
          isPTT: isPTT
        }
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Erro na VPS (${vpsResponse.status}): ${errorText.substring(0, 100)}`
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let vpsData;
    try {
      vpsData = await vpsResponse.json();
    } catch (parseError) {
      console.error('[AI Messaging Service] ❌ Erro ao fazer parse da resposta da VPS:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Resposta inválida da VPS'
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!vpsData?.success) {
      console.error('[AI Messaging Service] ❌ VPS retornou erro:', vpsData);
      return new Response(JSON.stringify({
        success: false,
        error: vpsData?.error || 'Erro desconhecido na VPS'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 🎯 INCREMENTAR CONTADOR DE USO
    console.log('[AI Messaging Service] 📊 Incrementando contador de uso...');

    const { data: incrementResult, error: incrementError } = await supabase.rpc(
      'check_and_increment_ai_usage',
      {
        p_user_id: createdByUserId,
        p_increment: true
      }
    );

    if (incrementError) {
      console.error('[AI Messaging Service] ⚠️ Erro ao incrementar uso:', incrementError);
    } else {
      console.log('[AI Messaging Service] ✅ Uso incrementado com sucesso:', {
        used: incrementResult?.used,
        limit: incrementResult?.limit,
        remaining: incrementResult?.remaining
      });
    }

    console.log('[AI Messaging Service] ✅ Mensagem enviada com sucesso pela VPS:', {
      success: vpsData.success,
      messageId: vpsData.messageId || 'N/A',
      timestamp: vpsData.timestamp,
      mediaType: processedMediaType,
      hasAudio: !!audioBase64,
      isPTT: isPTT,
      finalMimeType: finalMimeType,
      agentId: agentId || 'N/A',
      vpsInstanceId: realVpsInstanceId,
      originalVpsInstanceId: vpsInstanceId,
      phone: phone.substring(0, 4) + '****',
      messageTextSaved: messageText === '' ? 'EMPTY_FOR_AUDIO' : messageText,
      vpsMessageSent: vpsMessageText === ' ' ? 'SINGLE_SPACE_FOR_VALIDATION' : vpsMessageText
    });
    // ✅ SALVAR MENSAGEM NO BANCO COM RPC ISOLADA AI (FLUXO DIRETO)
    console.log('[AI Messaging Service] 💾 Salvando mensagem do AI Agent com RPC isolada - FLUXO DIRETO...');

    // 🎯 Extrair base64 se for DataURL
    let extractedBase64 = null;
    let extractedMimeType = null;
    if (processedMediaUrl && processedMediaUrl.startsWith('data:')) {
      const dataUrlMatch = processedMediaUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUrlMatch) {
        extractedMimeType = dataUrlMatch[1];
        extractedBase64 = dataUrlMatch[2];
      }
    }

    try {
      const { data: saveResult, error: saveError } = await supabase.rpc('save_sent_message_from_ai', {
        p_vps_instance_id: realVpsInstanceId,
        p_phone: phone.replace(/\D/g, ''),
        p_message_text: messageText,
        p_from_me: true,
        p_media_type: processedMediaType,
        p_media_url: null,  // ✅ NULL - edge vai atualizar
        p_external_message_id: vpsData.messageId || null,
        p_contact_name: null,  // ✅ NULL - preservar lead existente
        p_profile_pic_url: null,
        p_base64_data: extractedBase64,  // ✅ Base64 para upload
        p_mime_type: extractedMimeType,
        p_file_name: null,
        p_whatsapp_number_id: instanceData?.id || null,
        p_source_edge: 'ai_messaging_service'
      });
      if (saveError) {
        console.error('[AI Messaging Service] ❌ Erro ao salvar mensagem no banco:', saveError);
      } else if (saveResult?.success) {
        console.log('[AI Messaging Service] ✅ Mensagem do AI Agent salva via RPC isolada - FLUXO DIRETO:', {
          messageId: saveResult.data?.message_id,
          leadId: saveResult.data?.lead_id,
          mediaType: processedMediaType,
          hasAudio: !!audioBase64,
          isPTT: isPTT,
          savedText: messageText === '' ? 'EMPTY_STRING' : messageText,
          agentId: agentId || 'N/A',
          source: 'ai_agent',
          uploadInitiated: !!(extractedBase64 && processedMediaType !== 'text'),
          architecture: 'RPC + Edge + WebSocket'
        });
        console.log('[AI Messaging Service] 🚀 Upload iniciado automaticamente pela RPC');
        console.log('[AI Messaging Service] 🔄 Edge ai_storage_upload processará mídia e atualizará URL');
      }
    } catch (saveError) {
      console.error('[AI Messaging Service] ❌ Erro ao executar RPC de salvamento:', saveError);
    }
    // ✅ RESPOSTA DE SUCESSO PARA O N8N - FLUXO DIRETO
    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem do AI Agent enviada com fluxo direto RPC + Edge',
      data: {
        messageId: vpsData.messageId,
        instanceId: instanceData.id,
        vpsInstanceId: realVpsInstanceId,
        leadId: leadData.id,
        phone: phone.replace(/\D/g, ''),
        mediaType: processedMediaType,
        hasAudio: !!audioBase64,
        isPTT: isPTT,
        finalMimeType: finalMimeType,
        timestamp: vpsData.timestamp || new Date().toISOString(),
        agentId: agentId || null,
        source: 'ai_agent',
        textMessage: messageText === '' ? null : messageText,
        vpsMessageSent: vpsMessageText,
        usedDirectFlow: true,
        uploadInitiated: !!(extractedBase64 && processedMediaType !== 'text'),
        architecture: 'RPC + Edge + WebSocket',
        user: {
          id: createdByUserId
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[AI Messaging Service] ❌ Erro interno do servidor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
