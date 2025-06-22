
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
      .or(`vps_instance_id.eq.${instanceId},instance_name.eq.${instanceId}`);

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
      .or(`vps_instance_id.eq.${instanceId},instance_name.eq.${instanceId}`);

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
  console.log(`[${requestId}] 💬 Processando mensagem recebida para: ${instanceId}`);
  
  try {
    // Buscar instância
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .or(`vps_instance_id.eq.${instanceId},instance_name.eq.${instanceId}`);

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

    // Processar mensagem
    const messageData = payload.data || payload.message || payload;
    const phone = extractPhoneFromMessage(messageData);
    const text = messageData.body || messageData.text || messageData.message?.text || '';
    const fromMe = messageData.key?.fromMe || false;

    if (!phone || fromMe) {
      console.log(`[${requestId}] ℹ️ Mensagem ignorada - sem telefone ou enviada por mim`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Message ignored',
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📞 Mensagem de: ${phone} | Texto: ${text.substring(0, 50)}`);

    // Aqui você pode implementar a lógica de criação/atualização de leads e mensagens
    // Por enquanto, apenas registramos o recebimento
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message processed',
      phone,
      instanceId: instance.id,
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

function extractPhoneFromMessage(messageData: any): string | null {
  const remoteJid = messageData.key?.remoteJid || messageData.from || messageData.remoteJid;
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}
