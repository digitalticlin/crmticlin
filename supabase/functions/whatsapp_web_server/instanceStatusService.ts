
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { corsHeaders } from './config.ts';

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log(`[Instance Status] 📊 Obtendo status para: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Instance Status] ✅ Status obtido para ${instanceId}:`, data.status);
      
      return new Response(
        JSON.stringify({
          success: true,
          status: data.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error(`[Instance Status] ❌ Erro para ${instanceId}:`, response.status, errorText);
      throw new Error(`VPS status error: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error(`[Instance Status] 💥 Erro ao obter status ${instanceId}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log(`[QR Code] 🔳 Obtendo QR Code para: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[QR Code] ✅ QR Code obtido para ${instanceId}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: data.qrCode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error(`[QR Code] ❌ Erro para ${instanceId}:`, response.status, errorText);
      throw new Error(`VPS QR error: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error(`[QR Code] 💥 Erro ao obter QR ${instanceId}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
