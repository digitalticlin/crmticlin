
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, normalizeQRCode } from './config.ts';

// CORREÇÃO: Função auxiliar para fazer requisições com retry melhorado
export async function makeVPSRequest(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 CORREÇÃO - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
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
        method: options.method
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      // Aguardar antes de retry com backoff
      const delay = 1000 * attempt; // 1s, 2s
      console.log(`[VPS Request] ⏳ CORREÇÃO - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// CORREÇÃO: Função genérica para requisições VPS (usada pelos novos serviços)
export async function createVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  console.log(`[VPS Request] 🚀 CORREÇÃO - Fazendo requisição: ${method} ${endpoint}`);
  
  try {
    const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: getVPSHeaders()
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await makeVPSRequest(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[VPS Request] ❌ CORREÇÃO - Erro ${response.status}:`, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`,
        data: null
      };
    }

    const data = await response.json();
    console.log(`[VPS Request] ✅ CORREÇÃO - Sucesso:`, data);
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error(`[VPS Request] ❌ CORREÇÃO - Erro na requisição:`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 CORREÇÃO - Criando instância na VPS (porta 3001):', payload);
  
  try {
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
    
    // CORREÇÃO: Verificar se QR Code foi retornado na criação
    const qrCodeField = data.qrcode || data.qrCode || data.qr_code || null;
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

export async function getVPSInstanceQR(instanceId: string) {
  console.log('[VPS Request Service] 📱 CORREÇÃO - Buscando QR Code (porta 3001):', instanceId);
  
  try {
    // CORREÇÃO: Usar o endpoint GET direto que funciona
    const url = `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQRDirect.replace('{instanceId}', instanceId)}`;
    console.log(`[VPS Request Service] 🔄 CORREÇÃO - Usando endpoint GET: ${url}`);
    
    const response = await makeVPSRequest(url, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[VPS Request Service] 📥 CORREÇÃO - Resposta do GET QR:`, {
        hasQrCode: !!(data.qrCode || data.qrcode),
        hasSuccess: !!data.success,
        status: data.status
      });
      
      // CORREÇÃO: Buscar QR Code nos campos possíveis
      const qrCodeField = data.qrCode || data.qrcode || data.qr_code || null;
      
      if (data.success && qrCodeField && isRealQRCode(qrCodeField)) {
        const processedQRCode = normalizeQRCode(qrCodeField);
        console.log('[VPS Request Service] ✅ CORREÇÃO - QR Code válido obtido!', {
          qrCodeLength: processedQRCode.length,
          hasDataUrl: processedQRCode.startsWith('data:image/')
        });
        
        return {
          success: true,
          qrCode: processedQRCode
        };
      } else {
        console.log(`[VPS Request Service] ⏳ CORREÇÃO - QR Code ainda não disponível:`, {
          hasQrField: !!qrCodeField,
          qrCodeLength: qrCodeField ? qrCodeField.length : 0,
          isValidQR: qrCodeField ? isRealQRCode(qrCodeField) : false
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`[VPS Request Service] ⚠️ CORREÇÃO - Endpoint GET QR falhou: ${response.status} - ${errorText.substring(0, 200)}`);
    }
    
  } catch (error: any) {
    console.log(`[VPS Request Service] ❌ CORREÇÃO - Erro no GET QR:`, error.message);
  }
  
  // QR Code não disponível
  console.log('[VPS Request Service] ❌ CORREÇÃO - QR Code não obtido');
  return {
    success: false,
    error: 'QR Code ainda não foi gerado ou instância ainda inicializando'
  };
}

export async function deleteVPSInstance(instanceId: string) {
  console.log('[VPS Request Service] 🗑️ CORREÇÃO - Deletando instância (porta 3001):', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.deleteInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ CORREÇÃO - Erro ao deletar:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    console.log('[VPS Request Service] ✅ CORREÇÃO - Instância deletada com sucesso');
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ CORREÇÃO - Erro na requisição delete:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstances() {
  console.log('[VPS Request Service] 📊 CORREÇÃO - Buscando todas as instâncias da VPS (porta 3001)');
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.instances}`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ CORREÇÃO - Erro ao buscar instâncias:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`,
        instances: []
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ CORREÇÃO - Instâncias obtidas:', data?.instances?.length || 0);
    return {
      success: true,
      instances: data.instances || data || []
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ CORREÇÃO - Erro na requisição de instâncias:', error);
    return {
      success: false,
      error: error.message,
      instances: []
    };
  }
}
