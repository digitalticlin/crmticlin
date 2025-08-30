
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO LIMPA DA VPS (via env)
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL')!,
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '60000')
};

// ✅ FUNÇÃO AUXILIAR PARA PGMQ - FILA DE ENVIO
async function enqueueMessageSending(supabase: any, messageData: any) {
  try {
    const messageTask = {
      ...messageData,
      timestamp: new Date().toISOString(),
      priority: messageData.mediaType === 'text' ? 'high' : 'normal', // Texto tem prioridade
      retryCount: 0
    };

    await supabase.rpc('pgmq_send', {
      queue_name: 'message_sending_queue',
      msg: messageTask
    });

    console.log(`[PGMQ] 📤 Mensagem enfileirada para envio: ${messageData.phone.substring(0, 4)}****`);
    return true;
  } catch (error) {
    console.error(`[PGMQ] ❌ Erro ao enfileirar mensagem: ${error.message}`);
    return false;
  }
}

serve(async (req) => {
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Messaging Service] 🚀 Iniciando processamento - VERSÃO PGMQ OTIMIZADA');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO MELHORADA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Messaging Service] ❌ Token de autorização ausente ou malformado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório (Bearer token)'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, instanceId, phone, message, mediaType, mediaUrl } = requestBody;

    // ✅ VALIDAÇÃO RIGOROSA DOS PARÂMETROS
    if (action !== 'send_message') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action deve ser "send_message"'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!instanceId || !phone || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId, phone e message são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Messaging Service] 📤 Processando envio de mensagem:', {
      instanceId,
      phone: phone.substring(0, 4) + '****',
      messageLength: message.length,
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl,
      userId: user.id,
      userEmail: user.email
    });

    // ✅ VERIFICAÇÃO DE PROPRIEDADE DA INSTÂNCIA (SERVICE ROLE PARA BYPASS RLS)
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey);
    const { data: instanceData, error: instanceError } = await supabaseServiceRole
      .from('whatsapp_instances')
      .select('id, vps_instance_id, instance_name, connection_status, created_by_user_id')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[Messaging Service] 🎯 Usando vps_instance_id para VPS:', vpsInstanceId);
    
    console.log('[Messaging Service] 🔒 Acesso autorizado - Processando com PGMQ:', {
      supabaseInstanceId: instanceData.id,
      vpsInstanceId,
      instanceName: instanceData.instance_name,
      connectionStatus: instanceData.connection_status,
      userId: user.id,
      userEmail: user.email
    });

    // ✅ NOVO: DETECTAR DATAURL PESADA E USAR PGMQ
    let shouldUseAsyncProcessing = false;
    let processedMediaUrl = mediaUrl;
    let processedMediaType = mediaType;
    let mediaCacheUrl = null;

    // Verificar se é DataURL pesada que deve ser processada assincronamente
    if (mediaUrl && mediaUrl.startsWith('data:')) {
      const dataUrlSize = mediaUrl.length;
      const sizeInMB = dataUrlSize / (1024 * 1024);
      
      console.log('[Messaging Service] 🔍 DataURL detectada:', {
        sizeBytes: dataUrlSize,
        sizeMB: sizeInMB.toFixed(2),
        shouldProcessAsync: sizeInMB > 5 // >5MB usar PGMQ
      });

      // ✅ ESTRATÉGIA PGMQ: DataURLs grandes (>5MB) vão para fila
      if (sizeInMB > 5) {
        console.log('[Messaging Service] 🔄 DataURL grande detectada - usando PGMQ assíncrono');
        shouldUseAsyncProcessing = true;
        
        // Preparar dados para fila
        const messageQueueData = {
          action: 'send_message',
          instanceId,
          vpsInstanceId, // ✅ CORREÇÃO: usar vps_instance_id direto
          phone: phone.replace(/\D/g, ''),
          message: message.trim(),
          mediaType,
          mediaUrl,
          userId: user.id,
          userEmail: user.email
        };

        // Enfileirar mensagem para processamento assíncrono
        const queued = await enqueueMessageSending(supabaseServiceRole, messageQueueData);
        
        if (queued) {
          console.log('[Messaging Service] ✅ Mensagem enfileirada para processamento assíncrono');
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Mensagem enfileirada para processamento assíncrono',
            data: {
              queueStatus: 'queued',
              instanceId: instanceData.id,
              vpsInstanceId, // ✅ CORREÇÃO: usar vps_instance_id direto
              phone: phone.replace(/\D/g, ''),
              mediaType: mediaType || 'text',
              timestamp: new Date().toISOString(),
              isAsync: true,
              user: {
                id: user.id,
                email: user.email
              }
            }
          }), {
            status: 202, // Accepted - processamento assíncrono
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          console.log('[Messaging Service] ⚠️ Falha ao enfileirar - continuando processamento síncrono');
          shouldUseAsyncProcessing = false;
        }
      }
    }

    // ✅ PROCESSAMENTO SÍNCRONO (DataURLs pequenas ou fallback)
    if (!shouldUseAsyncProcessing) {
      console.log('[Messaging Service] ⚡ Processamento SÍNCRONO (arquivo pequeno ou texto)');
      
      // ✅ PROCESSAR DATAURL PARA MÍDIA (CÓDIGO ORIGINAL OTIMIZADO)
      if (mediaUrl && mediaUrl.startsWith('data:')) {
        console.log('[Messaging Service] 🔄 Processando DataURL síncrona...');
      
      try {
        // Extrair tipo MIME da DataURL
        const mimeMatch = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];
          
            console.log('[Messaging Service] 📄 Processando mídia síncrona:', {
            mimeType,
            dataSize: base64Data.length,
            totalSize: mediaUrl.length
          });
          
          // Determinar mediaType baseado no MIME
          if (mimeType.startsWith('image/')) {
            processedMediaType = 'image';
          } else if (mimeType.startsWith('video/')) {
            processedMediaType = 'video';
          } else if (mimeType.startsWith('audio/')) {
            processedMediaType = 'audio';
          } else {
            processedMediaType = 'document';
          }

            // ✅ STORAGE APENAS PARA ARQUIVOS PEQUENOS/MÉDIOS
            console.log('[Messaging Service] 🗄️ Tentando salvar no Storage (síncrono)...');
          
          try {
            // 1. Converter DataURL para bytes
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // 2. Gerar nome único do arquivo
            const extension = mimeType.split('/')[1] || 'bin';
            const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
            
                         // 3. Upload para Storage
             const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
               .from('whatsapp-media')
              .upload(fileName, bytes, {
                contentType: mimeType,
                cacheControl: '3600', // 1 hora de cache
                upsert: false
              });
              
            if (uploadError) {
                console.log('[Messaging Service] ⚠️ Storage falhou, usando cache tradicional:', uploadError.message);
              throw uploadError;
            }
            
                         // 4. Obter URL pública
             const { data: urlData } = supabaseServiceRole.storage
               .from('whatsapp-media')
              .getPublicUrl(fileName);
              
            const storageUrl = urlData.publicUrl;
            
              console.log('[Messaging Service] ✅ Arquivo salvo no Storage (síncrono):', {
              fileName,
              storageUrl: storageUrl.substring(0, 80) + '...',
              fileSize: bytes.length
            });
            
              // 5. Cache pequeno apenas com URL do Storage
            const { data: cacheResult, error: cacheError } = await supabaseServiceRole
              .from('media_cache')
              .insert({
                  message_id: null, // Será atualizado após salvar mensagem
                  external_message_id: null, // Será atualizado após salvar mensagem  
                  original_url: storageUrl,
                  base64_data: null, // Não salvar base64 quando tem Storage
                file_name: message.trim() || fileName,
                file_size: bytes.length,
                media_type: processedMediaType,
                  processing_status: 'completed',
                created_at: new Date().toISOString()
              })
              .select('id, original_url')
              .single();

              if (!cacheError) {
                mediaCacheUrl = cacheResult.original_url;
                console.log('[Messaging Service] ✅ URL do Storage salva no cache (síncrono)');
              } else {
              mediaCacheUrl = storageUrl; // Usar Storage URL diretamente
            }
            
          } catch (storageError) {
            console.log('[Messaging Service] ⚠️ Storage não funcionou, usando método anterior...');
            
            // FALLBACK: Método anterior (pequenos arquivos no cache)
            const maxSizeBytes = 6 * 1024; // 6KB
            
              if (mediaUrl.length <= maxSizeBytes) {
              const { data: cacheResult, error: cacheError } = await supabaseServiceRole
                .from('media_cache')
                .insert({
                    message_id: null,
                    external_message_id: null,
                  original_url: mediaUrl,
                  base64_data: base64Data,
                  file_name: message.trim() || 'media',
                  file_size: base64Data.length,
                  media_type: processedMediaType,
                    processing_status: 'completed',
                  created_at: new Date().toISOString()
                })
                .select('id, original_url')
                .single();

                if (!cacheError) {
                mediaCacheUrl = cacheResult.original_url;
                  console.log('[Messaging Service] ✅ DataURL salva no cache (fallback síncrono)');
                }
              }
            }

            // Usar DataURL diretamente para VPS
          processedMediaUrl = mediaUrl;
          processedMediaType = processedMediaType + '_dataurl'; // Sinalizar para VPS
          
        } else {
            console.log('[Messaging Service] ⚠️ DataURL inválida, usando como texto');
          processedMediaType = 'text';
          processedMediaUrl = null;
        }
      } catch (error) {
          console.error('[Messaging Service] ❌ Erro ao processar DataURL síncrona:', error);
        processedMediaType = 'text';
        processedMediaUrl = null;
      }
    }

    // ✅ PAYLOAD CORRETO PARA VPS: usar vps_instance_id diretamente
    const vpsPayload = {
      instanceId: vpsInstanceId, // String como "digitalticlin"
      phone: phone.replace(/\D/g, ''), // Limpar caracteres não numéricos
      message: message.trim(),
        mediaType: processedMediaType || 'text',
        mediaUrl: processedMediaUrl || null
    };

      console.log('[Messaging Service] 📡 Enviando para VPS (síncrono):', {
      url: `${VPS_CONFIG.baseUrl}/queue/add-message`,
      supabaseInstanceId: instanceData.id,
      vpsInstanceId: vpsInstanceId,
      payload: {
        ...vpsPayload,
        phone: vpsPayload.phone.substring(0, 4) + '****',
        mediaUrl: vpsPayload.mediaUrl ? vpsPayload.mediaUrl.substring(0, 50) + '...' : null
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!vpsData?.success) {
      console.error('[Messaging Service] ❌ VPS retornou erro:', vpsData);
      return new Response(JSON.stringify({
        success: false,
        error: vpsData?.error || 'Erro desconhecido na VPS'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    
    // ✅ SALVAR MENSAGEM NO BANCO (INALTERADO)
    console.log('[Messaging Service] 💾 Salvando mensagem enviada no banco com RPC isolada...');
    
    try {
      const { data: saveResult, error: saveError } = await supabaseServiceRole.rpc(
          'save_sent_message_only',
        {
          p_vps_instance_id: vpsInstanceId,
          p_phone: phone.replace(/\D/g, ''),
          p_message_text: message.trim(),
          p_external_message_id: vpsData.messageId || null,
            p_contact_name: null,
            p_media_type: mediaType || 'text',
            p_media_url: mediaCacheUrl ? mediaCacheUrl.substring(0, 200) : null
        }
      );

      if (saveError) {
        console.error('[Messaging Service] ❌ Erro ao salvar mensagem no banco:', saveError);
      } else if (saveResult?.success) {
          console.log('[Messaging Service] ✅ Mensagem salva no banco via RPC isolada');
        
        // ✅ ATUALIZAR MEDIA_CACHE COM OS IDS CORRETOS
        if (mediaCacheUrl && saveResult.data?.message_id && vpsData.messageId) {
          try {
            const { error: updateError } = await supabaseServiceRole
              .from('media_cache')
              .update({
                  message_id: saveResult.data.message_id,
                  external_message_id: vpsData.messageId
              })
              .or(`original_url.eq.${mediaCacheUrl},original_url.like.%${vpsData.messageId}%`)
              .eq('media_type', mediaType || 'text');
              
              if (!updateError) {
                console.log('[Messaging Service] ✅ Media_cache atualizado com IDs');
            }
          } catch (updateError) {
            console.error('[Messaging Service] ⚠️ Erro na atualização do cache:', updateError);
          }
        }
      }
    } catch (saveError) {
      console.error('[Messaging Service] ❌ Erro ao executar RPC de salvamento:', saveError);
    }

      // ✅ RESPOSTA DE SUCESSO PADRONIZADA
    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        messageId: vpsData.messageId,
        instanceId: instanceData.id,
        vpsInstanceId, // ✅ CORREÇÃO: usar vps_instance_id direto
        phone: phone.replace(/\D/g, ''),
        mediaType: mediaType || 'text',
        timestamp: vpsData.timestamp || new Date().toISOString(),
          isAsync: false,
        user: {
          id: user.id,
          email: user.email
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    }

  } catch (error) {
    console.error('[Messaging Service] ❌ Erro interno do servidor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
