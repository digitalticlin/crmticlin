
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      console.log(`[VPS Request] Headers:`, options.headers);
      console.log(`[VPS Request] Body:`, options.body);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(45000), // 45 second timeout
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
      console.log(`[VPS Response] Headers:`, Object.fromEntries(response.headers.entries()));
      
      return response;
    } catch (error) {
      console.error(`[VPS Request] Error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function createVPSInstance(payload: any): Promise<any> {
  console.log('[VPS Service] 📤 Creating VPS instance with payload:', JSON.stringify(payload, null, 2));
  console.log('[VPS Service] 🔑 Headers:', getVPSHeaders());
  
  const correctEndpoint = `${VPS_CONFIG.baseUrl}/instance/create`;
  console.log('[VPS Service] 🎯 URL:', correctEndpoint);
  
  const vpsResponse = await makeVPSRequest(correctEndpoint, {
    method: 'POST',
    headers: getVPSHeaders(),
    body: JSON.stringify(payload)
  });

  const responseText = await vpsResponse.text();
  console.log('[VPS Service] 📥 VPS Raw Response:', responseText);

  if (!vpsResponse.ok) {
    console.error(`[VPS Service] ❌ VPS creation failed with status ${vpsResponse.status}: ${responseText}`);
    throw new Error(`VPS creation failed: ${vpsResponse.status} - ${responseText}`);
  }

  try {
    const vpsResult = JSON.parse(responseText);
    console.log('[VPS Service] ✅ VPS creation response:', vpsResult);
    
    if (!vpsResult.success) {
      throw new Error(`VPS retornou falha: ${vpsResult.error || 'Erro desconhecido'}`);
    }
    
    return vpsResult;
  } catch (parseError) {
    console.error('[VPS Service] ❌ Erro ao fazer parse da resposta VPS:', parseError);
    throw new Error(`VPS retornou resposta inválida: ${responseText}`);
  }
}

export async function deleteVPSInstance(vpsInstanceId: string, instanceName: string): Promise<void> {
  console.log('[VPS Service] 🗑️ Deleting VPS instance:', vpsInstanceId);
  
  await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
    method: 'POST',
    headers: getVPSHeaders(),
    body: JSON.stringify({ 
      instanceId: vpsInstanceId,
      instanceName: instanceName 
    })
  });
  
  console.log('[VPS Service] ✅ Successfully deleted from VPS');
}
