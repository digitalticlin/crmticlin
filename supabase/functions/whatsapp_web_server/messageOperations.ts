
import { VPS_CONFIG, corsHeaders, getVPSHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      console.error(`[VPS Request] Error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function sendMessage(instanceId: string, phone: string, message: string) {
  console.log(`[Send Message] Sending message via instance: ${instanceId} to: ${phone}`);

  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/send`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId,
        phone,
        message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS send message failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Send Message] Result:`, result);

    return new Response(
      JSON.stringify({
        success: result.success,
        data: result.data,
        error: result.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Send Message] Error:`, error);
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
