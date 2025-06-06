
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, normalizeQRCode } from './config.ts';

// FASE 1.3: Função auxiliar para fazer requisições com retry melhorado
async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 FASE 1.3 - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Request] 📊 FASE 1.3 - Status: ${response.status} (tentativa ${attempt})`);
      return response;
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ FASE 1.3 - Tentativa ${attempt} falhou:`, {
        error: error.message,
        url,
        method: options.method
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      // Aguardar antes de retry com backoff exponencial
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.log(`[VPS Request] ⏳ FASE 1.3 - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 FASE 1.3 - Criando instância na VPS:', payload);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.createInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ FASE 1.3 - Erro ao criar instância:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ FASE 1.3 - Resposta da criação:', data);
    
    // FASE 1.3: Padronizar resposta - VPS pode retornar 'qrcode' ou 'qrCode'
    const qrCodeField = data.qrcode || data.qrCode || data.qr_code || null;
    let processedQRCode = null;
    
    if (qrCodeField && isRealQRCode(qrCodeField)) {
      processedQRCode = normalizeQRCode(qrCodeField);
      console.log('[VPS Request Service] ✅ FASE 1.3 - QR Code válido encontrado na criação');
    } else {
      console.log('[VPS Request Service] ⏳ FASE 1.3 - QR Code não disponível na criação - será obtido via polling');
    }
    
    return {
      success: true,
      data: data,
      qrCode: processedQRCode
    };
    
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ FASE 1.3 - Erro na requisição:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstanceQR(instanceId: string) {
  console.log('[VPS Request Service] 📱 FASE 1.3 - Buscando QR Code:', instanceId);
  
  // FASE 1.3: Endpoints múltiplos para máxima compatibilidade
  const endpoints = [
    // Endpoint primário: GET /instance/{id}/qr  
    {
      url: `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQRAlternative.replace('{instanceId}', instanceId)}`,
      method: 'GET',
      body: null,
      name: 'GET_QR_DIRECT'
    },
    // Endpoint secundário: POST /instance/qr
    {
      url: `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQR}`,
      method: 'POST',
      body: JSON.stringify({ instanceId }),
      name: 'POST_QR_BODY'
    },
    // Endpoint terciário: GET /instance/status (pode conter QR)
    {
      url: `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getStatus}`,
      method: 'POST',
      body: JSON.stringify({ instanceId }),
      name: 'STATUS_WITH_QR'
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`[VPS Request Service] 🔄 FASE 1.3 - Testando endpoint ${endpoint.name}: ${endpoint.method} ${endpoint.url}`);
      
      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: getVPSHeaders()
      };
      
      if (endpoint.body) {
        requestOptions.body = endpoint.body;
      }
      
      const response = await makeVPSRequest(endpoint.url, requestOptions, 2);

      if (response.ok) {
        const data = await response.json();
        console.log(`[VPS Request Service] 📥 FASE 1.3 - Resposta do endpoint ${endpoint.name}:`, {
          hasQrCode: !!(data.qrcode || data.qrCode || data.qr_code),
          status: data.status,
          responseKeys: Object.keys(data)
        });
        
        // FASE 1.3: Buscar QR Code em diferentes campos possíveis
        const qrCodeField = data.qrcode || data.qrCode || data.qr_code || data.qr || null;
        
        if (qrCodeField && isRealQRCode(qrCodeField)) {
          const processedQRCode = normalizeQRCode(qrCodeField);
          console.log('[VPS Request Service] ✅ FASE 1.3 - QR Code válido obtido!', {
            endpoint: endpoint.name,
            qrCodeLength: processedQRCode.length,
            hasDataUrl: processedQRCode.startsWith('data:image/')
          });
          
          return {
            success: true,
            qrCode: processedQRCode,
            source: endpoint.name
          };
        } else {
          console.log(`[VPS Request Service] ⏳ FASE 1.3 - QR Code ainda não disponível no endpoint ${endpoint.name}:`, {
            hasQrField: !!qrCodeField,
            qrCodeLength: qrCodeField ? qrCodeField.length : 0,
            isValidQR: qrCodeField ? isRealQRCode(qrCodeField) : false
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`[VPS Request Service] ⚠️ FASE 1.3 - Endpoint ${endpoint.name} falhou: ${response.status} - ${errorText.substring(0, 200)}`);
        
        // Se 404 e contém "ainda não foi gerado", é normal - continuar
        if (response.status === 404 && (errorText.includes('ainda não foi gerado') || errorText.includes('inicializando'))) {
          console.log(`[VPS Request Service] 🔄 FASE 1.3 - VPS ainda inicializando no endpoint ${endpoint.name}...`);
        }
      }
      
    } catch (error: any) {
      console.log(`[VPS Request Service] ❌ FASE 1.3 - Erro no endpoint ${endpoint.name}:`, {
        error: error.message,
        url: endpoint.url
      });
    }
  }
  
  // Nenhum endpoint retornou QR Code
  console.log('[VPS Request Service] ❌ FASE 1.3 - Nenhum endpoint retornou QR Code válido');
  return {
    success: false,
    error: 'QR Code ainda não foi gerado ou instância ainda inicializando'
  };
}

export async function deleteVPSInstance(instanceId: string) {
  console.log('[VPS Request Service] 🗑️ FASE 1.3 - Deletando instância:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.deleteInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ FASE 1.3 - Erro ao deletar:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`
      };
    }

    console.log('[VPS Request Service] ✅ FASE 1.3 - Instância deletada com sucesso');
    return {
      success: true
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ FASE 1.3 - Erro na requisição delete:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getVPSInstances() {
  console.log('[VPS Request Service] 📊 FASE 1.3 - Buscando todas as instâncias da VPS');
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.instances}`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VPS Request Service] ❌ FASE 1.3 - Erro ao buscar instâncias:', response.status, errorText);
      return {
        success: false,
        error: `VPS error ${response.status}: ${errorText}`,
        instances: []
      };
    }

    const data = await response.json();
    console.log('[VPS Request Service] ✅ FASE 1.3 - Instâncias obtidas:', data?.instances?.length || 0);
    return {
      success: true,
      instances: data.instances || data || []
    };
  } catch (error: any) {
    console.error('[VPS Request Service] ❌ FASE 1.3 - Erro na requisição de instâncias:', error);
    return {
      success: false,
      error: error.message,
      instances: []
    };
  }
}
