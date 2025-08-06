

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO DA VPS (mesma da whatsapp_messaging_service)
const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',
  timeout: 30000
};

serve(async (req) => {
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AI Messaging Service] 🚀 Iniciando processamento - N8N AI Agent com suporte a áudio NATIVO corrigido');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ EXTRAIR DADOS DO PAYLOAD N8N
    const { apiKey, instanceId, leadId, createdByUserId, phone, message, mediaType, mediaUrl, agentId, audioBase64, audioMetadata } = requestBody;

    // ✅ AUTENTICAÇÃO VIA API KEY
    if (!apiKey || !aiAgentApiKey || apiKey !== aiAgentApiKey) {
      console.error('[AI Messaging Service] ❌ API Key inválida ou ausente');
      return new Response(JSON.stringify({
        success: false,
        error: 'API Key inválida ou ausente'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ PROCESSAR ÁUDIO COM DETECÇÃO INTELIGENTE DE FORMATO
    let processedMediaUrl = mediaUrl;
    let processedMediaType = mediaType || 'text';
    let messageText = message || '';
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
          const audioBuffer = new Uint8Array(atob(audioBase64.substring(0, 100)).split('').map(c => c.charCodeAt(0)));
          
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
        
        // ✅ CORREÇÃO PRINCIPAL: MENSAGEM VAZIA PARA ÁUDIO NATIVO
        messageText = '';  // ❗ NÃO USAR '[Áudio]' PARA PTT NATIVO
        
        finalMimeType = detectedMimeType;
        
        console.log('[AI Messaging Service] ✅ Áudio configurado como PTT nativo:', {
          filename: audioFilename,
          duration: audioDuration,
          isPTT: true,
          mimeType: finalMimeType,
          messageIsEmpty: messageText === '',
          dataUrlPrefix: processedMediaUrl.substring(0, 50) + '...'
        });
      } else {
        console.log('[AI Messaging Service] ⚠️ Áudio como encaminhamento (sem PTT)');
        
        // Converter Base64 para DataURL no formato correto
        processedMediaUrl = `data:${detectedMimeType};base64,${audioBase64}`;
        processedMediaType = 'audio';
        messageText = messageText || '';  // ✅ MANTER MENSAGEM ORIGINAL OU VAZIA
        finalMimeType = detectedMimeType;
      }

      console.log('[AI Messaging Service] ✅ Áudio convertido para DataURL:', {
        mediaType: processedMediaType,
        dataUrlLength: processedMediaUrl.length,
        isPTT: isPTT,
        mimeTypeUsed: finalMimeType,
        finalMessageText: messageText === '' ? 'EMPTY' : messageText
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

    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se instância pertence ao usuário
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id, instance_name, connection_status, created_by_user_id')
      .eq('id', instanceId)
      .eq('created_by_user_id', createdByUserId)
      .single();

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se lead pertence ao usuário
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id, phone, name, created_by_user_id')
      .eq('id', leadId)
      .eq('created_by_user_id', createdByUserId)
      .single();

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Messaging Service] 🤖 Enviando mensagem do AI Agent:', {
      instanceName: instanceData.instance_name,
      vpsInstanceId,
      leadName: leadData.name,
      phoneMatch: phone.replace(/\D/g, '') === leadData.phone.replace(/\D/g, ''),
      mediaType: processedMediaType,
      hasAudio: !!audioBase64,
      isPTT: isPTT,
      agentId: agentId || 'N/A'
    });

    // ✅ PREPARAR PAYLOAD PARA VPS COM TODOS OS METADADOS PTT
    const vpsPayload = {
      instanceId: vpsInstanceId,
      phone: phone.replace(/\D/g, ''),
      message: messageText,  // ✅ AGORA SERÁ VAZIO PARA PTT
      mediaType: processedMediaType,
      mediaUrl: processedMediaUrl || null,
      // ✅ NOVOS CAMPOS PARA PTT NATIVO (compatível com VPS corrigida)
      ...(isPTT && {
        ptt: true,
        filename: audioFilename,
        seconds: audioDuration,
        waveform: audioMetadata?.waveform || null,
        audioMimeType: finalMimeType
      })
    };

    console.log('[AI Messaging Service] 📡 Enviando para VPS (ÁUDIO NATIVO OTIMIZADO):', {
      url: `${VPS_CONFIG.baseUrl}/send`,
      payload: {
        ...vpsPayload,
        phone: vpsPayload.phone.substring(0, 4) + '****',
        mediaUrl: vpsPayload.mediaUrl ? vpsPayload.mediaUrl.substring(0, 50) + '...' : null,
        messageIsEmpty: vpsPayload.message === ''
      }
    });

    // ✅ ENVIAR PARA VPS
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
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
        vpsUrl: `${VPS_CONFIG.baseUrl}/send`
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: `Erro na VPS (${vpsResponse.status}): ${errorText.substring(0, 100)}`
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!vpsData?.success) {
      console.error('[AI Messaging Service] ❌ VPS retornou erro:', vpsData);
      return new Response(JSON.stringify({
        success: false,
        error: vpsData?.error || 'Erro desconhecido na VPS'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      vpsInstanceId,
      phone: phone.substring(0, 4) + '****',
      messageTextSaved: messageText === '' ? 'EMPTY_FOR_AUDIO' : messageText
    });

    // ✅ SALVAR MENSAGEM NO BANCO
    console.log('[AI Messaging Service] 💾 Salvando mensagem do AI Agent no banco...');
    
    try {
      const { data: saveResult, error: saveError } = await supabase.rpc(
        'save_whatsapp_message_service_role',
        {
          p_vps_instance_id: vpsInstanceId,
          p_phone: phone.replace(/\D/g, ''),
          p_message_text: messageText,  // ✅ SERÁ VAZIO PARA PTT
          p_from_me: true,
          p_media_type: processedMediaType,
          p_media_url: processedMediaUrl || null,
          p_external_message_id: vpsData.messageId || null,
          p_contact_name: leadData.name || null
        }
      );

      if (saveError) {
        console.error('[AI Messaging Service] ❌ Erro ao salvar mensagem no banco:', saveError);
      } else if (saveResult?.success) {
        console.log('[AI Messaging Service] ✅ Mensagem do AI Agent salva no banco:', {
          messageId: saveResult.data?.message_id,
          leadId: saveResult.data?.lead_id,
          mediaType: processedMediaType,
          hasAudio: !!audioBase64,
          isPTT: isPTT,
          savedText: messageText === '' ? 'EMPTY_STRING' : messageText,
          agentId: agentId || 'N/A',
          source: 'ai_agent'
        });
      }
    } catch (saveError) {
      console.error('[AI Messaging Service] ❌ Erro ao executar RPC de salvamento:', saveError);
    }

    // ✅ RESPOSTA DE SUCESSO PARA O N8N
    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem do AI Agent enviada com sucesso',
      data: {
        messageId: vpsData.messageId,
        instanceId: instanceData.id,
        vpsInstanceId,
        leadId: leadData.id,
        phone: phone.replace(/\D/g, ''),
        mediaType: processedMediaType,
        hasAudio: !!audioBase64,
        isPTT: isPTT,
        finalMimeType: finalMimeType,
        timestamp: vpsData.timestamp || new Date().toISOString(),
        agentId: agentId || null,
        source: 'ai_agent',
        textMessage: messageText === '' ? null : messageText,  // ✅ INDICAR SE MENSAGEM É VAZIA
        user: {
          id: createdByUserId
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Messaging Service] ❌ Erro interno do servidor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

