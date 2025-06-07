
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

// CORREÇÃO: Função de requisição VPS robusta com token correto
export async function makeVPSRequest(endpoint: string, method: string = 'POST', body?: any, retries: number = 2) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  console.log(`[VPS Request] 🌐 CORREÇÃO TOKEN - ${method} ${url}`);
  console.log(`[VPS Request] 📤 Body:`, body ? JSON.stringify(body, null, 2) : 'N/A');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers = getVPSHeaders();
      console.log(`[VPS Request] 🔑 Headers corrigidos (tentativa ${attempt}):`, {
        ...headers,
        'Authorization': headers.Authorization?.substring(0, 25) + '...',
        'X-API-Token': headers['X-API-Token']?.substring(0, 15) + '...'
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[VPS Request] 📊 Response Status: ${response.status} (tentativa ${attempt})`);
      console.log(`[VPS Request] 📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`[VPS Request] 📥 Response Text:`, responseText.substring(0, 500));
      
      if (!response.ok) {
        console.error(`[VPS Request] ❌ HTTP Error ${response.status}:`, responseText);
        
        if (response.status === 401) {
          throw new Error(`Erro de autenticação 401: Token corrigido: 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3`);
        }
        
        if (response.status === 404) {
          throw new Error(`Endpoint não encontrado 404: ${endpoint}`);
        }
        
        throw new Error(`VPS Error: ${response.status} - ${responseText || 'Unknown error'}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[VPS Request] ⚠️ Resposta não é JSON válido:`, responseText);
        data = { success: true, message: responseText };
      }
      
      console.log(`[VPS Request] ✅ Sucesso na tentativa ${attempt}:`, data);
      return {
        success: true,
        data: data
      };
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ Tentativa ${attempt} falhou:`, {
        error: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
      
      if (attempt === retries) {
        return {
          success: false,
          error: error.message || 'Erro na comunicação com VPS'
        };
      }
      
      // Aguardar antes do retry
      const delay = 1000 * attempt;
      console.log(`[VPS Request] ⏳ Aguardando ${delay}ms para retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: 'Máximo de tentativas excedido'
  };
}
