
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 CORREÇÃO CRÍTICA - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[VPS Request] 📊 CORREÇÃO CRÍTICA - Status: ${response.status} (tentativa ${attempt})`);
      return response;
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ CORREÇÃO CRÍTICA - Tentativa ${attempt} falhou:`, {
        error: error.message,
        url,
        method: options.method
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`[VPS Request] ⏳ CORREÇÃO CRÍTICA - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// CORREÇÃO: Adicionando a função que estava faltando
export async function getVPSInstanceStatus(instanceId: string): Promise<any> {
  try {
    console.log(`[VPS Request] 📊 CORREÇÃO CRÍTICA - Buscando status da instância: ${instanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${instanceId}/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`[VPS Request] ✅ CORREÇÃO CRÍTICA - Status obtido:`, data);
    
    return data;
  } catch (error: any) {
    console.error(`[VPS Request] ❌ CORREÇÃO CRÍTICA - Erro ao obter status:`, error);
    throw error;
  }
}

// CORREÇÃO: Adicionando função para deletar instância VPS
export async function deleteVPSInstance(vpsInstanceId: string): Promise<any> {
  try {
    console.log(`[VPS Request] 🗑️ CORREÇÃO CRÍTICA - Deletando instância VPS: ${vpsInstanceId}`);
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${vpsInstanceId}/delete`, {
      method: 'DELETE',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`[VPS Request] ✅ CORREÇÃO CRÍTICA - Instância deletada:`, data);
    
    return data;
  } catch (error: any) {
    console.error(`[VPS Request] ❌ CORREÇÃO CRÍTICA - Erro ao deletar:`, error);
    throw error;
  }
}
