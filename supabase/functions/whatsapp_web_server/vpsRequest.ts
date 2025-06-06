
// This is a helper file for VPS requests with error handling and retries

import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 PORTA 3001 - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Request] 📊 PORTA 3001 - Status: ${response.status} (tentativa ${attempt})`);
      return response;
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ PORTA 3001 - Tentativa ${attempt} falhou:`, {
        error: error.message,
        url,
        method: options.method
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`[VPS Request] ⏳ PORTA 3001 - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
