import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
serve(async (req)=>{
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    console.log(`[${requestId}] ❌ Método não permitido: ${req.method}`);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    // CONFIGURAÇÃO FORÇADA DE SERVICE ROLE
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
          'x-client-info': 'edge-function-service-role'
        }
      }
    });
    const payload = await req.json();
    console.log(`[${requestId}] 📡 WEBHOOK ROBUSTO - SERVICE ROLE FORÇADO:`, JSON.stringify(payload, null, 2));
    // Extrair dados padronizados
    const eventType = payload.event || payload.type;
    const instanceId = payload.instanceId || payload.instance || payload.instanceName;
    console.log(`[${requestId}] 🔍 Evento: "${eventType}" | Instância: "${instanceId}"`);
    if (!instanceId) {
      console.error(`[${requestId}] ❌ Instance ID não encontrado`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance ID required',
        requestId
      }), { 
        status: 400, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // FOCO ÚNICO: APENAS MENSAGENS
    if (eventType === 'messages.upsert' || eventType === 'message_received') {
      console.log(`[${requestId}] 📨 PROCESSANDO MENSAGEM`);
      return await handleMessageReceived(supabase, payload, instanceId, requestId);
    }
    // Ignorar todos os outros eventos
    console.log(`[${requestId}] ⏭️ Evento ignorado (não é mensagem): ${eventType}`);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Event ignored - not a message',
      event: eventType,
      requestId
    }), { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`[${requestId}] ❌ Erro geral:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function handleMessageReceived(supabase, payload, instanceId, requestId) {
  console.log(`[${requestId}] 💬 PROCESSANDO MENSAGEM PARA: ${instanceId}`);
  try {
    // Buscar instância
    console.log(`[${requestId}] 🔍 Buscando instância: ${instanceId}`);
    const { data: instances, error: instanceError } = await supabase.from('whatsapp_instances').select('id, created_by_user_id').eq('vps_instance_id', instanceId);
    if (instanceError || !instances?.length) {
      console.error(`[${requestId}] ❌ Instância não encontrada:`, instanceError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const instance = instances[0];
    console.log(`[${requestId}] ✅ Instância encontrada: ${instance.id}`);
    // Extração de dados da mensagem
    let messageText = '';
    let mediaType = 'text';
    let mediaUrl = null;
    let fromMe = false;
    let phone = '';
    const messageData = payload.data || payload.message || payload;
    // Detectar direção da mensagem
    if (messageData?.fromMe !== undefined) {
      fromMe = messageData.fromMe;
    } else if (payload.fromMe !== undefined) {
      fromMe = payload.fromMe;
    }
    // Extrair telefone
    phone = extractPhoneFromMessage(messageData) || extractPhoneFromMessage(payload) || payload.from?.replace('@s.whatsapp.net', '') || payload.phone || '';
    // Extrair texto da mensagem
    messageText = messageData.body || messageData.text || payload.message?.text || payload.text || payload.body || '[Mensagem sem texto]';
    if (!phone) {
      console.error(`[${requestId}] ❌ Telefone não encontrado no payload`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Phone not found',
        requestId
      }), { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`[${requestId}] 📞 Mensagem ${fromMe ? 'ENVIADA' : 'RECEBIDA'}: ${phone} | ${messageText}`);
    // Buscar ou criar lead
    console.log(`[${requestId}] 🔍 Buscando lead para telefone: ${phone}`);
    let { data: existingLead, error: leadSearchError } = await supabase.from('leads').select('*').eq('phone', phone).eq('created_by_user_id', instance.created_by_user_id).order('created_at', {
      ascending: false
    }).limit(1).maybeSingle();
    if (leadSearchError) {
      console.error(`[${requestId}] ❌ Erro ao buscar lead:`, leadSearchError);
      throw leadSearchError;
    }
    let lead;
    if (existingLead) {
      console.log(`[${requestId}] 👤 Lead encontrado: ${existingLead.id}`);
      // Atualizar lead
      const { error: updateError } = await supabase.from('leads').update({
        whatsapp_number_id: instance.id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: fromMe ? existingLead.unread_count : (existingLead.unread_count || 0) + 1
      }).eq('id', existingLead.id);
      if (updateError) {
        console.error(`[${requestId}] ❌ Erro ao atualizar lead:`, updateError);
        throw updateError;
      }
      lead = {
        ...existingLead,
        whatsapp_number_id: instance.id
      };
      console.log(`[${requestId}] ✅ Lead atualizado: ${lead.id}`);
    } else {
      console.log(`[${requestId}] 👤 Criando novo lead para: ${phone}`);
      const { data: defaultFunnel } = await supabase.from('funnels').select('id').eq('created_by_user_id', instance.created_by_user_id).limit(1).single();
      const { data: newLead, error: createError } = await supabase.from('leads').insert({
          phone: phone,
          name: `Contato ${phone}`,
          whatsapp_number_id: instance.id,
          created_by_user_id: instance.created_by_user_id,
          funnel_id: defaultFunnel?.id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: fromMe ? 0 : 1
      }).select().single();
      if (createError) {
        console.error(`[${requestId}] ❌ Erro ao criar lead:`, createError);
        throw createError;
      }
      lead = newLead;
      console.log(`[${requestId}] ✅ Lead criado: ${lead.id}`);
    }
    // SALVAR MENSAGEM - DUPLA SEGURANÇA
    console.log(`[${requestId}] 💾 SALVANDO MENSAGEM COM SERVICE ROLE...`);
    const messagePayload = {
      lead_id: lead.id,
      whatsapp_number_id: instance.id,
      text: messageText,
      from_me: fromMe,
      timestamp: new Date().toISOString(),
      status: fromMe ? 'sent' : 'received',
      created_by_user_id: instance.created_by_user_id,
      media_type: mediaType,
      media_url: mediaUrl,
      import_source: 'realtime',
      external_message_id: messageData?.key?.id || `${instanceId}_${Date.now()}`
    };
    console.log(`[${requestId}] 📊 PAYLOAD FINAL:`, JSON.stringify(messagePayload, null, 2));
    const { data: savedMessage, error: messageError } = await supabase.from('messages').insert(messagePayload).select('id').single();
    if (messageError) {
      console.error(`[${requestId}] ❌ ERRO AO SALVAR MENSAGEM:`, {
        code: messageError.code,
        message: messageError.message,
        details: messageError.details,
        hint: messageError.hint,
        payload: messagePayload
      });
      throw messageError;
    }
    console.log(`[${requestId}] ✅ MENSAGEM SALVA COM SUCESSO! ID: ${savedMessage.id}`);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message saved successfully',
      phone,
      fromMe,
      leadId: lead.id,
      messageId: savedMessage.id,
      instanceId: instance.id,
      requestId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`[${requestId}] ❌ ERRO GERAL NO PROCESSAMENTO:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
function extractPhoneFromMessage(messageData) {
  const remoteJid = messageData.key?.remoteJid || messageData.from || messageData.remoteJid;
  if (!remoteJid) return null;
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}
