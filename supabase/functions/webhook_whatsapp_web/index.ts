import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ❌ Método não permitido: ${req.method}`);
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    
    console.log(`[${requestId}] 📡 WhatsApp Web Webhook:`, JSON.stringify(payload, null, 2));

    // Extrair dados padronizados
    const eventType = payload.event || payload.type;
    const instanceId = payload.instanceId || payload.instance || payload.instanceName;
    
    if (!instanceId) {
      console.error(`[${requestId}] ❌ Instance ID não encontrado`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance ID required',
        requestId
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📋 Processando evento: ${eventType} para instância: ${instanceId}`);

    // CASO 1: QR Code gerado
    if (eventType === 'qr.update' || eventType === 'qr_update' || payload.qrCode) {
      return await handleQRCodeUpdate(supabase, payload, instanceId, requestId);
    }

    // CASO 2: Status de conexão atualizado
    if (eventType === 'connection.update' || eventType === 'status_update') {
      return await handleConnectionUpdate(supabase, payload, instanceId, requestId);
    }

    // CASO 3: Nova mensagem recebida
    if (eventType === 'messages.upsert' || eventType === 'message_received') {
      return await handleMessageReceived(supabase, payload, instanceId, requestId);
    }

    console.log(`[${requestId}] ℹ️ Evento não processado:`, eventType);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Event not processed',
      event: eventType,
      requestId
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro geral:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function handleQRCodeUpdate(supabase: any, payload: any, instanceId: string, requestId: string) {
  console.log(`[${requestId}] 📱 Processando QR Code update para: ${instanceId}`);
  
  try {
    const qrCode = payload.qrCode || payload.qr_code || payload.data?.qrCode;
    
    if (!qrCode) {
      console.error(`[${requestId}] ❌ QR Code não encontrado no payload`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'QR Code not found',
        requestId
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Normalizar QR Code para base64
    let normalizedQR = qrCode;
    if (!qrCode.startsWith('data:image/')) {
      normalizedQR = `data:image/png;base64,${qrCode}`;
    }

    // Buscar e atualizar instância
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId);

    if (fetchError || !instances?.length) {
      console.error(`[${requestId}] ❌ Instância não encontrada:`, fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: normalizedQR,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', instances[0].id);

    if (updateError) {
      console.error(`[${requestId}] ❌ Erro ao atualizar QR Code:`, updateError);
      throw updateError;
    }

    console.log(`[${requestId}] ✅ QR Code atualizado com sucesso`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'QR Code updated',
      instanceId: instances[0].id,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no QR Code update:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleConnectionUpdate(supabase: any, payload: any, instanceId: string, requestId: string) {
  console.log(`[${requestId}] 🔗 Processando connection update para: ${instanceId}`);
  
  try {
    const status = payload.status || payload.connection_status || payload.data?.status;
    const phone = payload.phone || payload.number || payload.data?.phone;
    const profileName = payload.profileName || payload.profile_name || payload.data?.profileName;
    
    console.log(`[${requestId}] 📊 Status recebido:`, { status, phone, profileName });

    // Mapear status
    const statusMapping: Record<string, string> = {
      'open': 'connected',
      'ready': 'connected', 
      'connected': 'connected',
      'connecting': 'connecting',
      'disconnected': 'disconnected',
      'error': 'error',
      'waiting_qr': 'waiting_qr'
    };

    const connectionStatus = statusMapping[status] || 'disconnected';
    const webStatus = status;

    // Buscar instância
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId);

    if (fetchError || !instances?.length) {
      console.error(`[${requestId}] ❌ Instância não encontrada:`, fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Preparar dados de atualização
    const updateData: any = {
      connection_status: connectionStatus,
      web_status: webStatus,
      updated_at: new Date().toISOString()
    };

    // Se conectado com sucesso
    if (connectionStatus === 'connected') {
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null; // Limpar QR Code quando conectar
      
      if (phone) updateData.phone = phone;
      if (profileName) updateData.profile_name = profileName;
    }

    // Se desconectado
    if (connectionStatus === 'disconnected') {
      updateData.date_disconnected = new Date().toISOString();
    }

    // Atualizar instância
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instances[0].id);

    if (updateError) {
      console.error(`[${requestId}] ❌ Erro ao atualizar status:`, updateError);
      throw updateError;
    }

    console.log(`[${requestId}] ✅ Status atualizado: ${connectionStatus}`);

    // 🚀 NOVA FUNCIONALIDADE: Trigger automático de importação após conexão
    if (connectionStatus === 'connected') {
      console.log(`[${requestId}] 🔍 Verificando se há importação pendente para instância: ${instances[0].id}`);
      
      try {
        // Verificar se há registro de intenção de importação
        const { data: importIntent, error: intentError } = await supabase
          .from('import_intentions')
          .select('*')
          .eq('instance_id', instances[0].id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (intentError) {
          console.error(`[${requestId}] ❌ Erro ao verificar intenção de importação:`, intentError);
        } else if (importIntent) {
          console.log(`[${requestId}] 📋 Intenção de importação encontrada, iniciando processo automático...`);
          
          // Marcar intenção como processando
          await supabase
            .from('import_intentions')
            .update({ 
              status: 'processing',
              started_at: new Date().toISOString()
            })
            .eq('id', importIntent.id);

          // Aguardar 5 segundos para estabilizar conexão
          setTimeout(async () => {
            try {
              console.log(`[${requestId}] 🚀 Executando importação automática para: ${instances[0].id}`);
              
              // Chamar função de importação via webhook
              const importResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp_chat_import`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({
                  action: 'auto_import_trigger',
                  instanceId: instances[0].id,
                  vpsInstanceId: instanceId,
                  delay: 10000, // 10 segundos de delay para garantir estabilidade
                  triggeredBy: 'connection_webhook',
                  requestId: requestId
                })
              });

              if (importResponse.ok) {
                const importResult = await importResponse.json();
                console.log(`[${requestId}] ✅ Importação automática iniciada:`, importResult);
                
                // Marcar intenção como executada
                await supabase
                  .from('import_intentions')
                  .update({ 
                    status: 'executed',
                    executed_at: new Date().toISOString(),
                    result: importResult
                  })
                  .eq('id', importIntent.id);
              } else {
                throw new Error(`Import request failed: ${importResponse.status}`);
              }
            } catch (autoImportError) {
              console.error(`[${requestId}] ❌ Erro na importação automática:`, autoImportError);
              
              // Marcar intenção como erro
              await supabase
                .from('import_intentions')
                .update({ 
                  status: 'error',
                  error_message: autoImportError.message,
                  executed_at: new Date().toISOString()
                })
                .eq('id', importIntent.id);
            }
          }, 5000);
          
        } else {
          console.log(`[${requestId}] ℹ️ Nenhuma importação pendente encontrada`);
        }
      } catch (triggerError) {
        console.error(`[${requestId}] ❌ Erro no trigger de importação automática:`, triggerError);
        // Não falhar o webhook por erro de trigger
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Connection status updated',
      status: connectionStatus,
      instanceId: instances[0].id,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no connection update:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleMessageReceived(supabase: any, payload: any, instanceId: string, requestId: string) {
  console.log(`[${requestId}] 💬 Processando mensagem para: ${instanceId}`);
  
  try {
    // Buscar instância
    console.error(`[${requestId}] 🔍 BUSCANDO INSTÂNCIA: ${instanceId}`);
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .eq('vps_instance_id', instanceId);

    if (instanceError || !instances?.length) {
      console.error(`[${requestId}] ❌ Instância não encontrada:`, instanceError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const instance = instances[0];

    // ✅ EXTRAÇÃO CORRETA DE DADOS DA MENSAGEM
    let messageText = '';
    let mediaType = 'text';
    let mediaUrl = null;
    let fromMe = false;
    let phone = '';

    // ✅ DETECTAR DIREÇÃO DA MENSAGEM (BILATERAL) - Múltiplas fontes
    const messageData = payload.data || payload.message || payload;
    
    if (messageData?.fromMe !== undefined) {
      fromMe = messageData.fromMe;
    } else if (messageData?.key?.fromMe !== undefined) {
      fromMe = messageData.key.fromMe;
    } else if (payload.fromMe !== undefined) {
      fromMe = payload.fromMe;
    } else if (payload.data?.key?.fromMe !== undefined) {
      fromMe = payload.data.key.fromMe;
    }

    // ✅ EXTRAIR NÚMERO DE TELEFONE - Múltiplas fontes
    phone = extractPhoneFromMessage(messageData) || 
            extractPhoneFromMessage(payload) ||
            payload.from?.replace('@s.whatsapp.net', '') ||
            payload.phone ||
            '';

    // ✅ EXTRAÇÃO COMPLETA DE MÍDIA POR TIPO
    if (messageData.messages && Array.isArray(messageData.messages)) {
      const firstMessage = messageData.messages[0];
      const msg = firstMessage?.message;
      
      if (msg?.conversation) {
        messageText = msg.conversation;
        mediaType = 'text';
      } else if (msg?.extendedTextMessage?.text) {
        messageText = msg.extendedTextMessage.text;
        mediaType = 'text';
      } else if (msg?.imageMessage) {
        messageText = msg.imageMessage.caption || '[Imagem]';
        mediaType = 'image';
        mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;
      } else if (msg?.videoMessage) {
        messageText = msg.videoMessage.caption || '[Vídeo]';
        mediaType = 'video';
        mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;
      } else if (msg?.audioMessage) {
        messageText = '[Áudio]';
        mediaType = 'audio';
        mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;
      } else if (msg?.documentMessage) {
        messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';
        mediaType = 'document';
        mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;
      } else {
        messageText = '[Mensagem de mídia]';
        mediaType = 'text';
      }
    } else {
      // ✅ FORMATO ALTERNATIVO DE PAYLOAD - Múltiplas fontes
      messageText = messageData.body || 
                   messageData.text || 
                   messageData.message?.text || 
                   messageData.message?.conversation ||
                   payload.message?.text ||
                   payload.text ||
                   payload.body ||
                   '[Mídia]';
      
      // Detectar tipo por propriedades do payload
      if (messageData.messageType || messageData.mediaType) {
        const detectedType = messageData.messageType || messageData.mediaType;
        switch (detectedType) {
          case 'imageMessage':
          case 'image':
            mediaType = 'image';
            messageText = messageText === '[Mídia]' ? '[Imagem]' : messageText;
            break;
          case 'videoMessage':
          case 'video':
            mediaType = 'video';
            messageText = messageText === '[Mídia]' ? '[Vídeo]' : messageText;
            break;
          case 'audioMessage':
          case 'audio':
            mediaType = 'audio';
            messageText = messageText === '[Mídia]' ? '[Áudio]' : messageText;
            break;
          case 'documentMessage':
          case 'document':
            mediaType = 'document';
            messageText = messageText === '[Mídia]' ? '[Documento]' : messageText;
            break;
          default:
            mediaType = 'text';
        }
      }
      
      mediaUrl = messageData.mediaUrl || messageData.media_url || payload.mediaUrl || payload.media_url;
    }

    if (!phone) {
      console.log(`[${requestId}] ℹ️ Mensagem ignorada - sem telefone válido`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Message ignored - no phone',
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📞 Mensagem ${fromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${phone} | Tipo: ${mediaType} | Texto: ${messageText.substring(0, 50)}...`);

    // MIGRAÇÃO INTELIGENTE DE LEADS - NUNCA DUPLICAR
    // 1. Buscar lead existente por telefone + usuário (ÚNICO)
    let { data: existingLead, error: leadSearchError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .eq('created_by_user_id', instance.created_by_user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadSearchError) {
      console.error(`[${requestId}] ❌ Erro ao buscar lead:`, leadSearchError);
      throw leadSearchError;
    }

    let lead;
    let migrationInfo = {
      action: 'none',
      lead_updated: false,
      was_orphan: false
    };

    if (existingLead) {
      // 2. LEAD EXISTE - SEMPRE ATUALIZAR COM NOVA INSTÂNCIA
      console.log(`[${requestId}] 👤 Lead existente encontrado: ${existingLead.id}`);
      
      const wasOrphan = !existingLead.whatsapp_number_id;
      
      // SEMPRE atualizar lead para nova instância (resolve leads órfãos)
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({
          whatsapp_number_id: instance.id,  // ← SEMPRE atualizar
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: fromMe ? existingLead.unread_count : (existingLead.unread_count || 0) + 1
        })
        .eq('id', existingLead.id);

      if (updateLeadError) {
        console.error(`[${requestId}] ❌ Erro ao atualizar lead:`, updateLeadError);
        throw updateLeadError;
      }

      lead = { ...existingLead, whatsapp_number_id: instance.id };
      migrationInfo = {
        action: 'updated_existing',
        lead_updated: true,
        was_orphan: wasOrphan
      };
      
      console.log(`[${requestId}] ✅ Lead atualizado${wasOrphan ? ' (era órfão)' : ''}: ${lead.id}`);
    } else {
      // 3. LEAD NÃO EXISTE - Criar novo
      console.log(`[${requestId}] 👤 Criando novo lead para: ${phone}`);
      
      // Buscar funil padrão
      const { data: defaultFunnel } = await supabase
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', instance.created_by_user_id)
        .limit(1)
        .single();

      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: phone,
          name: `Contato ${phone}`,
          whatsapp_number_id: instance.id,
          created_by_user_id: instance.created_by_user_id,
          funnel_id: defaultFunnel?.id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: fromMe ? 0 : 1
        })
        .select()
        .single();

      if (createError) {
        console.error(`[${requestId}] ❌ Erro ao criar lead:`, createError);
        throw createError;
      }
      
      lead = newLead;
      migrationInfo.action = 'created_new';
      console.log(`[${requestId}] ✅ Lead criado: ${lead.id}`);
    }

    // ✅ SALVAR MENSAGEM COMPLETA COM BILATERAL + MÍDIA
    const messagePayload = {
      lead_id: lead.id,
      whatsapp_number_id: instance.id,
      text: messageText,
      from_me: fromMe, // ✅ CAMPO BILATERAL CORRETO
      timestamp: new Date().toISOString(),
      status: fromMe ? 'sent' : 'received', // ✅ STATUS BASEADO NA DIREÇÃO
      created_by_user_id: instance.created_by_user_id,
      media_type: mediaType, // ✅ TIPO DE MÍDIA
      media_url: mediaUrl     // ✅ URL DA MÍDIA
    };

    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert(messagePayload)
      .select('id')
      .single();

    if (messageError) {
      console.error(`[${requestId}] ❌ Erro ao salvar mensagem:`, messageError);
      throw messageError;
    }

    console.log(`[${requestId}] ✅ Mensagem ${fromMe ? 'OUTGOING' : 'INCOMING'} ${mediaType.toUpperCase()} salva com sucesso`);
    console.log(`[${requestId}] 🔄 Migração aplicada:`, migrationInfo);

    // ✅ PROCESSAMENTO AUTOMÁTICO DE MÍDIA PARA CACHE
    console.error(`[${requestId}] 🔍 DEBUG MÍDIA - tipo: "${mediaType}", url: "${mediaUrl}"`);
    console.error(`[${requestId}] 🔍 DEBUG CONDIÇÃO - mediaType !== 'text': ${mediaType !== 'text'}, mediaUrl existe: ${!!mediaUrl}`);
    
    if (mediaType !== 'text' && mediaUrl) {
      console.error(`[${requestId}] 📸 ENTRANDO NO CACHE - ${mediaType}: ${mediaUrl.substring(0, 50)}...`);
      console.error(`[${requestId}] 📋 PARÂMETROS - messageId: ${savedMessage.id}, fileName: ${messageText}`);
      
      try {
        console.error(`[${requestId}] 🚀 CHAMANDO processMediaCache...`);
        await processMediaCache(supabase, savedMessage.id, mediaUrl, mediaType, messageText, requestId);
        console.error(`[${requestId}] ✅ CACHE PROCESSADO COM SUCESSO`);
      } catch (cacheError) {
        console.error(`[${requestId}] ❌ ERRO NO CACHE:`, cacheError);
        console.error(`[${requestId}] ❌ STACK TRACE:`, cacheError.stack);
      }
    } else {
      console.error(`[${requestId}] ⏭️ MÍDIA IGNORADA - tipo: ${mediaType}, url presente: ${!!mediaUrl}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message processed with smart lead migration',
      phone,
      fromMe,
      mediaType,
      leadId: lead.id,
      instanceId: instance.id,
      migration: migrationInfo,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro ao processar mensagem:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function processMediaCache(supabase: any, messageId: string, originalUrl: string, mediaType: string, fileName: string, requestId: string) {
  try {
    console.error(`[${requestId}] 📸 INÍCIO processMediaCache: ${mediaType} - ${originalUrl.substring(0, 50)}...`);
    console.error(`[${requestId}] 📋 Parâmetros: messageId=${messageId}, mediaType=${mediaType}, fileName=${fileName}`);
    
    // Criar cliente com bypass RLS para operações de cache
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Verificar se já existe cache para esta URL (usando service role, sem RLS)
    const { data: existingCache } = await supabaseServiceRole
      .from('media_cache')
      .select('id, cached_url, base64_data')
      .eq('original_url', originalUrl)
      .single();

    if (existingCache) {
      console.log(`[${requestId}] ♻️ Cache já existe, vinculando à mensagem`);
      
      // Apenas vincular à nova mensagem
      await supabaseServiceRole
        .from('media_cache')
        .update({
          message_id: messageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCache.id);
      
      return;
    }

    // Tentar baixar a mídia
    let cachedUrl = null;
    let base64Data = null;
    let fileSize = 0;
    let hash = '';

    try {
      console.log(`[${requestId}] ⬇️ Baixando mídia: ${originalUrl}`);
      
      const response = await fetch(originalUrl, {
        headers: {
          'User-Agent': 'WhatsApp/2.2.24.6 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      fileSize = uint8Array.length;

      // Gerar hash único
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log(`[${requestId}] 📊 Mídia baixada: ${fileSize} bytes, hash: ${hash.substring(0, 16)}...`);

      // Decidir estratégia baseada no tamanho (5MB limite)
      if (fileSize <= 5 * 1024 * 1024) {
        // Arquivos pequenos: salvar como Base64
        base64Data = btoa(String.fromCharCode(...uint8Array));
        console.log(`[${requestId}] 💾 Mídia salva como Base64 (${fileSize} bytes)`);
      } else {
        // Arquivos grandes: salvar no Supabase Storage
        const fileName = `${hash}.${getFileExtension(mediaType)}`;
        const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
          .from('whatsapp-media')
          .upload(fileName, uint8Array, {
            contentType: getContentType(mediaType),
            cacheControl: '31536000' // 1 ano
          });

        if (uploadError) {
          console.error(`[${requestId}] ❌ Erro no upload para storage:`, uploadError);
          throw uploadError;
        }

        // Gerar URL pública
        const { data: urlData } = supabaseServiceRole.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName);
        
        cachedUrl = urlData.publicUrl;
        console.log(`[${requestId}] ☁️ Mídia salva no Storage: ${cachedUrl}`);
      }

    } catch (downloadError) {
      console.error(`[${requestId}] ⚠️ Erro ao baixar mídia (continuando sem cache):`, downloadError);
      // Não falhar a mensagem por erro de mídia
    }

    // Salvar registro no cache (mesmo se download falhou)
    const cachePayload = {
      message_id: messageId,
      original_url: originalUrl,
      cached_url: cachedUrl,
      base64_data: base64Data,
      media_type: mediaType,
      file_size: fileSize || null,
      hash: hash || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`[${requestId}] 💾 Tentando inserir cache:`, JSON.stringify(cachePayload, null, 2));

    const { data: insertedCache, error: cacheError } = await supabaseServiceRole
      .from('media_cache')
      .insert(cachePayload)
      .select();

    if (cacheError) {
      console.error(`[${requestId}] ❌ Erro ao salvar cache:`, cacheError);
      // Não falhar a mensagem por erro de cache
    } else {
      console.log(`[${requestId}] ✅ Cache de mídia processado com sucesso`);
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro geral no processamento de mídia:`, error);
    // Não falhar a mensagem por erro de mídia
  }
}

function getFileExtension(mediaType: string): string {
  const extensions = {
    'image': 'jpg',
    'video': 'mp4',
    'audio': 'ogg',
    'document': 'pdf'
  };
  return extensions[mediaType] || 'bin';
}

function getContentType(mediaType: string): string {
  const contentTypes = {
    'image': 'image/jpeg',
    'video': 'video/mp4',
    'audio': 'audio/ogg',
    'document': 'application/pdf'
  };
  return contentTypes[mediaType] || 'application/octet-stream';
}

function extractPhoneFromMessage(messageData: any): string | null {
  const remoteJid = messageData.key?.remoteJid || messageData.from || messageData.remoteJid;
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}
