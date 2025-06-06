
import { VPS_CONFIG, getVPSHeaders, testVPSConnectivity, isRealQRCode } from './config.ts';

// Função auxiliar para deletar instância na VPS
export async function deleteVPSInstance(vpsInstanceId: string, instanceName?: string) {
  const deleteId = `vps_delete_${Date.now()}`;
  console.log(`[VPS Delete] 🗑️ CORREÇÃO - Deletando instância VPS: ${vpsInstanceId} [${deleteId}]`);

  try {
    // Testar conectividade primeiro
    const isConnected = await testVPSConnectivity();
    if (!isConnected) {
      console.warn(`[VPS Delete] ⚠️ CORREÇÃO - VPS não conectado, assumindo que instância já foi removida`);
      return {
        success: true,
        warning: 'VPS não conectado - assumindo que instância já foi removida'
      };
    }

    // Tentar deletar usando o endpoint correto
    const deleteResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/delete`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId: vpsInstanceId
      })
    });

    const responseText = await deleteResponse.text();
    console.log(`[VPS Delete] 📊 CORREÇÃO - Resposta VPS (${deleteResponse.status}):`, responseText);

    if (deleteResponse.ok) {
      try {
        const deleteData = JSON.parse(responseText);
        if (deleteData.success) {
          console.log(`[VPS Delete] ✅ CORREÇÃO - Instância deletada com sucesso da VPS [${deleteId}]`);
          return { success: true };
        } else {
          throw new Error(deleteData.error || 'VPS retornou erro na deleção');
        }
      } catch (parseError) {
        // Se não conseguir fazer parse, mas status foi OK, assumir sucesso
        console.log(`[VPS Delete] ✅ CORREÇÃO - Status OK, assumindo sucesso mesmo sem JSON válido`);
        return { success: true };
      }
    } else {
      throw new Error(`HTTP ${deleteResponse.status}: ${responseText}`);
    }

  } catch (error: any) {
    console.error(`[VPS Delete] ❌ CORREÇÃO - Erro ao deletar instância VPS [${deleteId}]:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CORREÇÃO ROBUSTA: Função principal para obter QR Code com múltiplas estratégias
export async function getVPSInstanceQR(instanceId: string, maxRetries = 3) {
  const requestId = `req_${Date.now()}`;
  console.log(`[VPS Request Service] 🚀 CORREÇÃO ROBUSTA - Iniciando busca QR: ${instanceId} [${requestId}]`);

  // Testar conectividade primeiro
  console.log(`[VPS Request Service] 🔍 CORREÇÃO ROBUSTA - Testando conectividade VPS...`);
  const isConnected = await testVPSConnectivity();
  if (!isConnected) {
    console.error(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - VPS não conectado`);
    return {
      success: false,
      error: 'VPS não está acessível',
      waiting: false
    };
  }

  console.log(`[VPS Request Service] ✅ CORREÇÃO ROBUSTA - VPS conectado, prosseguindo...`);

  // Tentar múltiplos endpoints
  const endpoints = [
    `${VPS_CONFIG.baseUrl}/instance/${instanceId}/qr`,
    `${VPS_CONFIG.baseUrl}/instance/qr`,
    `${VPS_CONFIG.baseUrl}/qr/${instanceId}`
  ];

  for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
    const endpoint = endpoints[endpointIndex];
    console.log(`[VPS Request Service] 🎯 CORREÇÃO ROBUSTA - Testando endpoint ${endpointIndex + 1}/${endpoints.length}: ${endpoint}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[VPS Request Service] 🔄 CORREÇÃO ROBUSTA - Tentativa ${attempt}/${maxRetries} - ${endpoint}`);
        
        const requestBody = endpointIndex === 1 ? { instanceId } : undefined;
        const method = requestBody ? 'POST' : 'GET';
        
        console.log(`[VPS Request Service] 📊 CORREÇÃO ROBUSTA - Configuração:`, {
          method,
          endpoint,
          hasBody: !!requestBody,
          instanceId
        });

        const response = await makeVPSRequest(endpoint, {
          method,
          headers: getVPSHeaders(),
          body: requestBody ? JSON.stringify(requestBody) : undefined,
          signal: AbortSignal.timeout(15000) // 15 segundos timeout
        });

        console.log(`[VPS Request Service] 📊 CORREÇÃO ROBUSTA - Status: ${response.status} (tentativa ${attempt})`);

        if (response.ok) {
          const data = await response.json();
          console.log(`[VPS Request Service] 📥 CORREÇÃO ROBUSTA - Resposta recebida:`, {
            hasQrCode: !!data.qrCode,
            hasSuccess: !!data.success,
            status: data.status,
            endpoint: endpointIndex + 1
          });

          // Validar resposta
          if (data.qrCode && isRealQRCode(data.qrCode)) {
            console.log(`[VPS Request Service] ✅ CORREÇÃO ROBUSTA - QR Code válido obtido do endpoint ${endpointIndex + 1}`);
            return {
              success: true,
              qrCode: data.qrCode,
              status: data.status || 'ready',
              source: `endpoint_${endpointIndex + 1}`,
              attempt
            };
          } else if (data.status === 'initializing' || data.status === 'connecting') {
            console.log(`[VPS Request Service] ⏳ CORREÇÃO ROBUSTA - Instância ainda inicializando: ${data.status}`);
            return {
              success: false,
              waiting: true,
              error: 'QR Code ainda sendo gerado',
              status: data.status
            };
          } else {
            console.log(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - QR Code inválido ou ausente`);
            // Continuar para próxima tentativa
          }
        } else {
          const errorText = await response.text();
          console.error(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - Erro HTTP ${response.status}:`, errorText);
        }

      } catch (error: any) {
        console.error(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - Erro tentativa ${attempt}:`, error.message);
        
        if (attempt === maxRetries) {
          console.error(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - Máximo de tentativas atingido para endpoint ${endpointIndex + 1}`);
        } else {
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
  }

  // Se chegou aqui, todos os endpoints falharam
  console.error(`[VPS Request Service] ❌ CORREÇÃO ROBUSTA - Todos os endpoints falharam [${requestId}]`);
  return {
    success: false,
    error: 'Falha ao obter QR Code de todos os endpoints da VPS',
    waiting: false,
    requestId
  };
}

// Função auxiliar para fazer requisições com retry automático
export async function makeVPSRequest(url: string, options: any, retries = 2) {
  console.log(`[VPS Request] 🌐 CORREÇÃO ROBUSTA - Fazendo requisição: ${options.method || 'GET'} ${url}`);
  console.log(`[VPS Request] 🔑 Token usado: ${VPS_CONFIG.authToken.substring(0, 10)}...`);

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`[VPS Request] 🔄 CORREÇÃO ROBUSTA - Tentativa ${attempt}/${retries + 1} - ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(10000)
      });

      console.log(`[VPS Request] 📊 CORREÇÃO ROBUSTA - Status: ${response.status} (tentativa ${attempt})`);
      
      // Retornar resposta (success ou error) - deixar o caller decidir o que fazer
      return response;

    } catch (error: any) {
      console.error(`[VPS Request] ❌ CORREÇÃO ROBUSTA - Erro tentativa ${attempt}:`, {
        message: error.message,
        name: error.name,
        url
      });

      if (attempt === retries + 1) {
        throw error; // Re-throw no último attempt
      }

      // Aguardar antes da próxima tentativa
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponencial
      console.log(`[VPS Request] ⏳ CORREÇÃO ROBUSTA - Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Todas as tentativas de requisição falharam');
}
