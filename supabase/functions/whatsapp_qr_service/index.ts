
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[QR Service] 🔧 ${method} ${url}`);
  
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
      console.log(`[QR Service] 📋 Body:`, JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, requestConfig);
    const responseText = await response.text();
    
    console.log(`[QR Service] 📊 Status: ${response.status}`);
    console.log(`[QR Service] 📥 Response:`, responseText.substring(0, 500));

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
    console.error(`[QR Service] ❌ Erro:`, error.message);
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
    console.log('[QR Service] 🚀 CORREÇÃO - Endpoints corrigidos v2.0');
    
    const { action, instanceId } = await req.json();
    console.log(`[QR Service] 🎯 Action: ${action}, Instance: ${instanceId}`);

    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }

    if (action === 'generate_qr_corrected' || action === 'generate_qr') {
      console.log('[QR Service] 📱 CORREÇÃO: Usando POST /instance/qr');
      
      // CORREÇÃO: Usar endpoint correto POST /instance/qr com body
      const result = await makeVPSRequest('/instance/qr', 'POST', {
        instanceId: instanceId
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `VPS Error ${result.status}: ${result.error || 'Erro desconhecido'}`,
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qrCode = result.data?.qrCode || result.data?.qr || result.data?.base64;
      
      if (qrCode) {
        // Normalizar QR code
        let normalizedQR = qrCode;
        if (!qrCode.startsWith('data:image/') && qrCode.length > 100) {
          normalizedQR = `data:image/png;base64,${qrCode}`;
        }

        return new Response(
          JSON.stringify({
            success: true,
            qrCode: normalizedQR,
            source: 'vps_post_instance_qr',
            normalized: true,
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            message: 'QR Code ainda sendo gerado pela VPS',
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'get_qr_corrected' || action === 'get_qr') {
      console.log('[QR Service] 📱 CORREÇÃO: Obtendo QR via POST /instance/qr');
      
      // CORREÇÃO: Mesmo endpoint para obter QR Code
      const result = await makeVPSRequest('/instance/qr', 'POST', {
        instanceId: instanceId
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `VPS Error ${result.status}: ${result.error || 'Erro desconhecido'}`,
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qrCode = result.data?.qrCode || result.data?.qr || result.data?.base64;
      
      if (qrCode) {
        let normalizedQR = qrCode;
        if (!qrCode.startsWith('data:image/') && qrCode.length > 100) {
          normalizedQR = `data:image/png;base64,${qrCode}`;
        }

        return new Response(
          JSON.stringify({
            success: true,
            qrCode: normalizedQR,
            source: 'vps_post_instance_qr',
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            message: 'QR Code não disponível',
            endpoint_used: 'POST /instance/qr'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['generate_qr_corrected', 'get_qr_corrected']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[QR Service] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'whatsapp_qr_service_v2_corrected'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
