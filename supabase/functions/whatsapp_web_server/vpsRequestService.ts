
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 Criando instância na VPS:', payload);
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao criar instância:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ Instância criada com sucesso:', data);
    return {
      success: true,
      data: data,
      qrCode: data.qrcode || null
    };
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
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instanceId}/qr`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao obter QR:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ QR Code obtido:', !!data.qrCode);
    return {
      success: true,
      qrCode: data.qrCode || null
    };
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
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/delete`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId }),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao deletar:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    console.log('[VPS Request Service] ✅ Instância deletada com sucesso');
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ Erro na requisição delete:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstances() {
  console.log('[VPS Request Service] 📊 Buscando todas as instâncias da VPS');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ Erro ao buscar instâncias:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`,
        instances: []
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ Instâncias obtidas:', data?.instances?.length || 0);
    return {
      success: true,
      instances: data.instances || data || []
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ Erro na requisição de instâncias:', error);
    return {
      success: false,
      error: error.message,
      instances: []
    };
  }
}
