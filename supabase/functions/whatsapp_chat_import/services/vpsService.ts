
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

  try {
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
      
      // Se a instância não for encontrada, retornar dados vazios em vez de erro
      if (response.status === 404 || data.error?.includes('não encontrada')) {
        console.log(`[VPS Service] ℹ️ Instance not found, returning empty data`);
        return {
          success: true,
          instanceId: vpsInstanceId,
          importType,
          contacts: [],
          messages: [],
          totalContacts: 0,
          totalMessages: 0,
          timestamp: new Date().toISOString(),
          nextBatchAvailable: false,
          note: 'Instance not found on VPS - may be a sync issue or new instance'
        };
      }
      
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Garantir que a resposta tenha a estrutura esperada
    const processedData = {
      success: true,
      instanceId: data.instanceId || vpsInstanceId,
      importType: data.importType || importType,
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
      messages: Array.isArray(data.messages) ? data.messages : [],
      totalContacts: data.totalContacts || (Array.isArray(data.contacts) ? data.contacts.length : 0),
      totalMessages: data.totalMessages || (Array.isArray(data.messages) ? data.messages.length : 0),
      timestamp: data.timestamp || new Date().toISOString(),
      nextBatchAvailable: data.nextBatchAvailable || false
    };

    console.log(`[VPS Service] ✅ Processed data:`, {
      contacts: processedData.contacts.length,
      messages: processedData.messages.length,
      totalContacts: processedData.totalContacts,
      totalMessages: processedData.totalMessages
    });

    return processedData;

  } catch (error: any) {
    console.error(`[VPS Service] ❌ Request error:`, error.message);
    
    // Para erros de timeout ou conexão, também retornar dados vazios
    if (error.name === 'TimeoutError' || error.message.includes('fetch')) {
      console.log(`[VPS Service] ℹ️ Connection error, returning empty data`);
      return {
        success: true,
        instanceId: vpsInstanceId,
        importType,
        contacts: [],
        messages: [],
        totalContacts: 0,
        totalMessages: 0,
        timestamp: new Date().toISOString(),
        nextBatchAvailable: false,
        note: `Connection error: ${error.message}`
      };
    }
    
    throw error;
  }
}
