
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

// Função para listar todas as instâncias do VPS
export async function listInstances() {
  try {
    console.log('[List Instances] 📋 Listando instâncias do VPS');
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('[List Instances] ❌ VPS error:', vpsResponse.status, errorText);
      throw new Error(`VPS responded with status: ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    const instances = vpsData.instances || [];
    
    console.log(`[List Instances] ✅ ${instances.length} instâncias encontradas`);
    
    // Mapear dados das instâncias para formato padronizado
    const formattedInstances = instances.map((instance: any) => ({
      instanceId: instance.instanceId || instance.instance,
      status: instance.status || 'unknown',
      phone: instance.phone || null,
      profileName: instance.profileName || null,
      profilePictureUrl: instance.profilePictureUrl || null,
      qrCode: instance.qrCode || null
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        instances: formattedInstances,
        count: formattedInstances.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[List Instances] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        instances: [],
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
