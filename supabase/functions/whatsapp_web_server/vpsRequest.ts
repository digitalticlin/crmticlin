
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function makeVPSRequest(url: string, options: RequestInit = {}): Promise<Response> {
  console.log('[VPS Request] 🌐 Making request to:', url);
  console.log('[VPS Request] 📋 Headers:', JSON.stringify(getVPSHeaders(), null, 2));
  
  const requestOptions = {
    ...options,
    headers: {
      ...getVPSHeaders(),
      ...options.headers
    },
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  };

  try {
    const response = await fetch(url, requestOptions);
    
    console.log('[VPS Request] 📊 Response status:', response.status);
    console.log('[VPS Request] 📊 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request] ❌ Error response:', errorText);
    }
    
    return response;
  } catch (error) {
    console.error('[VPS Request] ❌ Request failed:', error);
    throw error;
  }
}
