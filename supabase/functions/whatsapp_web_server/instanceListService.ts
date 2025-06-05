
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { corsHeaders } from './config.ts';

export async function listInstances() {
  try {
    console.log('[List Instances] 📋 Listando instâncias do VPS');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[List Instances] ✅', data.instances?.length || 0, 'instâncias encontradas');
      
      return new Response(
        JSON.stringify({
          success: true,
          instances: data.instances || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('[List Instances] ❌ Erro VPS:', response.status, errorText);
      throw new Error(`VPS error: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('[List Instances] 💥 Erro ao listar instâncias:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        instances: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
