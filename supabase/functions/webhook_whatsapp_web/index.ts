
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Cache para instâncias e funnels (FASE 4: Otimização)
const instanceCache = new Map();
const funnelCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`[${requestId}] 🚀 WEBHOOK INICIANDO - VERSÃO CORRIGIDA`);
  
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
    // FASE 1: Configuração robusta do cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'authorization': `Bearer ${supabaseServiceKey}`,
          'x-client-info': 'webhook-whatsapp-web-corrected'
        }
      }
    });

    // Teste de conectividade
    const { error: connectionTest } = await supabase.from('whatsapp_instances').select('id').limit(1);
    if (connectionTest) {
      console.error(`[${requestId}] ❌ Erro de conectividade:`, connectionTest);
      throw new Error(`Database connection failed: ${connectionTest.message}`);
    }

    const payload = await req.json();
    console.log(`[${requestId}] 📥 Payload recebido:`, JSON.stringify(payload, null, 2));

    // FASE 3: Validação completa do payload
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
    
    // FASE 4: Usar cache para instâncias
    let instance = getCachedData(instanceCache, instanceId);
    
    if (!instance) {
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

      instance = instances[0];
      setCachedData(instanceCache, instanceId, instance);
    }

    console.log(`[${requestId}] ✅ Instância encontrada:`, {
      id: instance.id,
      name: instance.instance_name,
      userId: instance.created_by_user_id
    });

    // FASE 2: Extração robusta de dados da mensagem
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

    // FASE 1: Gestão robusta de leads
    const lead = await findOrCreateLead(supabase, messageData.phone, instance, requestId);
    
    if (!lead) {
      throw new Error('Falha ao criar/encontrar lead');
    }

    // FASE 1: Salvar mensagem com retry logic
    const message = await saveMessageWithRetry(supabase, {
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
    }, requestId, 3);

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

// FASE 2: Extração robusta de dados de mensagem
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

  // FASE 2: Extrair conteúdo baseado no tipo de mídia
  if (messageData?.message) {
    const msg = messageData.message;
    
    // Texto simples
    if (msg.conversation) {
      messageText = msg.conversation;
      mediaType = 'text';
    }
    // Texto estendido
    else if (msg.extendedTextMessage?.text) {
      messageText = msg.extendedTextMessage.text;
      mediaType = 'text';
    }
    // Imagem
    else if (msg.imageMessage) {
      messageText = msg.imageMessage.caption || '[Imagem]';
      mediaType = 'image';
      mediaUrl = msg.imageMessage.url || null;
    }
    // Vídeo
    else if (msg.videoMessage) {
      messageText = msg.videoMessage.caption || '[Vídeo]';
      mediaType = 'video';
      mediaUrl = msg.videoMessage.url || null;
    }
    // Áudio
    else if (msg.audioMessage) {
      messageText = '[Áudio]';
      mediaType = 'audio';
      mediaUrl = msg.audioMessage.url || null;
    }
    // Documento
    else if (msg.documentMessage) {
      messageText = msg.documentMessage.title || msg.documentMessage.fileName || '[Documento]';
      mediaType = 'document';
      mediaUrl = msg.documentMessage.url || null;
    }
    // Sticker
    else if (msg.stickerMessage) {
      messageText = '[Sticker]';
      mediaType = 'image';
      mediaUrl = msg.stickerMessage.url || null;
    }
  }
  // Fallback para estruturas diferentes
  else {
    messageText = messageData.body || 
                  messageData.text || 
                  payload.message?.text || 
                  payload.text || 
                  payload.body || 
                  '[Mensagem sem texto]';
    
    // Detectar tipo de mídia por outros campos
    if (payload.messageType) {
      mediaType = payload.messageType;
    } else if (messageData.messageType) {
      mediaType = messageData.messageType;
    }
    
    // URL de mídia
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

// FASE 1: Buscar ou criar lead com lógica simplificada
async function findOrCreateLead(supabase: any, phone: string, instance: any, requestId: string) {
  console.log(`[${requestId}] 👤 Buscando lead para telefone: ${phone}`);
  
  try {
    // Buscar lead existente
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
      
      // Atualizar informações do lead
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
    
    // FASE 4: Buscar funil padrão com cache
    let defaultFunnel = getCachedData(funnelCache, instance.created_by_user_id);
    
    if (!defaultFunnel) {
      const { data: funnel } = await supabase
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', instance.created_by_user_id)
        .limit(1)
        .maybeSingle();
      
      defaultFunnel = funnel;
      if (defaultFunnel) {
        setCachedData(funnelCache, instance.created_by_user_id, defaultFunnel);
      }
    }

    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        phone: phone,
        name: `Contato ${phone}`,
        whatsapp_number_id: instance.id,
        created_by_user_id: instance.created_by_user_id,
        funnel_id: defaultFunnel?.id,
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

// FASE 3: Salvar mensagem com retry logic
async function saveMessageWithRetry(supabase: any, messageData: any, requestId: string, maxRetries: number = 3) {
  console.log(`[${requestId}] 💾 Salvando mensagem...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${requestId}] 📝 Tentativa ${attempt}/${maxRetries}`);
      
      const { data: savedMessage, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('id')
        .single();

      if (messageError) {
        console.error(`[${requestId}] ❌ Erro na tentativa ${attempt}:`, messageError);
        
        if (attempt === maxRetries) {
          throw new Error(`Falha ao salvar mensagem após ${maxRetries} tentativas: ${messageError.message}`);
        }
        
        // Aguardar antes da próxima tentativa (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      console.log(`[${requestId}] ✅ Mensagem salva na tentativa ${attempt}`);
      return savedMessage;

    } catch (error) {
      console.error(`[${requestId}] ❌ Erro inesperado na tentativa ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
