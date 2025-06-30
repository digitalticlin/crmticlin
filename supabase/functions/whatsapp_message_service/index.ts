import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    
    console.log('[Message Service] 📨 Payload recebido:', JSON.stringify(payload, null, 2));

    // Extrair dados da mensagem
    const { 
      instanceId, 
      instanceName, 
      event, 
      data,
      from,
      to,
      message,
      timestamp 
    } = payload;

    if (!instanceId && !instanceName) {
      console.error('[Message Service] ❌ Instance ID/Name não fornecido');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance ID ou Name obrigatório' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Buscar instância WhatsApp
    let instanceQuery = supabase.from('whatsapp_instances').select('*');
    
    if (instanceId) {
      instanceQuery = instanceQuery.eq('vps_instance_id', instanceId);
    } else if (instanceName) {
      instanceQuery = instanceQuery.eq('instance_name', instanceName);
    }

    const { data: instance, error: instanceError } = await instanceQuery.single();

    if (instanceError || !instance) {
      console.error('[Message Service] ❌ Instância não encontrada:', instanceError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instância não encontrada' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[Message Service] ✅ Instância encontrada: ${instance.id} (${instance.instance_name})`);

    // Processar mensagem recebida
    if (event === 'message_received' || message) {
      return await processIncomingMessage(supabase, instance, payload);
    }

    // Processar atualização de status
    if (event === 'status_update') {
      return await processStatusUpdate(supabase, instance, payload);
    }

    // Log do evento não processado
    console.log('[Message Service] ℹ️ Evento não processado:', event);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Evento recebido mas não processado',
      event 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('[Message Service] ❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function processIncomingMessage(supabase: any, instance: any, payload: any) {
  console.log('[Message Service] 📬 Processando mensagem recebida');
  
  try {
    const { from, message, timestamp, data } = payload;
    
    // ✅ EXTRAÇÃO CORRETA DE DADOS DA MENSAGEM
    let messageText = '';
    let mediaType = 'text';
    let mediaUrl = null;
    let fromMe = false;
    let phoneNumber = '';

    // ✅ DETECTAR DIREÇÃO DA MENSAGEM (BILATERAL)
    if (data?.fromMe !== undefined) {
      fromMe = data.fromMe;
    } else if (data?.key?.fromMe !== undefined) {
      fromMe = data.key.fromMe;
    } else if (payload.fromMe !== undefined) {
      fromMe = payload.fromMe;
    } else if (message?.fromMe !== undefined) {
      fromMe = message.fromMe;
    }

    // ✅ EXTRAIR NÚMERO DE TELEFONE
    phoneNumber = from || data?.from || data?.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    if (!phoneNumber && data?.key?.remoteJid) {
      const phoneMatch = data.key.remoteJid.match(/(\d+)@/);
      phoneNumber = phoneMatch ? phoneMatch[1] : '';
    }

    // ✅ EXTRAÇÃO COMPLETA DE MÍDIA POR TIPO
    if (data?.messages && Array.isArray(data.messages)) {
      const firstMessage = data.messages[0];
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
      // ✅ FORMATO ALTERNATIVO DE PAYLOAD
      messageText = message?.text || message?.body || data?.message?.conversation || data?.body || '[Mídia]';
      
      // Detectar tipo por propriedades do payload
      if (data?.mediaType || message?.mediaType) {
        const detectedType = data?.mediaType || message?.mediaType;
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
      
      mediaUrl = data?.mediaUrl || message?.mediaUrl || data?.media_url || message?.media_url;
    }
    
    if (!phoneNumber) {
      console.log('[Message Service] ⚠️ Número de telefone não identificado');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Mensagem ignorada - número não identificado' 
      }), { 
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[Message Service] 📞 Mensagem ${fromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${phoneNumber} | Tipo: ${mediaType} | Texto: ${messageText.substring(0, 50)}...`);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('whatsapp_number_id', instance.id)
      .eq('created_by_user_id', instance.created_by_user_id)
      .single();

    if (leadError || !lead) {
      console.log('[Message Service] 👤 Criando novo lead');
      
      // Buscar funil padrão do usuário
      const { data: defaultFunnel } = await supabase
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', instance.created_by_user_id)
        .limit(1)
        .single();

      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: phoneNumber,
          name: `Contato ${phoneNumber}`,
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
        console.error('[Message Service] ❌ Erro ao criar lead:', createError);
        throw createError;
      }
      
      lead = newLead;
      console.log(`[Message Service] ✅ Lead criado: ${lead.id}`);
    } else {
      // Atualizar lead existente
      const updateData: any = {
        last_message: messageText,
        last_message_time: new Date().toISOString(),
      };

      // ✅ Se é incoming (não from_me), incrementar contador de não lidas
      if (!fromMe) {
        updateData.unread_count = (lead.unread_count || 0) + 1;
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);
      
      console.log(`[Message Service] ✅ Lead atualizado: ${lead.id}`);
    }

    // ✅ SALVAR MENSAGEM COMPLETA COM BILATERAL + MÍDIA
    const messagePayload = {
      lead_id: lead.id,
      whatsapp_number_id: instance.id,
      text: messageText,
      from_me: fromMe, // ✅ CAMPO BILATERAL CORRETO
      timestamp: timestamp || new Date().toISOString(),
      status: fromMe ? 'sent' : 'received', // ✅ STATUS BASEADO NA DIREÇÃO
      created_by_user_id: instance.created_by_user_id,
      media_type: mediaType, // ✅ TIPO DE MÍDIA
      media_url: mediaUrl     // ✅ URL DA MÍDIA
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert(messagePayload);

    if (messageError) {
      console.error('[Message Service] ❌ Erro ao salvar mensagem:', messageError);
      throw messageError;
    }

    console.log(`[Message Service] ✅ Mensagem ${fromMe ? 'OUTGOING' : 'INCOMING'} ${mediaType.toUpperCase()} salva com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem processada com sucesso',
      leadId: lead.id,
      leadCreated: !leadError,
      fromMe: fromMe,
      mediaType: mediaType
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Message Service] ❌ Erro ao processar mensagem:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }
}

async function processStatusUpdate(supabase: any, instance: any, payload: any) {
  console.log('[Message Service] 🔄 Processando atualização de status');
  
  try {
    const { status, phone, profileName } = payload;
    
    const updateData: any = {
      web_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'connected' || status === 'ready') {
      updateData.connection_status = 'connected';
      updateData.date_connected = new Date().toISOString();
      if (phone) updateData.phone = phone;
      if (profileName) updateData.profile_name = profileName;
    } else if (status === 'disconnected') {
      updateData.connection_status = 'disconnected';
      updateData.date_disconnected = new Date().toISOString();
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (error) {
      console.error('[Message Service] ❌ Erro ao atualizar status:', error);
      throw error;
    }

    console.log(`[Message Service] ✅ Status atualizado: ${status}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Status atualizado com sucesso',
      status
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Message Service] ❌ Erro ao atualizar status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  }
}
