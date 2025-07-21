
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
    
    console.log(`[${requestId}] 🚀 WhatsApp Web Webhook - VERSÃO FUNCIONAL RECUPERADA:`, JSON.stringify(payload, null, 2));

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

    console.log(`[${requestId}] 🔄 Processando evento: ${eventType} para instância: ${instanceId}`);

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

    console.log(`[${requestId}] ⚠️ Evento não processado:`, eventType);
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
  console.log(`[${requestId}] 💬 Processando mensagem DIRETAMENTE NO BANCO para: ${instanceId}`);
  
  try {
    // Buscar instância
    console.log(`[${requestId}] 🔍 BUSCANDO INSTÂNCIA: ${instanceId}`);
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
      console.log(`[${requestId}] ⚠️ Mensagem ignorada - sem telefone válido`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Message ignored - no phone',
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📱 Mensagem ${fromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${phone} | Tipo: ${mediaType} | Texto: ${messageText.substring(0, 50)}...`);

    // ✅ BUSCAR LEAD POR TELEFONE E USUÁRIO (NÃO POR INSTÂNCIA) - EVITAR DUPLICAÇÃO
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .eq('created_by_user_id', instance.created_by_user_id)
      .single();

    if (leadError || !lead) {
      console.log(`[${requestId}] 🆕 Criando novo lead para: ${phone}`);
      
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
          unread_count: fromMe ? 0 : 1 // ✅ Se é outgoing, não conta como não lida
        })
        .select()
        .single();

      if (createError) {
        console.error(`[${requestId}] ❌ Erro ao criar lead:`, createError);
        throw createError;
      }
      
      lead = newLead;
      console.log(`[${requestId}] ✅ Lead criado: ${lead.id}`);
    } else {
      // ✅ ATUALIZAR LEAD EXISTENTE + GARANTIR INSTÂNCIA CORRETA
      const updateData: any = {
        last_message: messageText,
        last_message_time: new Date().toISOString(),
        whatsapp_number_id: instance.id  // ✅ SEMPRE ATUALIZAR INSTÂNCIA ATUAL
      };

      // ✅ Se é incoming (não from_me), incrementar contador de não lidas
      if (!fromMe) {
        updateData.unread_count = (lead.unread_count || 0) + 1;
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);
      
      console.log(`[${requestId}] ✅ Lead atualizado: ${lead.id} | Instância: ${instance.id} | Direção: ${fromMe ? 'OUTGOING' : 'INCOMING'}`);
    }

    // ✅ SALVAR MENSAGEM USANDO FUNÇÃO SIMPLES
    console.log(`[${requestId}] 💾 Salvando mensagem usando função simples`);
    
    const { data: savedMessageId, error: messageError } = await supabase
      .rpc('save_message_simple', {
        lead_id_param: lead.id,
        instance_id_param: instance.id,
        text_param: messageText,
        from_me_param: fromMe,
        user_id_param: instance.created_by_user_id
      });

    if (messageError) {
      console.error(`[${requestId}] ❌ Erro ao salvar mensagem:`, messageError);
      throw messageError;
    }

    console.log(`[${requestId}] ✅ Mensagem ${fromMe ? 'OUTGOING' : 'INCOMING'} ${mediaType.toUpperCase()} salva com sucesso - FUNÇÃO SIMPLES FUNCIONOU! ID: ${savedMessageId}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message processed and saved',
      phone,
      fromMe,
      mediaType,
      leadId: lead.id,
      instanceId: instance.id,
      requestId,
      method: 'DIRECT_INSERT_WITHOUT_SQL_FUNCTION'
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

function extractPhoneFromMessage(messageData: any): string | null {
  const remoteJid = messageData.key?.remoteJid || messageData.from || messageData.remoteJid;
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}
