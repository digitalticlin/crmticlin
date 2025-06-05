
export async function makeVPSRequest(url: string, options: RequestInit) {
  console.log(`[VPS Request] 🌐 Making request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000) // 30 segundo timeout
    });
    
    console.log(`[VPS Request] 📡 Response status: ${response.status}`);
    return response;
  } catch (error: any) {
    console.error(`[VPS Request] ❌ Request failed:`, error);
    throw error;
  }
}
