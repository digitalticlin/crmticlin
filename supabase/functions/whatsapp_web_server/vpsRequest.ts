
import { VPS_CONFIG } from './config.ts';

export async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log(`[VPS Request] ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `VPS Error: ${response.status} - ${data.message || 'Unknown error'}`,
        data: null
      };
    }

    return {
      success: true,
      data,
      error: null
    };

  } catch (error) {
    console.error('[VPS Request] Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}
