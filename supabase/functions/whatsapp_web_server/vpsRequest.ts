
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

// Função para fazer requisições VPS com retry
export async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[VPS Request] Attempt ${i + 1}/${retries} to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });
      
      console.log(`[VPS Response] Status: ${response.status} ${response.statusText}`);
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
