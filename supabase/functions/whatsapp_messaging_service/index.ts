
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceId, phone, message } = await req.json();

    if (action === 'send_message' || action === 'send_message_corrected') {
      return await sendMessageCorrected(supabase, instanceId, phone, message);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Messaging Service] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendMessageCorrected(supabase: any, instanceId: string, phone: string, message: string) {
  console.log(`[Messaging Service] 📤 Enviando mensagem via webhook server:`, { instanceId, phone: phone.substring(0, 8) + '***' });

  try {
    // 1. Buscar instância no banco
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.vps_instance_id) {
      throw new Error('Instância não tem VPS ID');
    }

    // 2. Limpar telefone
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Número de telefone inválido');
    }

    // 3. Enviar via servidor webhook (porta 3002)
    const sendResponse = await fetch(`${WEBHOOK_SERVER_URL}/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3` 
      },
      body: JSON.stringify({
        instanceId: instance.vps_instance_id,
        phone: cleanPhone,
        message: message
      })
    });

    if (!sendResponse.ok) {
      throw new Error(`Servidor webhook respondeu com status ${sendResponse.status}`);
    }

    const responseData = await sendResponse.json();
    console.log(`[Messaging Service] 📡 Resposta do webhook server:`, responseData);

    if (!responseData.success) {
      throw new Error(responseData.error || 'Falha no envio da mensagem');
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: responseData.messageId || `msg_${Date.now()}`,
      server_port: 3002,
      via: 'webhook_server'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Messaging Service] ❌ Erro no envio:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
