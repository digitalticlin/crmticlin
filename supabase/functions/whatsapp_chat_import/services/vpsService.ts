
import { VPS_CONFIG } from '../config/vpsConfig.ts';

export async function fetchHistoryFromVPS(vpsInstanceId: string, importType: string, batchSize: number, lastSyncTimestamp?: string) {
  const url = `${VPS_CONFIG.baseUrl}/instance/${vpsInstanceId}/import-history`;
  
  console.log(`[VPS Service] 🎯 POST ${url}`);
  console.log(`[VPS Service] 🔐 Using token: ${VPS_CONFIG.authToken.substring(0, 10)}...`);
  
  const requestBody = {
    importType,
    batchSize,
    ...(lastSyncTimestamp && { lastSyncTimestamp })
  };

  console.log(`[VPS Service] 📤 Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'X-API-Token': VPS_CONFIG.authToken
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  });

  console.log(`[VPS Service] 📋 Response Status: ${response.status}`);
  
  const responseText = await response.text();
  console.log(`[VPS Service] 📋 Response Body (first 500 chars):`, responseText.substring(0, 500));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error(`[VPS Service] ❌ Parse error:`, parseError);
    throw new Error(`Failed to parse VPS response: ${parseError.message}`);
  }

  if (!response.ok) {
    console.error(`[VPS Service] ❌ HTTP error:`, response.status, data);
    throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}
