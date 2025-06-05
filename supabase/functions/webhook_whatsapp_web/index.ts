import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('[Webhook WhatsApp Web] 📨 WEBHOOK RECEBIDO');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('[Webhook WhatsApp Web] Dados recebidos:', JSON.stringify(webhookData, null, 2));

    const { instanceName, data: messageData, event } = webhookData;
    
    if (!instanceName) {
      console.error('[Webhook WhatsApp Web] ❌ instanceName não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'instanceName não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar instância pelo vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!inner (
          id,
          name
        )
      `)
      .eq('vps_instance_id', instanceName)
      .eq('connection_type', 'web')
      .maybeSingle();

    if (instanceError || !instance) {
      console.error('[Webhook WhatsApp Web] ❌ Instância não encontrada:', instanceName, instanceError);
      
      // CORREÇÃO: Tentar buscar por instance_name como fallback
      const { data: fallbackInstance, error: fallbackError } = await supabase
        .from('whatsapp_instances')
        .select(`
          *,
          companies!inner (
            id,
            name
          )
        `)
        .eq('instance_name', instanceName)
        .eq('connection_type', 'web')
        .maybeSingle();

      if (fallbackError || !fallbackInstance) {
        console.error('[Webhook WhatsApp Web] ❌ Instância não encontrada nem por VPS ID nem por nome:', instanceName);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Instância não encontrada', 
            instanceName,
            debug: { instanceError, fallbackError }
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      instance = fallbackInstance;
      console.log('[Webhook WhatsApp Web] ✅ Instância encontrada via fallback (nome):', instance.instance_name);
    }

    console.log('[Webhook WhatsApp Web] ✅ Instância encontrada:', {
      id: instance.id,
      company: instance.companies?.name,
      company_id: instance.company_id
    });

    // Processar diferentes tipos de eventos
    if (event === 'messages.upsert' && messageData.messages) {
      return await processIncomingMessage(supabase, instance, messageData);
    }

    if (event === 'connection.update') {
      return await processConnectionUpdate(supabase, instance, messageData);
    }

    if (event === 'qr.update') {
      return await processQRUpdate(supabase, instance, messageData);
    }

    console.log('[Webhook WhatsApp Web] ℹ️ Evento não processado:', event);
    return new Response(
      JSON.stringify({ success: true, processed: false, event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processIncomingMessage(supabase: any, instance: any, messageData: any) {
  console.log('[Webhook WhatsApp Web] 📨 Processando mensagem recebida');
  
  try {
    const message = messageData.messages?.[0];
    if (!message) {
      console.log('[Webhook WhatsApp Web] ⏭️ Nenhuma mensagem encontrada');
      return new Response(
        JSON.stringify({ success: true, processed: false, reason: 'no_message' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // NOVA VERIFICAÇÃO: Bloquear mensagens de grupos
    const remoteJid = message.key?.remoteJid;
    if (remoteJid?.includes('@g.us')) {
      console.log('[Webhook WhatsApp Web] 🚫 Mensagem de grupo ignorada:', remoteJid);
      return new Response(
        JSON.stringify({ success: true, processed: false, reason: 'group_message_blocked' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fromNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    const isFromMe = message.key?.fromMe || false;
    
    console.log('[Webhook WhatsApp Web] 👤 De:', fromNumber, '| Empresa:', instance.companies?.name);
    console.log('[Webhook WhatsApp Web] 💬 Mensagem:', messageText);
    console.log('[Webhook WhatsApp Web] 📤 Enviada por mim:', isFromMe);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromNumber)
      .eq('whatsapp_number_id', instance.id)
      .eq('company_id', instance.company_id)
      .maybeSingle();

    if (leadError || !lead) {
      console.log('[Webhook WhatsApp Web] 👤 Criando novo lead');
      
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: fromNumber,
          name: fromNumber,
          whatsapp_number_id: instance.id,
          company_id: instance.company_id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: isFromMe ? 0 : 1
        })
        .select()
        .single();

      if (createError) {
        console.error('[Webhook WhatsApp Web] ❌ Erro ao criar lead:', createError);
        return new Response(
          JSON.stringify({ success: false, error: createError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      lead = newLead;
      console.log('[Webhook WhatsApp Web] ✅ Lead criado:', lead.id);
    } else {
      // Atualizar lead existente - CORRIGIDO: Apenas incrementar unread se não for mensagem enviada por mim
      await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: isFromMe ? lead.unread_count : (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log('[Webhook WhatsApp Web] ✅ Lead atualizado:', lead.id);
    }

    // CORRIGIDO: Salvar TODAS as mensagens (enviadas e recebidas)
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: isFromMe,
        timestamp: new Date().toISOString(),
        external_id: message.key?.id,
        status: isFromMe ? 'sent' : 'received'
      });

    if (messageError) {
      console.error('[Webhook WhatsApp Web] ❌ Erro ao salvar mensagem:', messageError);
      return new Response(
        JSON.stringify({ success: false, error: messageError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Webhook WhatsApp Web] ✅ Mensagem salva:', { 
      fromMe: isFromMe, 
      text: messageText.substring(0, 50) + '...'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: true, 
        leadId: lead.id,
        fromMe: isFromMe,
        company: instance.companies?.name
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ Erro ao processar mensagem:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processConnectionUpdate(supabase: any, instance: any, connectionData: any) {
  console.log('[Webhook WhatsApp Web] 🔌 Processando atualização de conexão');
  
  try {
    const { connection, lastDisconnect } = connectionData;
    
    // Atualizar status da instância
    const updateData: any = {
      connection_status: connection?.state || 'unknown',
      updated_at: new Date().toISOString()
    };

    if (connection?.state === 'open') {
      updateData.date_connected = new Date().toISOString();
      updateData.web_status = 'connected';
    } else if (connection?.state === 'close') {
      updateData.date_disconnected = new Date().toISOString();
      updateData.web_status = 'disconnected';
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook WhatsApp Web] ❌ Erro ao atualizar status:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Webhook WhatsApp Web] ✅ Status atualizado:', updateData);
    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ Erro ao processar conexão:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processQRUpdate(supabase: any, instance: any, qrData: any) {
  console.log('[Webhook WhatsApp Web] 🔳 Processando atualização de QR Code');
  
  try {
    const { qr } = qrData;
    
    if (qr) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qr,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error('[Webhook WhatsApp Web] ❌ Erro ao atualizar QR:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Webhook WhatsApp Web] ✅ QR Code atualizado');
    }

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ Erro ao processar QR:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
