
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001', // CORREÇÃO: Porta correta 3001
  authToken: 'default-token',
  timeout: 15000,
  retries: 3
} as const;

export const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'User-Agent': 'Supabase-Edge-Function/1.0'
});

export async function testVPSConnectivity(): Promise<boolean> {
  try {
    console.log(`[VPS Test] 🏥 CORREÇÃO PORTA 3001 - Testando conectividade: ${VPS_CONFIG.baseUrl}/health`);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    
    const isHealthy = response.ok;
    console.log(`[VPS Test] 📊 PORTA 3001 - Status: ${response.status}, Saudável: ${isHealthy}`);
    
    return isHealthy;
  } catch (error: any) {
    console.error(`[VPS Test] ❌ PORTA 3001 - Falha na conectividade:`, error.message);
    return false;
  }
}

export function isRealQRCode(qrCode: string): boolean {
  return qrCode && 
         qrCode.length > 50 && 
         qrCode.includes('WhatsApp') &&
         !qrCode.includes('error') &&
         !qrCode.includes('initializing');
}
