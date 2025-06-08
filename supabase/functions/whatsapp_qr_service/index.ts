
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 25000
};

function getVPSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-QR-Client/3.0-CORRECTED',
    'Accept': 'application/json'
  };
}

function isRealQRCode(qrCode: string): boolean {
  if (!qrCode || typeof qrCode !== 'string') return false;
  if (qrCode.length < 50) return false;
  
  const validPatterns = [
    qrCode.startsWith('data:image/'),
    qrCode.includes('whatsapp'),
    /^[A-Za-z0-9+/]+=*$/.test(qrCode) && qrCode.length > 100
  ];
  
  return validPatterns.some(pattern => pattern);
}

function normalizeQRCode(qrCode: string): string {
  if (!qrCode) return '';
  
  if (qrCode.startsWith('data:image/')) {
    return qrCode;
  }
  
  if (/^[A-Za-z0-9+/]+=*$/.test(qrCode)) {
    return `data:image/png;base64,${qrCode}`;
  }
  
  return qrCode;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instanceId } = await req.json();
    console.log(`[QR Service] 🔄 CORREÇÃO - Ação: ${action}, Instância: ${instanceId}`);

    if (action === 'get_qr_corrected_get') {
      // CORREÇÃO: Usar endpoint GET /instance/{instanceId}/qr que realmente funciona
      const qrUrl = `${VPS_CONFIG.baseUrl}/instance/${instanceId}/qr`;
      
      console.log(`[QR Service] 📱 CORREÇÃO - GET QR Code: ${qrUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);
      
      try {
        const response = await fetch(qrUrl, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`[QR Service] 📊 Response Status: ${response.status}`);
        
        const responseText = await response.text();
        console.log(`[QR Service] 📥 Response Text:`, responseText.substring(0, 200));
        
        if (!response.ok) {
          if (response.status === 404) {
            return new Response(
              JSON.stringify({
                success: false,
                waiting: true,
                message: 'QR Code não disponível ainda',
                status: response.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error(`VPS Error: ${response.status} - ${responseText}`);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          // Se não é JSON, pode ser uma imagem ou erro HTML
          if (responseText.includes('<!DOCTYPE html>')) {
            throw new Error('Endpoint não encontrado ou retornou HTML');
          }
          
          // Assumir que é base64 se não é HTML
          data = { qrCode: responseText };
        }
        
        console.log(`[QR Service] 📋 Data processado:`, {
          hasQrCode: !!data.qrCode,
          success: data.success,
          status: data.status,
          hasQR: data.hasQR
        });
        
        // Verificar se tem QR Code válido
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          const normalizedQR = normalizeQRCode(data.qrCode);
          
          console.log(`[QR Service] ✅ QR Code válido encontrado!`);
          
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: normalizedQR,
              source: 'vps_get_endpoint_corrected',
              instanceId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Se chegou aqui mas não tem QR válido
        if (data.status === 'ready') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Instância já conectada, QR Code não necessário',
              status: 'ready',
              instanceId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // QR ainda não disponível
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            message: 'QR Code ainda sendo gerado pela VPS',
            status: data.status || 'unknown',
            instanceId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } finally {
        clearTimeout(timeoutId);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['get_qr_corrected_get']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[QR Service] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'whatsapp_qr_service_corrected'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
