
import { VPS_CONFIG, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`VPS Request attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      console.log(`VPS Response: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      console.error(`VPS request error (attempt ${i + 1}):`, error);
      
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
    console.log(`Getting status for instance: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
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
    console.error('Error getting instance status:', error);
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
    console.log(`Getting QR code for instance: ${instanceId}`);
    
    // Tentar diferentes métodos para obter QR Code
    const methods = [
      { method: 'GET', url: `${VPS_CONFIG.baseUrl}/qr` },
      { method: 'GET', url: `${VPS_CONFIG.baseUrl}/qr/${instanceId}` },
      { method: 'POST', url: `${VPS_CONFIG.baseUrl}/qr`, body: { instanceId } }
    ];

    for (const methodConfig of methods) {
      try {
        console.log(`Trying QR method: ${methodConfig.method} ${methodConfig.url}`);
        
        const response = await makeVPSRequest(methodConfig.url, {
          method: methodConfig.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          body: methodConfig.body ? JSON.stringify(methodConfig.body) : undefined
        }, 1); // Only 1 retry per method

        if (response.ok) {
          const data = await response.json();
          console.log(`QR Code obtained via ${methodConfig.method} ${methodConfig.url}`);
          
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: data.qrCode || data.qr || data.code || data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (methodError) {
        console.log(`Method ${methodConfig.method} failed:`, methodError.message);
        continue;
      }
    }

    throw new Error('All QR Code methods failed');
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
    console.log('Checking VPS server health...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
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
    console.error('Error checking server health:', error);
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
    console.log('Getting VPS server info...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
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
    console.error('Error getting server info:', error);
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
    console.log(`Syncing instances for company: ${companyId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    });

    const data = await response.json();
    console.log('VPS instances data:', data);
    
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
    console.error('Error syncing instances:', error);
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
