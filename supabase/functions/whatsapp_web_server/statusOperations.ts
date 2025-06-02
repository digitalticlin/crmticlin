
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
      
      console.log(`[VPS Request] Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VPS Request] HTTP ${response.status}: ${errorText}`);
        
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

export async function checkServerHealth() {
  try {
    console.log(`[Check Server Health] Testing VPS connectivity to: ${VPS_CONFIG.baseUrl}/health`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`[Check Server Health] VPS Health Response:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Check Server Health] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao verificar saúde do servidor: ${error.message}`
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
    console.log(`[Get Server Info] Getting VPS server info from: ${VPS_CONFIG.baseUrl}/status`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`[Get Server Info] VPS Status Response:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Get Server Info] Error:`, error.message);
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

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log(`[Instance Status] Getting status for instance: ${instanceId}`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId
      })
    });

    const result = await response.json();
    console.log(`[Instance Status] Result:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Status] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao obter status da instância: ${error.message}`
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
    console.log(`[QR Code] Getting QR code for instance: ${instanceId}`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId
      })
    });

    const result = await response.json();
    console.log(`[QR Code] Result:`, result);
    
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
        error: `Erro ao obter QR Code: ${error.message}`
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
    console.log(`[Sync Instances] Syncing instances for company: ${companyId}`);

    // Get instances from VPS
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`[Sync Instances] VPS Instances:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Sync Instances] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao sincronizar instâncias: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
