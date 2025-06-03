
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log(`[Status] Getting status for instance: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: data.status,
          permanent_mode: data.permanent_mode || false,
          auto_reconnect: data.auto_reconnect || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      throw new Error(`Status request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[Status] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log(`[QR Code] Getting QR code for instance: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          qrCode: data.qrCode,
          permanent_mode: data.permanent_mode || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error(`[QR Code] VPS request failed: ${response.status} - ${errorText}`);
      throw new Error(`VPS QR request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[QR Code] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
