
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`[${requestId}] 🚀 WEBHOOK V80 - SERVICE ROLE + POLÍTICAS RLS ANÁLISE`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ❌ Método não permitido: ${req.method}`);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // CORREÇÃO CRÍTICA: Cliente Supabase usando service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // CORREÇÃO: Teste de conectividade simples
    console.log(`[${requestId}] 🔍 Testando conectividade básica...`);
    const { error: connectionTest } = await supabase.from('whatsapp_instances').select('id').limit(1);
    if (connectionTest) {
      console.error(`[${requestId}] ❌ Erro de conectividade:`, connectionTest);
      throw new Error(`Database connection failed: ${connectionTest.message}`);
    }
    console.log(`[${requestId}] ✅ Conectividade confirmada`);

    const payload = await req.json();
    console.log(`[${requestId}] 📥 Payload recebido:`, JSON.stringify(payload, null, 2));
    
    const eventType = payload.event || payload.type;
    const instanceId = payload.instanceId || payload.instance || payload.instanceName;
    
    if (!instanceId) {
      console.error(`[${requestId}] ❌ instanceId não fornecido`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'instanceId é obrigatório',
        requestId
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📝 Evento: ${eventType} | Instância: ${instanceId}`);

    // Processar apenas mensagens
    if (eventType === 'messages.upsert' || eventType === 'message_received') {
      console.log(`[${requestId}] 💬 PROCESSANDO MENSAGEM`);
      return await processMessage(supabase, payload, instanceId, requestId);
    }

    // Ignorar outros eventos
    console.log(`[${requestId}] ⏭️ Evento ignorado: ${eventType}`);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Evento ignorado',
      event: eventType,
      requestId
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ ERRO FATAL:`, error);
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

async function processMessage(supabase: any, payload: any, instanceId: string, requestId: string) {
  try {
    console.log(`[${requestId}] 🔍 Buscando instância: ${instanceId}`);
    
    // CORREÇÃO: Buscar instância usando RLS
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id, instance_name, vps_instance_id')
      .eq('vps_instance_id', instanceId);

    if (instanceError) {
      console.error(`[${requestId}] ❌ Erro ao buscar instância:`, instanceError);
      throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
    }

    if (!instances || instances.length === 0) {
      console.error(`[${requestId}] ❌ Instância não encontrada: ${instanceId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instância não encontrada',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const instance = instances[0];
    console.log(`[${requestId}] ✅ Instância encontrada:`, {
      id: instance.id,
      name: instance.instance_name,
      userId: instance.created_by_user_id
    });

    // Extração de dados da mensagem
    const messageData = extractMessageData(payload, requestId);
    
    if (!messageData) {
      console.error(`[${requestId}] ❌ Dados da mensagem inválidos`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Dados da mensagem inválidos',
        requestId
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📞 Dados processados:`, {
      phone: `${messageData.phone.substring(0, 4)}****`,
      fromMe: messageData.fromMe,
      mediaType: messageData.mediaType,
      textLength: messageData.text?.length || 0
    });

    // CORREÇÃO: Gestão de leads sem forçar schema
    const lead = await findOrCreateLead(supabase, messageData.phone, instance, requestId);
    
    if (!lead) {
      throw new Error('Falha ao criar/encontrar lead');
    }

    // CORREÇÃO CRÍTICA: Salvar mensagem especificando schema public para evitar conflito com realtime.messages
    const message = await saveMessage(supabase, {
      lead_id: lead.id,
      whatsapp_number_id: instance.id,
      text: messageData.text,
      from_me: messageData.fromMe,
      timestamp: new Date().toISOString(),
      status: messageData.fromMe ? 'sent' : 'received',
      created_by_user_id: instance.created_by_user_id,
      media_type: messageData.mediaType,
      media_url: messageData.mediaUrl,
      import_source: 'realtime',
      external_message_id: messageData.messageId
    }, requestId);

    console.log(`[${requestId}] ✅ MENSAGEM SALVA COM SUCESSO! ID: ${message.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mensagem processada com sucesso',
      data: {
        phone: messageData.phone,
        fromMe: messageData.fromMe,
        leadId: lead.id,
        messageId: message.id,
        instanceId: instance.id,
        mediaType: messageData.mediaType
      },
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no processamento:`, error);
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

function extractMessageData(payload: any, requestId: string) {
  console.log(`[${requestId}] 🔍 Extraindo dados da mensagem...`);
  
    let messageText = '';
    let mediaType = 'text';
    let mediaUrl = null;
    let fromMe = false;
    let phone = '';
  let messageId = '';

    const messageData = payload.data || payload.message || payload;
    
  // Detectar direção da mensagem
  fromMe = messageData?.fromMe !== undefined ? messageData.fromMe : 
           payload.fromMe !== undefined ? payload.fromMe : false;

  // Extrair telefone
    phone = extractPhoneFromMessage(messageData) || 
            extractPhoneFromMessage(payload) ||
            payload.from?.replace('@s.whatsapp.net', '') ||
          payload.phone || '';

  if (!phone) {
    console.error(`[${requestId}] ❌ Telefone não encontrado`);
    return null;
  }

  // Extrair ID da mensagem
  messageId = messageData?.key?.id || 
              messageData?.messageId || 
              payload.messageId || 
              `${payload.instanceId || 'unknown'}_${Date.now()}`;

  // Extrair conteúdo baseado no tipo de mídia
  if (messageData?.message) {
    const msg = messageData.message;
    
    if (msg.conversation) {
        messageText = msg.conversation;
        mediaType = 'text';
    }
    else if (msg.extendedTextMessage?.text) {
        messageText = msg.extendedTextMessage.text;
        mediaType = 'text';
    }
    else if (msg.imageMessage) {
        messageText = msg.imageMessage.caption || '[Imagem]';
        mediaType = 'image';
      mediaUrl = msg.imageMessage.url || null;
    }
    else if (msg.videoMessage) {
        messageText = msg.videoMessage.caption || '[Vídeo]';
        mediaType = 'video';
      mediaUrl = msg.videoMessage.url || null;
    }
    else if (msg.audioMessage) {
        messageText = '[Áudio]';
        mediaType = 'audio';
      mediaUrl = msg.audioMessage.url || null;
    }
    else if (msg.documentMessage) {
      messageText = msg.documentMessage.title || msg.documentMessage.fileName || '[Documento]';
        mediaType = 'document';
      mediaUrl = msg.documentMessage.url || null;
    }
    else if (msg.stickerMessage) {
      messageText = '[Sticker]';
      mediaType = 'image';
      mediaUrl = msg.stickerMessage.url || null;
    }
  }
  else {
      messageText = messageData.body || 
                   messageData.text || 
                   payload.message?.text ||
                   payload.text ||
                   payload.body ||
                  '[Mensagem sem texto]';
    
    if (payload.messageType) {
      mediaType = payload.messageType;
    } else if (messageData.messageType) {
      mediaType = messageData.messageType;
    }
    
    mediaUrl = messageData.mediaUrl || payload.mediaUrl || null;
  }

  return {
    phone,
    text: messageText,
    fromMe,
    mediaType,
    mediaUrl,
    messageId
  };
}

function extractPhoneFromMessage(messageData: any): string | null {
  if (!messageData) return null;
  
  const remoteJid = messageData.key?.remoteJid || 
                    messageData.from || 
                    messageData.remoteJid;
  
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}

// CORREÇÃO: Buscar ou criar lead usando RLS
async function findOrCreateLead(supabase: any, phone: string, instance: any, requestId: string) {
  console.log(`[${requestId}] 👤 Buscando lead para telefone: ${phone}`);
  
  try {
    // Buscar lead existente usando RLS
    const { data: existingLead, error: searchError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .eq('created_by_user_id', instance.created_by_user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.error(`[${requestId}] ❌ Erro ao buscar lead:`, searchError);
      throw new Error(`Erro ao buscar lead: ${searchError.message}`);
    }

    if (existingLead) {
      console.log(`[${requestId}] 👤 Lead encontrado: ${existingLead.id}`);
      
      // Atualizar informações do lead usando RLS
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          whatsapp_number_id: instance.id,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.warn(`[${requestId}] ⚠️ Erro ao atualizar lead:`, updateError);
      } else {
        console.log(`[${requestId}] ✅ Lead atualizado`);
      }

      return { ...existingLead, whatsapp_number_id: instance.id };
    }

    // Criar novo lead
    console.log(`[${requestId}] 🆕 Criando NOVO lead`);
      
      // Buscar funil padrão usando RLS
    const { data: funnel } = await supabase
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', instance.created_by_user_id)
        .limit(1)
      .maybeSingle();

    // Criar novo lead usando RLS
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: phone,
          name: `Contato ${phone}`,
          whatsapp_number_id: instance.id,
          created_by_user_id: instance.created_by_user_id,
        funnel_id: funnel?.id,
        last_message_time: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`[${requestId}] ❌ Erro ao criar lead:`, createError);
      throw new Error(`Erro ao criar lead: ${createError.message}`);
    }

    console.log(`[${requestId}] ✅ Lead criado: ${newLead.id}`);
    return newLead;

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro fatal na gestão de lead:`, error);
    throw error;
  }
}

// CORREÇÃO: Salvar mensagem usando service role - deve ignorar RLS
async function saveMessage(supabase: any, messageData: any, requestId: string) {
  console.log(`[${requestId}] 💾 SALVANDO MENSAGEM - Service role deve ignorar RLS`);
  
  try {
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('id')
      .single();

    if (messageError) {
      console.error(`[${requestId}] ❌ Erro ao salvar mensagem:`, messageError);
      console.error(`[${requestId}] 📋 Detalhes do erro:`, JSON.stringify(messageError, null, 2));
      throw new Error(`Falha ao salvar mensagem: ${messageError.message}`);
    }

    console.log(`[${requestId}] ✅ Mensagem salva com sucesso`);
    return savedMessage;

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro inesperado ao salvar:`, error);
    throw error;
  }
}
