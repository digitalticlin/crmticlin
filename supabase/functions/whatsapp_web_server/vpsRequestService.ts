
import { VPS_CONFIG, getVPSHeaders, isRealQRCode, normalizeQRCode } from './config.ts';

// FASE 1.2: Função auxiliar para fazer requisições com retry
async function makeVPSRequest(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[VPS Request] 🌐 Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Request] 📊 Status: ${response.status}`);
      return response;
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Aguardar antes de retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function createVPSInstance(payload: any) {
  console.log('[VPS Request Service] 🚀 FASE 1.2 - Criando instância na VPS:', payload);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.createInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify(payload)
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
    console.log('[VPS Request Service] ✅ Resposta da criação:', data);
    
    // FASE 1.2: Padronizar resposta - VPS pode retornar 'qrcode' ou 'qrCode'
    const qrCodeField = data.qrcode || data.qrCode || data.qr_code || null;
    let processedQRCode = null;
    
    if (qrCodeField && isRealQRCode(qrCodeField)) {
      processedQRCode = normalizeQRCode(qrCodeField);
      console.log('[VPS Request Service] ✅ QR Code válido encontrado na criação');
    } else {
      console.log('[VPS Request Service] ⏳ QR Code não disponível na criação - será obtido via polling');
    }
    
    return {
      success: true,
      data: data,
      qrCode: processedQRCode
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
  console.log('[VPS Request Service] 📱 FASE 1.2 - Buscando QR Code:', instanceId);
  
  // FASE 1.2: Tentar ambos os endpoints para máxima compatibilidade
  const endpoints = [
    // Endpoint primário: POST /instance/qr
    {
      url: `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQR}`,
      method: 'POST',
      body: JSON.stringify({ instanceId })
    },
    // Endpoint alternativo: GET /instance/{id}/qr  
    {
      url: `${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.getQRAlternative.replace('{instanceId}', instanceId)}`,
      method: 'GET',
      body: null
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`[VPS Request Service] 🔄 Testando endpoint: ${endpoint.method} ${endpoint.url}`);
      
      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: getVPSHeaders()
      };
      
      if (endpoint.body) {
        requestOptions.body = endpoint.body;
      }
      
      const response = await makeVPSRequest(endpoint.url, requestOptions, 1);

      if (response.ok) {
        const data = await response.json();
        console.log(`[VPS Request Service] 📥 Resposta do endpoint ${endpoint.method}:`, {
          hasQrCode: !!(data.qrcode || data.qrCode || data.qr_code),
          status: data.status
        });
        
        // FASE 1.2: Buscar QR Code em diferentes campos
        const qrCodeField = data.qrcode || data.qrCode || data.qr_code || null;
        
        if (qrCodeField && isRealQRCode(qrCodeField)) {
          const processedQRCode = normalizeQRCode(qrCodeField);
          console.log('[VPS Request Service] ✅ QR Code válido obtido!');
          
          return {
            success: true,
            qrCode: processedQRCode
          };
        } else {
          console.log('[VPS Request Service] ⏳ QR Code ainda não disponível neste endpoint');
        }
      } else {
        const errorText = await response.text();
        console.log(`[VPS Request Service] ⚠️ Endpoint ${endpoint.method} falhou: ${response.status} - ${errorText}`);
        
        // Se 404 e contém "ainda não foi gerado", é normal - continuar
        if (response.status === 404 && (errorText.includes('ainda não foi gerado') || errorText.includes('inicializando'))) {
          console.log('[VPS Request Service] 🔄 VPS ainda inicializando...');
        }
      }
      
    } catch (error: any) {
      console.log(`[VPS Request Service] ❌ Erro no endpoint ${endpoint.method}:`, error.message);
    }
  }
  
  // Nenhum endpoint retornou QR Code
  return {
    success: false,
    error: 'QR Code ainda não foi gerado ou instância ainda inicializando'
  };
}

export async function deleteVPSInstance(instanceId: string) {
  console.log('[VPS Request Service] 🗑️ FASE 1.2 - Deletando instância:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.deleteInstance}`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
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
  console.log('[VPS Request Service] 📊 FASE 1.2 - Buscando todas as instâncias da VPS');
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.instances}`, {
      method: 'GET',
      headers: getVPSHeaders()
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
