
import { VPS_CONFIG, corsHeaders, getVPSHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Status Operations] VPS Request attempt ${i + 1}/${retries} to: ${url}`);
      console.log(`[Status Operations] Headers:`, options.headers);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      console.log(`[Status Operations] VPS Response: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      console.error(`[Status Operations] VPS request error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log(`[Status Operations] Getting status for instance: ${instanceId}`);
    
    // Use CORRECT status endpoint with Hostinger-confirmed format
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        status: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Status Operations] Error getting instance status:', error);
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
    console.log(`[Status Operations] Getting QR code for instance: ${instanceId}`);
    
    // Use CORRECT QR endpoint with Hostinger-confirmed format
    console.log(`[Status Operations] Using Hostinger-confirmed QR endpoint: /instance/qr`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Status Operations] QR Code obtained successfully`);
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: data.qrCode || data.qr || data.code || data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      throw new Error(`QR request failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[Status Operations] Error getting QR code:', error);
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
    console.log('[Status Operations] Checking VPS server health...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: 'online',
          ...data
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Status Operations] Error checking server health:', error);
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

export async function getServerInfo() {
  try {
    console.log('[Status Operations] Getting VPS server info...');
    
    // Use /status endpoint for server info (confirmed working)
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Status Operations] Error getting server info:', error);
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

export async function syncInstances(supabase: any, companyId: string) {
  try {
    console.log(`[Status Operations] Syncing instances for company: ${companyId}`);
    
    // Use /instances endpoint (confirmed working)
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    const data = await response.json();
    console.log('[Status Operations] VPS instances data:', data);
    
    // Assumir que a resposta contém uma lista de instâncias
    const vpsInstances = data.instances || data || [];
    
    return new Response(
      JSON.stringify({
        success: true,
        instances: vpsInstances,
        count: vpsInstances.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Status Operations] Error syncing instances:', error);
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
