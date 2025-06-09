
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS } from './config.ts';
import { CommandRequest } from './types.ts';
import { normalizePath } from './pathUtils.ts';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse } from './responseUtils.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    console.log('[Hostinger Proxy] 🔧 CORREÇÃO FINAL: Usando HTTP direto em vez de SSH');

    const url = new URL(req.url);
    const path = normalizePath(url.pathname);
    const method = req.method;
    
    console.log(`[Hostinger Proxy] ${method} ${path}`);

    let requestBody = null;
    if (req.body && method !== 'GET') {
      requestBody = await req.text();
      console.log(`[Hostinger Proxy] Request body: ${requestBody.substring(0, 200)}...`);
    }

    const bodyData = requestBody ? JSON.parse(requestBody) : {};
    const { action } = bodyData;

    // Processar diferentes ações usando HTTP direto
    switch (action) {
      case 'test_connection':
        return await handleTestConnectionHTTP();
      
      case 'discover_whatsapp_port':
        return await handleDiscoverWhatsAppPortHTTP();
      
      case 'create_whatsapp_instance':
        return await handleCreateWhatsAppInstanceHTTP(bodyData.instanceName, bodyData.userEmail, bodyData.userId);
      
      case 'delete_whatsapp_instance':
        return await handleDeleteWhatsAppInstanceHTTP(bodyData.instanceId, bodyData.userId);
      
      case 'get_server_status':
        return await handleGetServerStatusHTTP(bodyData.userId);
      
      case 'refresh_qr_code':
        return await handleRefreshQRCodeHTTP(bodyData.instanceId, bodyData.userId);
      
      case 'get_qr_code':
        return await handleGetQRCodeHTTP(bodyData.instanceId, bodyData.userId);
      
      case 'send_message':
        return await handleSendMessageHTTP(bodyData.instanceId, bodyData.phone, bodyData.message, bodyData.userId);
      
      case 'sync_instances':
        return await handleSyncInstancesHTTP(bodyData.userId);
      
      case 'check_server_health':
        return await handleCheckServerHealthHTTP();
      
      default:
        return await handleDirectEndpoint(path, method, bodyData);
    }

  } catch (error: any) {
    console.error('[Hostinger Proxy] Erro geral:', error);
    return createErrorResponse(
      error.message || 'Erro interno do servidor',
      'INTERNAL_ERROR',
      500
    );
  }
});

// NOVA IMPLEMENTAÇÃO: HTTP direto para contornar limitação SSH
async function makeVPSHTTPRequest(endpoint: string, options: any = {}) {
  const ports = [3002, 3001, 3000, 8080]; // Portas para testar
  const baseUrl = '31.97.24.222';
  const token = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
  
  for (const port of ports) {
    try {
      const url = `http://${baseUrl}:${port}${endpoint}`;
      console.log(`[HTTP Request] Tentando: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Token': token,
          ...options.headers
        },
        signal: AbortSignal.timeout(15000) // 15 segundos timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[HTTP Request] Sucesso na porta ${port}:`, data);
        return { success: true, data, port };
      } else {
        console.log(`[HTTP Request] Porta ${port} retornou ${response.status}`);
      }
    } catch (error) {
      console.log(`[HTTP Request] Porta ${port} falhou:`, error.message);
      continue;
    }
  }
  
  throw new Error('Todas as portas falharam na comunicação HTTP');
}

async function handleTestConnectionHTTP() {
  console.log('[Hostinger Proxy] 🧪 Testando conexão HTTP direta...');
  
  try {
    const result = await makeVPSHTTPRequest('/health', { method: 'GET' });
    
    return createSuccessResponse({
      status: 'online',
      message: `VPS acessível via HTTP na porta ${result.port}`,
      timestamp: new Date().toISOString(),
      connection_method: 'HTTP_DIRECT',
      port: result.port,
      data: result.data
    });
  } catch (error) {
    return createErrorResponse(
      `VPS não acessível via HTTP: ${error.message}`,
      'HTTP_CONNECTION_FAILED',
      503
    );
  }
}

async function handleDiscoverWhatsAppPortHTTP() {
  console.log('[Hostinger Proxy] 🔍 Descobrindo porta via HTTP...');
  
  const ports = [3002, 3001, 3000, 8080];
  const results = [];
  
  for (const port of ports) {
    try {
      const url = `http://31.97.24.222:${port}/health`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      results.push({
        port,
        accessible: response.ok,
        status: response.status,
        httpResponse: response.ok ? await response.text() : `HTTP ${response.status}`
      });
    } catch (error) {
      results.push({
        port,
        accessible: false,
        error: error.message
      });
    }
  }
  
  const workingPort = results.find(r => r.accessible);
  
  return createSuccessResponse({
    results,
    recommendedPort: workingPort?.port || 3002,
    workingPort: workingPort || null
  });
}

async function handleCreateWhatsAppInstanceHTTP(instanceName: string, userEmail: string, userId: string) {
  console.log(`[Hostinger Proxy] 🚀 Criando instância via HTTP: ${instanceName}`);
  
  try {
    const result = await makeVPSHTTPRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: instanceName,
        token: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
      })
    });
    
    return createSuccessResponse({
      success: true,
      instance: result.data.instance || { instanceName, status: 'created' },
      qrCode: result.data.qrCode || null,
      serverPort: result.port
    });

  } catch (error) {
    return createErrorResponse(`Erro ao criar instância: ${error.message}`, 'CREATE_INSTANCE_ERROR', 500);
  }
}

async function handleDeleteWhatsAppInstanceHTTP(instanceId: string, userId: string) {
  console.log(`[Hostinger Proxy] 🗑️ Deletando instância via HTTP: ${instanceId}`);
  
  try {
    const result = await makeVPSHTTPRequest(`/instance/${instanceId}`, {
      method: 'DELETE'
    });
    
    return createSuccessResponse({
      success: true,
      deleted: true,
      instanceId,
      serverPort: result.port
    });

  } catch (error) {
    return createErrorResponse(`Erro ao deletar instância: ${error.message}`, 'DELETE_INSTANCE_ERROR', 500);
  }
}

async function handleGetServerStatusHTTP(userId: string) {
  console.log('[Hostinger Proxy] 📊 Obtendo status via HTTP...');
  
  try {
    const result = await makeVPSHTTPRequest('/instances', { method: 'GET' });
    
    return createSuccessResponse({
      success: true,
      instances: result.data.instances || result.data || [],
      server: `WhatsApp via HTTP (Porta ${result.port})`,
      serverPort: result.port
    });

  } catch (error) {
    return createErrorResponse(`Erro ao obter status: ${error.message}`, 'GET_STATUS_ERROR', 500);
  }
}

async function handleRefreshQRCodeHTTP(instanceId: string, userId: string) {
  return await handleGetQRCodeHTTP(instanceId, userId);
}

async function handleGetQRCodeHTTP(instanceId: string, userId: string) {
  console.log(`[Hostinger Proxy] 🔍 Obtendo QR Code via HTTP: ${instanceId}`);
  
  try {
    const result = await makeVPSHTTPRequest(`/instance/${instanceId}/qr`, { method: 'GET' });
    
    return createSuccessResponse({
      success: true,
      qrCode: result.data.qrCode || result.data.base64 || null,
      waiting: !result.data.qrCode && !result.data.base64
    });

  } catch (error) {
    return createSuccessResponse({
      success: true,
      waiting: true,
      qrCode: null
    });
  }
}

async function handleSendMessageHTTP(instanceId: string, phone: string, message: string, userId: string) {
  console.log(`[Hostinger Proxy] 📤 Enviando mensagem via HTTP: ${instanceId} -> ${phone}`);
  
  try {
    const result = await makeVPSHTTPRequest('/send', {
      method: 'POST',
      body: JSON.stringify({
        instanceId: instanceId,
        phone: phone.replace(/\D/g, ''),
        message: message
      })
    });
    
    return createSuccessResponse({
      success: true,
      messageId: result.data.messageId || `msg_${Date.now()}`
    });

  } catch (error) {
    return createErrorResponse(`Erro ao enviar mensagem: ${error.message}`, 'SEND_MESSAGE_ERROR', 500);
  }
}

async function handleSyncInstancesHTTP(userId: string) {
  console.log('[Hostinger Proxy] 🔄 Sincronizando via HTTP...');
  
  try {
    const statusResult = await handleGetServerStatusHTTP(userId);
    const statusData = JSON.parse(await statusResult.text());
    
    return createSuccessResponse({
      success: true,
      data: {
        summary: {
          updated: statusData.instances?.length || 0,
          preserved: 0,
          adopted: 0,
          errors: 0
        },
        instances: statusData.instances || []
      }
    });

  } catch (error) {
    return createErrorResponse(`Erro ao sincronizar: ${error.message}`, 'SYNC_ERROR', 500);
  }
}

async function handleCheckServerHealthHTTP() {
  console.log('[Hostinger Proxy] 🩺 Verificando saúde via HTTP...');
  
  try {
    const result = await makeVPSHTTPRequest('/health', { method: 'GET' });
    
    return createSuccessResponse({
      success: true,
      data: {
        status: 'online',
        version: '1.0.0-HTTP',
        server: `WhatsApp via HTTP (Porta ${result.port})`,
        uptime: 'N/A (HTTP Mode)',
        permanentMode: true,
        activeInstances: 0,
        serverPort: result.port,
        httpResult: result.data
      }
    });

  } catch (error) {
    return createErrorResponse(`Erro ao verificar saúde: ${error.message}`, 'HEALTH_CHECK_ERROR', 500);
  }
}

async function handleDirectEndpoint(path: string, method: string, bodyData: any) {
  if (path === '/health' || path === '/status') {
    return await handleTestConnectionHTTP();
  }

  return createNotFoundResponse(path, method);
}
