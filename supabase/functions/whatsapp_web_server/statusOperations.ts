
import { VPS_CONFIG, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  console.log(`[VPS Request] Attempting connection to: ${url}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VPS Error] HTTP ${response.status}: ${errorText}`);
        
        if (i === retries - 1) {
          throw new Error(`VPS HTTP ${response.status}: ${errorText}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`[VPS Request] Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log(`[Status] Getting instance status: ${instanceId}`);

    // Changing endpoint from /instance/status to /status
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
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
    console.log(`[Status] Response:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        status: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Status] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao verificar status: ${error.message}`,
        offline: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log(`[QR Code] Getting QR code for instance: ${instanceId}`);

    // Changing endpoint from /instance/qr to /qr
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/qr`, {
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
    console.log(`[QR Code] Response received, QR available: ${!!result.qrCode}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        qrCode: result.qrCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[QR Code] Error:`, error.message);
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
    console.log(`[Health] Checking server health at: ${VPS_CONFIG.baseUrl}/health`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 2);

    const result = await response.json();
    console.log(`[Health] Server health response:`, result);
    
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
    console.error(`[Health] Server health check failed:`, error.message);
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getServerInfo() {
  try {
    console.log(`[Server Info] Getting server info from: ${VPS_CONFIG.baseUrl}/info`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    }, 2);

    const result = await response.json();
    console.log(`[Server Info] Response:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Server Info] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao obter informações do servidor: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
