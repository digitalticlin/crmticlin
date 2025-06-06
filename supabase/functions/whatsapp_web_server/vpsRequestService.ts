
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, normalizeQRCode } from './config.ts';

// Função auxiliar para fazer requisições com retry
export async function makeVPSRequest(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 CORREÇÃO ROBUSTA - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      console.log(`[VPS Request] 🔑 Token usado: ${VPS_CONFIG.authToken.substring(0, 10)}...`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Request] 📊 CORREÇÃO - Status: ${response.status} (tentativa ${attempt})`);
      return response;
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ CORREÇÃO - Tentativa ${attempt} falhou:`, {
        error: error.message,
        url,
        method: options.method,
        token: VPS_CONFIG.authToken.substring(0, 10) + '...'
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      const delay = 1000 * attempt;
      console.log(`[VPS Request] ⏳ CORREÇÃO - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// CORREÇÃO CRÍTICA: Implementar função testVPSConnectivity que estava sendo importada
export async function testVPSConnectivity(): Promise<boolean> {
  try {
    console.log('[VPS Test] 🔗 CORREÇÃO ROBUSTA - Testando conectividade VPS...');
    console.log('[VPS Test] 🔑 Token usado:', VPS_CONFIG.authToken);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(5000)
    });
    
    const isConnected = response.ok;
    console.log('[VPS Test] 📊 CORREÇÃO - Resultado do teste:', {
      url: `${VPS_CONFIG.baseUrl}/health`,
      status: response.status,
      isConnected,
      token: VPS_CONFIG.authToken
    });
    
    return isConnected;
  } catch (error: any) {
    console.error('[VPS Test] ❌ CORREÇÃO - Falha na conectividade:', error.message);
    return false;
  }
}

// CORREÇÃO CRÍTICA: Implementar função getVPSInstances que estava faltando
export async function getVPSInstances(): Promise<{ success: boolean; instances?: any[]; error?: string }> {
  try {
    console.log('[VPS Request] 📋 CORREÇÃO ROBUSTA - Listando instâncias VPS...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.instances}`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request] ❌ CORREÇÃO - Erro ao listar instâncias:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request] ✅ CORREÇÃO - Instâncias listadas:', data);
    
    return {
      success: true,
      instances: Array.isArray(data) ? data : (data.instances || [])
    };
    
  } catch (error: any) {
    console.error('[VPS Request] ❌ CORREÇÃO - Erro na requisição de listagem:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CORREÇÃO CRÍTICA: Implementar função getVPSInstanceStatus que estava faltando
export async function getVPSInstanceStatus(instanceId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    console.log('[VPS Request] 📊 CORREÇÃO ROBUSTA - Obtendo status da instância:', instanceId);
    
    const url = `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getStatus.replace('{instanceId}', instanceId)}`;
    const response = await makeVPSRequest(url, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request] ❌ CORREÇÃO - Erro ao obter status:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request] ✅ CORREÇÃO - Status obtido:', data);
    
    return {
      success: true,
      status: data.status || data.connectionStatus || 'unknown'
    };
    
  } catch (error: any) {
    console.error('[VPS Request] ❌ CORREÇÃO - Erro na requisição de status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 CORREÇÃO ROBUSTA - Criando instância na VPS (porta 3001):', payload);
  console.log('[VPS Request Service] 🔑 Token usado:', VPS_CONFIG.authToken.substring(0, 10) + '...');
  
  try {
    // CORREÇÃO ROBUSTA: Testar conectividade antes de tentar criar
    console.log('[VPS Request Service] 🔍 CORREÇÃO - Testando conectividade VPS antes da criação...');
    const isConnected = await testVPSConnectivity();
    
    if (!isConnected) {
      throw new Error('VPS não está acessível - falha no teste de conectividade');
    }
    
    console.log('[VPS Request Service] ✅ CORREÇÃO - VPS conectado, prosseguindo com criação...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.createInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ CORREÇÃO - Erro ao criar instância:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ CORREÇÃO - Resposta da criação:', data);
    
    // CORREÇÃO CRÍTICA: Buscar QR Code em múltiplos campos possíveis
    const qrCodeField = data.qrcode || data.qrCode || data.qr_code || data.qr || null;
    let processedQRCode = null;
    
    if (qrCodeField && isRealQRCode(qrCodeField)) {
      processedQRCode = normalizeQRCode(qrCodeField);
      console.log('[VPS Request Service] ✅ CORREÇÃO - QR Code válido encontrado na criação');
    } else {
      console.log('[VPS Request Service] ⏳ CORREÇÃO - QR Code não disponível na criação - usar polling');
    }
    
    return {
      success: true,
      data: data,
      qrCode: processedQRCode
    };
    
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ CORREÇÃO - Erro na requisição:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CORREÇÃO CRÍTICA: Implementar a função deleteVPSInstance que estava faltando
export async function deleteVPSInstance(vpsInstanceId: string, instanceName?: string) {
  console.log('[VPS Request Service] 🗑️ CORREÇÃO ROBUSTA - Deletando instância da VPS:', vpsInstanceId);
  console.log('[VPS Request Service] 🔑 Token usado:', VPS_CONFIG.authToken.substring(0, 10) + '...');
  
  try {
    const payload = {
      instanceId: vpsInstanceId,
      sessionName: instanceName || vpsInstanceId
    };

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.deleteInstance}`, {
      method: 'DELETE',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ CORREÇÃO - Erro ao deletar instância:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ CORREÇÃO - Instância deletada da VPS:', data);
    
    return {
      success: true,
      data: data
    };
    
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ CORREÇÃO - Erro na requisição de deleção:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstanceQR(instanceId: string) {
  console.log('[VPS Request Service] 📱 CORREÇÃO ROBUSTA - Buscando QR Code (porta 3001):', instanceId);
  console.log('[VPS Request Service] 🔑 Token usado:', VPS_CONFIG.authToken.substring(0, 10) + '...');
  
  try {
    // CORREÇÃO ROBUSTA: Testar conectividade antes do QR Code
    const isConnected = await testVPSConnectivity();
    if (!isConnected) {
      return {
        success: false,
        waiting: true,
        error: 'VPS não acessível para obter QR Code'
      };
    }
    
    // Usar endpoint GET direto que funciona
    const url = `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQRDirect.replace('{instanceId}', instanceId)}`;
    console.log(`[VPS Request Service] 🔄 CORREÇÃO - Usando endpoint GET: ${url}`);
    
    const response = await makeVPSRequest(url, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[VPS Request Service] 📥 CORREÇÃO - Resposta do GET QR:`, {
        hasQrCode: !!(data.qrCode || data.qrcode || data.qr_code || data.qr),
        hasSuccess: !!data.success,
        status: data.status
      });
      
      // CORREÇÃO: Buscar QR Code nos campos possíveis
      const qrCodeField = data.qrCode || data.qrcode || data.qr_code || data.qr || null;
      
      if (data.success && qrCodeField && isRealQRCode(qrCodeField)) {
        const processedQRCode = normalizeQRCode(qrCodeField);
        console.log('[VPS Request Service] ✅ CORREÇÃO - QR Code válido obtido via GET');
        
        return {
          success: true,
          qrCode: processedQRCode,
          waiting: false
        };
      } else if (data.success === false && data.error) {
        console.log('[VPS Request Service] ⏳ CORREÇÃO - QR Code ainda não disponível:', data.error);
        return {
          success: false,
          waiting: true,
          error: data.error
        };
      } else {
        console.log('[VPS Request Service] ⏳ CORREÇÃO - QR Code ainda sendo gerado');
        return {
          success: false,
          waiting: true,
          error: 'QR Code ainda sendo gerado'
        };
      }
    } else {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ CORREÇÃO - Erro no GET QR:', response.status, errorText);
      return {
        success: false,
        waiting: true,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }
    
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ CORREÇÃO - Erro na requisição QR:', error);
    return {
      success: false,
      waiting: true,
      error: error.message
    };
  }
}
