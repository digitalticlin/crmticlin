
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 25000
};

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Messaging Service] 🔧 ${method} ${url}`);
  
  try {
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && method === 'POST') {
      requestConfig.body = JSON.stringify(body);
      console.log(`[Messaging Service] 📋 Body:`, JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, requestConfig);
    const responseText = await response.text();
    
    console.log(`[Messaging Service] 📊 Status: ${response.status}`);
    console.log(`[Messaging Service] 📥 Response:`, responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText, success: response.ok };
    }

    return { 
      success: response.ok, 
      status: response.status, 
      data 
    };
  } catch (error: any) {
    console.error(`[Messaging Service] ❌ Erro:`, error.message);
    return { 
      success: false, 
      status: 500,
      error: error.message 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Messaging Service] 🚀 CORREÇÃO - Endpoint corrigido v2.0');
    
    const { action, instanceId, phone, message } = await req.json();
    console.log(`[Messaging Service] 🎯 Action: ${action}`);

    if (action === 'send_message_corrected' || action === 'send_message') {
      console.log('[Messaging Service] 📤 CORREÇÃO: Usando POST /send');
      
      if (!instanceId || !phone || !message) {
        throw new Error('instanceId, phone e message são obrigatórios');
      }

      // Limpar e formatar telefone
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

      // CORREÇÃO: Usar endpoint correto POST /send
      const result = await makeVPSRequest('/send', 'POST', {
        instanceId: instanceId,
        to: formattedPhone,
        message: message
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `VPS Error ${result.status}: ${result.error || 'Erro no envio'}`,
            endpoint_used: 'POST /send'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          messageId: result.data?.messageId || result.data?.id || 'message_sent',
          vps_response: result.data,
          endpoint_used: 'POST /send'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['send_message_corrected']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Messaging Service] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'whatsapp_messaging_service_v2_corrected'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
