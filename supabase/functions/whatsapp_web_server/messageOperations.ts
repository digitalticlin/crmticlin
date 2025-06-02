
import { VPS_CONFIG, corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  console.log(`[VPS Message] Attempting connection to: ${url}`);
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Message] Attempt ${i + 1}/${retries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[VPS Message] Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VPS Message] HTTP ${response.status}: ${errorText}`);
        
        if (i === retries - 1) {
          throw new Error(`VPS HTTP ${response.status}: ${errorText}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`[VPS Message] Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function sendMessage(instanceId: string, phone: string, message: string) {
  try {
    console.log(`[Send Message] Instance: ${instanceId}, Phone: ${phone}`);

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId,
        phone,
        message
      })
    });

    const result = await response.json();
    console.log(`[Send Message] Result:`, result);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Send Message] Error:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao enviar mensagem: ${error.message}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
