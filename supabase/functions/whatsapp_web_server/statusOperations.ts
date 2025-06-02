
import { VPS_CONFIG, corsHeaders } from './config.ts';
import { ServiceResponse, QRCodeResponse } from './types.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`VPS Status request attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout for status checks
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`VPS HTTP ${response.status}: ${errorText}`);
        
        if (i === retries - 1) {
          throw new Error(`VPS HTTP ${response.status}: ${errorText}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`VPS request error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log('Getting WhatsApp Web.js instance status:', instanceId);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: instanceId
      })
    });

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        status: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting instance status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao verificar status: ${error.message}`,
        offline: true
      }),
      { 
        status: 200, // Return 200 to avoid frontend errors, but indicate offline status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log('Getting QR Code for WhatsApp Web.js instance:', instanceId);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: instanceId
      })
    });

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        qrCode: result.qrCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting QR code:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao gerar QR Code: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function checkServerHealth() {
  try {
    console.log('Checking WhatsApp Web.js server health');

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 1);

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          connectivity: 'online',
          tested_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking server health:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `VPS não está respondendo: ${error.message}`,
        data: {
          connectivity: 'offline',
          tested_at: new Date().toISOString(),
          error_details: error.message
        }
      }),
      { 
        status: 200, // Return 200 to avoid frontend errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
