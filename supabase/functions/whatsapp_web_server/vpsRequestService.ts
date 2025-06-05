
import { VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 Criando instância na VPS:', payload);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[VPS Request Service] ✅ Instância criada com sucesso:', data);
      return {
        success: true,
        data: data,
        qrCode: data.qrcode || null
      };
    } else {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao criar instância:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ Erro na requisição:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstanceQR(instanceId: string) {
  console.log('[VPS Request Service] 📱 Buscando QR Code:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${instanceId}/qrcode`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[VPS Request Service] ✅ QR Code obtido:', !!data.qrcode);
      return {
        success: true,
        qrCode: data.qrcode || null
      };
    } else {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao obter QR:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ Erro na requisição QR:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteVPSInstance(instanceId: string) {
  console.log('[VPS Request Service] 🗑️ Deletando instância:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${instanceId}`, {
      method: 'DELETE',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      console.log('[VPS Request Service] ✅ Instância deletada com sucesso');
      return {
        success: true
      };
    } else {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao deletar:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ Erro na requisição delete:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
