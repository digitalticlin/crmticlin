
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    
    console.log('[Webhook WhatsApp] 📡 Payload recebido:', JSON.stringify(payload, null, 2));

    // Verificar tipo de evento
    const eventType = payload.event || payload.type;
    const instanceId = payload.instance || payload.instanceId;
    
    if (!instanceId) {
      console.error('[Webhook WhatsApp] ❌ Instance ID não encontrado');
      return new Response(JSON.stringify({ success: false, error: 'Instance ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // CASO 1: QR Code gerado
    if (eventType === 'qr.update' || eventType === 'qr_code' || payload.qrCode) {
      return await handleQRCodeUpdate(supabase, payload, instanceId);
    }

    // CASO 2: Status de conexão atualizado
    if (eventType === 'connection.update' || eventType === 'status_update') {
      return await handleConnectionUpdate(supabase, payload, instanceId);
    }

    // CASO 3: Nova mensagem recebida
    if (eventType === 'messages.upsert' || eventType === 'message_received') {
      return await handleMessageReceived(supabase, payload, instanceId);
    }

    console.log('[Webhook WhatsApp] ℹ️ Evento não processado:', eventType);
    return new Response(JSON.stringify({ success: true, message: 'Event not processed' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function handleQRCodeUpdate(supabase: any, payload: any, instanceId: string) {
  console.log('[Webhook WhatsApp] 📱 Processando QR Code update para:', instanceId);
  
  try {
    const qrCode = payload.qrCode || payload.qr_code || payload.data?.qrCode;
    
    if (!qrCode) {
      console.error('[Webhook WhatsApp] ❌ QR Code não encontrado no payload');
      return new Response(JSON.stringify({ success: false, error: 'QR Code not found' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Normalizar QR Code para base64
    let normalizedQR = qrCode;
    if (!qrCode.startsWith('data:image/')) {
      normalizedQR = `data:image/png;base64,${qrCode}`;
    }

    // Atualizar instância com QR Code
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: normalizedQR,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook WhatsApp] ❌ Erro ao atualizar QR Code:', error);
      throw error;
    }

    console.log('[Webhook WhatsApp] ✅ QR Code atualizado com sucesso');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'QR Code updated',
      instanceId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro no QR Code update:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

async function handleConnectionUpdate(supabase: any, payload: any, instanceId: string) {
  console.log('[Webhook WhatsApp] 🔗 Processando connection update para:', instanceId);
  
  try {
    const status = payload.status || payload.connection_status || payload.data?.status;
    const phone = payload.phone || payload.number || payload.data?.phone;
    const profileName = payload.profileName || payload.profile_name || payload.data?.profileName;
    
    console.log('[Webhook WhatsApp] 📊 Status recebido:', { status, phone, profileName });

    // Mapear status
    const statusMapping = {
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
    const { data: instance, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instanceId)
      .select()
      .single();

    if (updateError) {
      console.error('[Webhook WhatsApp] ❌ Erro ao atualizar status:', updateError);
      throw updateError;
    }

    console.log('[Webhook WhatsApp] ✅ Status atualizado:', connectionStatus);

    // Se conectado com sucesso, acionar importação de chats
    if (connectionStatus === 'connected' && instance) {
      console.log('[Webhook WhatsApp] 🚀 Acionando importação de chats...');
      
      // Chamar edge function de importação (assíncrono)
      supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_chats_gradual',
          instanceId: instance.id,
          vpsInstanceId: instanceId
        }
      }).catch(error => {
        console.error('[Webhook WhatsApp] ⚠️ Erro ao acionar importação:', error);
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Connection status updated',
      status: connectionStatus,
      instanceId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro no connection update:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

async function handleMessageReceived(supabase: any, payload: any, instanceId: string) {
  console.log('[Webhook WhatsApp] 💬 Processando mensagem recebida para:', instanceId);
  
  try {
    // Buscar instância
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error('[Webhook WhatsApp] ❌ Instância não encontrada:', instanceError);
      throw new Error('Instance not found');
    }

    // Processar mensagem (aqui você pode expandir a lógica)
    const messageData = payload.data || payload.message || payload;
    const phone = extractPhoneFromMessage(messageData);
    const text = messageData.body || messageData.text || '';
    const fromMe = messageData.key?.fromMe || false;

    if (!phone || fromMe) {
      return new Response(JSON.stringify({ success: true, message: 'Message ignored' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('[Webhook WhatsApp] 📞 Mensagem de:', phone, 'Texto:', text.substring(0, 50));

    // Aqui você pode implementar a lógica de criação/atualização de leads e mensagens
    // Por enquanto, apenas logamos
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message processed',
      phone,
      instanceId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook WhatsApp] ❌ Erro ao processar mensagem:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

function extractPhoneFromMessage(messageData: any): string | null {
  const remoteJid = messageData.key?.remoteJid || messageData.from || messageData.remoteJid;
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}
