import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// ✅ CONFIGURAÇÃO LIMPA DA VPS (via env)
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL'),
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '60000')
};
// 🚫 REMOVIDO: Função PGMQ antiga - agora usa fluxo direto RPC + Edge
serve(async (req)=>{
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('[Messaging Service] 🚀 Iniciando processamento - FLUXO DIRETO RPC + EDGE');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO MELHORADA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Messaging Service] ❌ Token de autorização ausente ou malformado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório (Bearer token)'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ CLIENTE SUPABASE COM RLS PARA VALIDAÇÃO
    const userToken = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // ✅ VALIDAÇÃO DO USUÁRIO ATUAL
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('[Messaging Service] ❌ Usuário não autenticado:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não autenticado'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ PARSE E VALIDAÇÃO DO BODY
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[Messaging Service] ❌ Erro ao fazer parse do JSON:', parseError);
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
    const { action, instanceId, phone, message, mediaType, mediaUrl, metadata } = requestBody;
    // ✅ VALIDAÇÃO RIGOROSA DOS PARÂMETROS
    if (action !== 'send_message') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action deve ser "send_message"'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ DETECTAR PTT (Push-to-Talk) - áudio nativo do WhatsApp
    const isPTT = metadata?.ptt === true || mediaType === 'ptt';
    const audioFilename = metadata?.filename || null;
    const audioDuration = metadata?.seconds || metadata?.duration || null;
    const audioMimeType = metadata?.mimeType || 'audio/ogg;codecs=opus';

    if (!instanceId || !phone || (!message && !isPTT)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId, phone e message são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('[Messaging Service] 📤 Processando envio de mensagem:', {
      instanceId,
      phone: phone.substring(0, 4) + '****',
      messageLength: message?.length || 0,
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl,
      isPTT,
      audioDuration,
      userId: user.id,
      userEmail: user.email
    });
    // ✅ VERIFICAÇÃO DE PROPRIEDADE DA INSTÂNCIA (SERVICE ROLE PARA BYPASS RLS)
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey);
    const { data: instanceData, error: instanceError } = await supabaseServiceRole.from('whatsapp_instances').select('id, vps_instance_id, instance_name, connection_status, created_by_user_id').eq('id', instanceId).eq('created_by_user_id', user.id).single();
    if (instanceError || !instanceData) {
      console.error('[Messaging Service] ❌ Instância não encontrada para o usuário:', {
        instanceId,
        userId: user.id,
        error: instanceError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Instância não encontrada ou não pertence ao usuário'
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
      console.error('[Messaging Service] ❌ Instância não está conectada:', {
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
    const vpsInstanceId = instanceData.vps_instance_id;
    console.log('[Messaging Service] 🔍 DEBUG VPS Instance:', {
      supabaseInstanceId: instanceData.id,
      vpsInstanceId,
      instanceName: instanceData.instance_name,
      connectionStatus: instanceData.connection_status
    });
    // ✅ CORREÇÃO PROFISSIONAL: VPS espera EXATAMENTE o vps_instance_id
    if (!vpsInstanceId) {
      console.error('[Messaging Service] ❌ vps_instance_id está vazio na tabela whatsapp_instances');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração da instância incompleta - vps_instance_id não configurado'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('[Messaging Service] 🎯 Usando vps_instance_id para VPS:', vpsInstanceId);
    console.log('[Messaging Service] 🔒 Acesso autorizado - Processando com FLUXO DIRETO:', {
      supabaseInstanceId: instanceData.id,
      vpsInstanceId,
      instanceName: instanceData.instance_name,
      connectionStatus: instanceData.connection_status,
      userId: user.id,
      userEmail: user.email
    });
    // ✅ FLUXO DIRETO: Processar todos os tipos de mídia via RPC + Edge
    let processedMediaUrl = mediaUrl;
    let processedMediaType = mediaType;
    let isStorageUrl = false;

    // 🔥 NOVO: Detectar se é URL do Storage Supabase (encaminhamento)
    if (mediaUrl && (mediaUrl.includes('supabase.co/storage') || mediaUrl.startsWith('http'))) {
      isStorageUrl = true;
      console.log('[Messaging Service] 🗄️ URL do Storage detectada (encaminhamento) - usando direto:', {
        url: mediaUrl.substring(0, 100) + '...',
        mediaType
      });
      // Usar URL diretamente sem processar
      processedMediaUrl = mediaUrl;
      processedMediaType = mediaType || 'text';
    } else if (mediaUrl && mediaUrl.startsWith('data:')) {
      console.log('[Messaging Service] 🔍 DataURL detectada - usando fluxo direto RPC + Edge');
    }

    // ✅ PROCESSAMENTO DIRETO (todos os tipos via RPC + Edge)
    {
      console.log('[Messaging Service] ⚡ Processamento DIRETO via RPC + Edge');
      // ✅ DETECTAR TIPO DE MÍDIA (RPC + Edge farão o processamento)
      if (!isStorageUrl && mediaUrl && mediaUrl.startsWith('data:')) {
        console.log('[Messaging Service] 🔄 DataURL detectada - será processada pela RPC + Edge...');
        try {
          // Extrair tipo MIME da DataURL para determinar mediaType
          const mimeMatch = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            console.log('[Messaging Service] 📄 Tipo de mídia detectado:', {
              mimeType,
              size: mediaUrl.length
            });
            // Determinar mediaType baseado no MIME
            if (mimeType.startsWith('image/')) {
              processedMediaType = 'image';
            } else if (mimeType.startsWith('video/')) {
              processedMediaType = 'video';
            } else if (mimeType.startsWith('audio/')) {
              // ✅ Se for PTT, manter como 'audio', não 'ptt'
              processedMediaType = 'audio';
            } else {
              processedMediaType = 'document';
            }
            // Usar DataURL diretamente para VPS
            processedMediaUrl = mediaUrl;
          } else {
            console.log('[Messaging Service] ⚠️ DataURL inválida, usando como texto');
            processedMediaType = 'text';
            processedMediaUrl = null;
          }
        } catch (error) {
          console.error('[Messaging Service] ❌ Erro ao processar DataURL:', error);
          processedMediaType = 'text';
          processedMediaUrl = null;
        }
      }
      // ✅ PAYLOAD CORRETO PARA VPS: usar vps_instance_id diretamente
      // 🔧 CORREÇÃO PTT: Separar mensagem para VPS e banco
      const messageText = isPTT ? '' : (message || '').trim();
      const vpsMessageText = messageText || ' ';  // VPS precisa de algo não vazio

      // ✅ CAMPOS PTT ADICIONAIS
      const pttFields = isPTT ? {
        ptt: true,
        filename: audioFilename,
        seconds: audioDuration,
        audioMimeType: audioMimeType,
        waveform: metadata?.waveform || null
      } : {};

      const vpsPayload = {
        instanceId: vpsInstanceId,
        phone: phone.replace(/\D/g, ''),
        message: vpsMessageText,  // ✅ ' ' para PTT, texto normal para resto
        mediaType: processedMediaType || 'text',
        mediaUrl: processedMediaUrl || null,
        ...pttFields  // ✅ Adiciona campos PTT se aplicável
      };
      console.log('[Messaging Service] 📡 Enviando para VPS (síncrono):', {
        url: `${VPS_CONFIG.baseUrl}/queue/add-message`,
        supabaseInstanceId: instanceData.id,
        vpsInstanceId: vpsInstanceId,
        isPTT,
        payload: {
          ...vpsPayload,
          phone: vpsPayload.phone.substring(0, 4) + '****',
          mediaUrl: vpsPayload.mediaUrl ? vpsPayload.mediaUrl.substring(0, 50) + '...' : null,
          messageIsEmpty: vpsPayload.message === '',
          messageIsSpace: vpsPayload.message === ' '
        }
      });
      const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/queue/add-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
          // redundância opcional compatível com middleware do servidor
          'x-api-token': VPS_CONFIG.authToken,
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(vpsPayload),
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      // ✅ TRATAMENTO DE RESPOSTA DA VPS (INALTERADO)
      if (!vpsResponse.ok) {
        const errorText = await vpsResponse.text();
        console.error('[Messaging Service] ❌ Erro HTTP da VPS:', {
          status: vpsResponse.status,
          statusText: vpsResponse.statusText,
          errorText: errorText.substring(0, 300),
          vpsUrl: `${VPS_CONFIG.baseUrl}/queue/add-message`
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
        console.error('[Messaging Service] ❌ Erro ao fazer parse da resposta da VPS:', parseError);
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
        console.error('[Messaging Service] ❌ VPS retornou erro:', vpsData);
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
      console.log('[Messaging Service] ✅ Mensagem enviada com sucesso (síncrono):', {
        success: vpsData.success,
        messageId: vpsData.messageId || 'N/A',
        timestamp: vpsData.timestamp,
        user: user.email,
        vpsInstanceId,
        phone: phone.substring(0, 4) + '****'
      });
      // ✅ SALVAR MENSAGEM NO BANCO COM RPC ISOLADA APP (FLUXO DIRETO)
      console.log('[Messaging Service] 💾 Salvando mensagem enviada com RPC isolada app - FLUXO DIRETO...');

      // 🎯 Extrair base64 se for DataURL
      let extractedBase64 = null;
      let extractedMimeType = null;
      let finalMediaUrl = null;

      // 🔥 NOVO: Se for URL do Storage, usar direto
      if (isStorageUrl && processedMediaUrl) {
        finalMediaUrl = processedMediaUrl;
        console.log('[Messaging Service] 🗄️ Usando URL do Storage direto (encaminhamento):', finalMediaUrl.substring(0, 100) + '...');
      }
      // Se for DataURL, extrair base64 para upload
      else if (processedMediaUrl && processedMediaUrl.startsWith('data:')) {
        const dataUrlMatch = processedMediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
          extractedMimeType = dataUrlMatch[1];
          extractedBase64 = dataUrlMatch[2];
          finalMediaUrl = null; // Edge vai fazer upload e atualizar
          console.log('[Messaging Service] 📤 Base64 extraído para upload via edge');
        }
      }

      try {
        console.log('[Messaging Service] 📞 Chamando RPC save_sent_message_from_app com params:', {
          p_vps_instance_id: user.id,
          p_phone: phone.replace(/\D/g, ''),
          p_message_text: messageText.substring(0, 50),  // ✅ Usa messageText (vazio para PTT)
          p_from_me: true,
          p_media_type: processedMediaType || 'text',
          p_media_url: finalMediaUrl,  // 🔥 CORRIGIDO: URL do Storage OU null para upload
          p_whatsapp_number_id: instanceData?.id,
          p_external_message_id: vpsData.messageId,
          p_has_base64: !!extractedBase64,
          p_is_forwarded: isStorageUrl,
          isPTT
        });

        const { data: saveResult, error: saveError } = await supabaseServiceRole.rpc('save_sent_message_from_app', {
          p_vps_instance_id: user.id,  // ✅ CORREÇÃO: usar user.id (created_by_user_id)
          p_phone: phone.replace(/\D/g, ''),
          p_message_text: messageText,  // ✅ Vazio para PTT, texto normal para resto
          p_from_me: true,
          p_media_type: processedMediaType || 'text',
          p_media_url: finalMediaUrl,  // 🔥 CORRIGIDO: URL do Storage (encaminhamento) OU NULL (upload)
          p_external_message_id: vpsData.messageId || null,
          p_contact_name: null,
          p_profile_pic_url: null,
          p_base64_data: extractedBase64,  // ✅ Base64 para upload (NULL se for encaminhamento)
          p_mime_type: extractedMimeType,
          p_file_name: null,
          p_whatsapp_number_id: instanceData?.id || null,  // ✅ UUID da instância
          p_source_edge: 'whatsapp_messaging_service'
        });

        console.log('[Messaging Service] 🔍 Resultado da RPC:', {
          hasData: !!saveResult,
          hasError: !!saveError,
          success: saveResult?.success,
          error: saveError?.message || saveError
        });

        if (saveError) {
          console.error('[Messaging Service] ❌ Erro ao salvar mensagem no banco:', saveError);
        } else if (saveResult?.success || saveResult?.data?.success) {
          const savedMessageId = saveResult?.message_id || saveResult?.data?.message_id;
          console.log('[Messaging Service] ✅ Mensagem salva no banco com sucesso!', {
            message_id: savedMessageId,
            lead_id: saveResult?.lead_id || saveResult?.data?.lead_id
          });

          // 🚀 UPLOAD ASSÍNCRONO PARA MÍDIA (fire-and-forget como webhook_whatsapp_web)
          const hadMediaData = !!(extractedBase64 && processedMediaType !== 'text');
          if (hadMediaData && savedMessageId) {
            console.log('[Messaging Service] 📤 Iniciando upload assíncrono (fire-and-forget):', savedMessageId);

            // 🚀 FIRE-AND-FORGET: Não bloquear a resposta
            fetch(`${supabaseUrl}/functions/v1/app_storage_upload`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message_id: savedMessageId,
                file_path: `app/${instanceData?.id}/${savedMessageId}.${extractedMimeType?.split('/')[1] || 'bin'}`,
                base64_data: extractedBase64,
                content_type: extractedMimeType
              })
            })
            .then(response => response.json())
            .then(uploadResult => {
              console.log('[Messaging Service] 📊 Upload resultado:', uploadResult);
              if (uploadResult.success) {
                console.log('[Messaging Service] ✅ Upload concluído com sucesso!');
              } else {
                console.error('[Messaging Service] ❌ Erro no upload:', uploadResult);
              }
            })
            .catch(uploadError => {
              console.error('[Messaging Service] ❌ Erro ao chamar upload:', uploadError);
            });
          }
        } else {
          console.log('[Messaging Service] ⚠️ RPC retornou sem sucesso:', saveResult);
        }
      } catch (saveError) {
        console.error('[Messaging Service] ❌ Erro ao executar RPC de salvamento:', saveError);
      }
      // ✅ RESPOSTA DE SUCESSO PADRONIZADA - FLUXO DIRETO
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem enviada com fluxo direto RPC + Edge',
        data: {
          messageId: vpsData.messageId,
          instanceId: instanceData.id,
          vpsInstanceId,
          phone: phone.replace(/\D/g, ''),
          mediaType: processedMediaType || 'text',
          timestamp: vpsData.timestamp || new Date().toISOString(),
          usedDirectFlow: true,
          uploadInitiated: !!(extractedBase64 && processedMediaType !== 'text'),
          architecture: 'RPC + Edge + WebSocket',
          user: {
            id: user.id,
            email: user.email
          }
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[Messaging Service] ❌ Erro interno do servidor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
