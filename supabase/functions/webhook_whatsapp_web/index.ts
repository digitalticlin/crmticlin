
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Webhook WhatsApp] 📨 MENSAGEM RECEBIDA');
  console.log('[Webhook WhatsApp] Method:', req.method);
  console.log('[Webhook WhatsApp] Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const webhookData = await req.json();
    console.log('[Webhook WhatsApp] 📋 Payload recebido:', JSON.stringify(webhookData, null, 2));

    // Extrair dados da mensagem
    const { 
      instanceName,
      data: messageData,
      event,
      server_url 
    } = webhookData;

    if (!instanceName || !messageData) {
      console.log('[Webhook WhatsApp] ⚠️ Payload incompleto');
      return new Response('Payload incompleto', { status: 400 });
    }

    // CORREÇÃO CRÍTICA: Buscar instância pelo VPS_INSTANCE_ID ao invés de instanceName
    console.log('[Webhook WhatsApp] 🔍 Buscando instância por vps_instance_id:', instanceName);
    
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceName)
      .eq('connection_type', 'web')
      .single();

    if (instanceError || !instance) {
      console.error('[Webhook WhatsApp] ❌ Instância não encontrada:', instanceName);
      return new Response('Instância não encontrada', { status: 404 });
    }

    console.log('[Webhook WhatsApp] ✅ Instância encontrada:', instance.id);

    // Processar diferentes tipos de eventos
    if (event === 'messages.upsert') {
      await processIncomingMessage(supabase, instance, messageData);
    } else if (event === 'connection.update') {
      await processConnectionUpdate(supabase, instance, messageData);
    } else {
      console.log('[Webhook WhatsApp] 📝 Evento não processado:', event);
    }

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp] 💥 Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processIncomingMessage(supabase: any, instance: any, messageData: any) {
  console.log('[Webhook WhatsApp] 📨 Processando mensagem...');
  
  try {
    const message = messageData.messages?.[0];
    if (!message) return;

    const fromNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    console.log('[Webhook WhatsApp] 👤 De:', fromNumber);
    console.log('[Webhook WhatsApp] 💬 Mensagem:', messageText);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromNumber)
      .eq('whatsapp_number_id', instance.id)
      .single();

    if (leadError || !lead) {
      console.log('[Webhook WhatsApp] 👤 Criando novo lead...');
      
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: fromNumber,
          name: fromNumber, // Será atualizado quando soubermos o nome
          whatsapp_number_id: instance.id,
          company_id: instance.company_id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();

      if (createError) {
        console.error('[Webhook WhatsApp] ❌ Erro ao criar lead:', createError);
        return;
      }
      
      lead = newLead;
      console.log('[Webhook WhatsApp] ✅ Lead criado:', lead.id);
    } else {
      // Atualizar lead existente
      await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log('[Webhook WhatsApp] ✅ Lead atualizado:', lead.id);
    }

    // Salvar mensagem
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: false,
        timestamp: new Date().toISOString(),
        external_id: message.key?.id,
        status: 'received'
      });

    if (messageError) {
      console.error('[Webhook WhatsApp] ❌ Erro ao salvar mensagem:', messageError);
    } else {
      console.log('[Webhook WhatsApp] ✅ Mensagem salva no banco');
    }

  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro ao processar mensagem:', error);
  }
}

async function processConnectionUpdate(supabase: any, instance: any, connectionData: any) {
  console.log('[Webhook WhatsApp] 🔗 Processando atualização de conexão...');
  
  try {
    const connectionStatus = connectionData.connection || 'unknown';
    
    await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: connectionStatus,
        web_status: connectionStatus === 'open' ? 'ready' : 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    console.log('[Webhook WhatsApp] ✅ Status de conexão atualizado:', connectionStatus);
    
  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro ao atualizar conexão:', error);
  }
}
