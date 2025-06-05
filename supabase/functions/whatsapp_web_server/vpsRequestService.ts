
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

// Função de requisição VPS com retry melhorado
export async function makeVPSRequest(url: string, options: RequestInit): Promise<Response> {
  console.log('[VPS Request] 📡 Fazendo requisição para:', url);
  console.log('[VPS Request] 📋 Options:', JSON.stringify(options, null, 2));
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.retries; attempt++) {
    try {
      console.log(`[VPS Request] 🔄 Tentativa ${attempt}/${VPS_CONFIG.retries}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Request] 📥 Resposta recebida - Status: ${response.status}`);
      
      // Se a resposta foi bem-sucedida, retornar imediatamente
      if (response.ok) {
        console.log(`[VPS Request] ✅ Sucesso na tentativa ${attempt}`);
        return response;
      }
      
      // Para erros 4xx, não tentar novamente (erro de configuração)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[VPS Request] ❌ Erro 4xx (não retentável): ${response.status}`);
        return response;
      }
      
      // Para outros erros, tentar novamente
      const errorText = await response.text();
      console.warn(`[VPS Request] ⚠️ Erro ${response.status} na tentativa ${attempt}: ${errorText}`);
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);
      
    } catch (error) {
      console.error(`[VPS Request] 💥 Erro na tentativa ${attempt}:`, error);
      lastError = error as Error;
    }
    
    // Aguardar antes da próxima tentativa (exceto na última)
    if (attempt < VPS_CONFIG.retries) {
      const delay = 2000 * attempt; // Delay progressivo
      console.log(`[VPS Request] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[VPS Request] 💥 Todas as ${VPS_CONFIG.retries} tentativas falharam`);
  throw lastError!;
}

// Função específica para criar instância na VPS
export async function createVPSInstance(payload: any): Promise<any> {
  console.log('[VPS Create] 🚀 Criando instância na VPS:', payload);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[VPS Create] ✅ Instância criada com sucesso:', data);
      return {
        success: true,
        vpsInstanceId: payload.instanceId,
        qrCode: data.qrCode || null,
        ...data
      };
    } else {
      const errorText = await response.text();
      console.error('[VPS Create] ❌ Falha ao criar instância:', errorText);
      throw new Error(`VPS creation failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[VPS Create] 💥 Erro crítico:', error);
    throw error;
  }
}
