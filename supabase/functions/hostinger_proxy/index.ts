import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS } from './config.ts';
import { CommandRequest } from './types.ts';
import { normalizePath } from './pathUtils.ts';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse } from './responseUtils.ts';
import { checkSSHKeyExists, executeSSHCommand, testSSHConnection } from './sshService.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    console.log('[Hostinger Proxy] Iniciando requisição');

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

    // Processar diferentes ações
    switch (action) {
      case 'test_connection':
        return await handleTestConnection();
      
      case 'discover_whatsapp_port':
        return await handleDiscoverWhatsAppPort();
      
      case 'create_whatsapp_instance':
        return await handleCreateWhatsAppInstance(bodyData.instanceName, bodyData.userEmail, bodyData.userId);
      
      case 'delete_whatsapp_instance':
        return await handleDeleteWhatsAppInstance(bodyData.instanceId, bodyData.userId);
      
      case 'get_server_status':
        return await handleGetServerStatus(bodyData.userId);
      
      case 'refresh_qr_code':
        return await handleRefreshQRCode(bodyData.instanceId, bodyData.userId);
      
      case 'get_qr_code':
        return await handleGetQRCode(bodyData.instanceId, bodyData.userId);
      
      case 'send_message':
        return await handleSendMessage(bodyData.instanceId, bodyData.phone, bodyData.message, bodyData.userId);
      
      case 'sync_instances':
        return await handleSyncInstances(bodyData.userId);
      
      case 'check_server_health':
        return await handleCheckServerHealth();
      
      case 'execute_command':
        return await handleExecuteCommand(bodyData.command, bodyData.description);
      
      case 'check_whatsapp_server':
        return await handleCheckWhatsAppServer();
      
      case 'discover_whatsapp_token':
        return await handleDiscoverWhatsAppToken();
      
      case 'configure_whatsapp_token':
        return await handleConfigureWhatsAppToken(bodyData.token);
      
      default:
        // Fallback para endpoints diretos
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

async function handleDiscoverWhatsAppPort() {
  console.log('[Hostinger Proxy] 🔍 Descobrindo porta do servidor WhatsApp...');
  
  try {
    // Testar portas comuns do WhatsApp
    const portsToTest = [3001, 3002, 3000, 8080];
    const results = [];
    
    for (const port of portsToTest) {
      console.log(`[Hostinger Proxy] Testando porta ${port}...`);
      
      // Testar se a porta está aberta
      const portTest = await executeSSHCommand(
        `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:${port}/health 2>/dev/null || echo "FAILED"`,
        `Testar porta ${port}`
      );
      
      const isAccessible = portTest.output.includes('200') || 
                          portTest.output.includes('404') || 
                          portTest.output.includes('401');
      
      // Verificar se há processo rodando na porta
      const processTest = await executeSSHCommand(
        `netstat -tlnp 2>/dev/null | grep ":${port} " || echo "NO_PROCESS"`,
        `Verificar processo na porta ${port}`
      );
      
      const hasProcess = !processTest.output.includes('NO_PROCESS');
      
      results.push({
        port,
        accessible: isAccessible,
        hasProcess,
        httpResponse: portTest.output,
        processInfo: processTest.output
      });
      
      console.log(`[Hostinger Proxy] Porta ${port}: accessible=${isAccessible}, hasProcess=${hasProcess}`);
    }
    
    // Encontrar a melhor porta
    const workingPort = results.find(r => r.accessible && r.hasProcess);
    const fallbackPort = results.find(r => r.hasProcess);
    
    return createSuccessResponse({
      results,
      recommendedPort: workingPort?.port || fallbackPort?.port || 3001,
      workingPort: workingPort || null,
      fallbackPort: fallbackPort || null
    });

  } catch (error) {
    return createErrorResponse(`Erro ao descobrir porta: ${error.message}`, 'PORT_DISCOVERY_ERROR', 500);
  }
}

async function handleCreateWhatsAppInstance(instanceName: string, userEmail: string, userId: string) {
  console.log(`[Hostinger Proxy] 🚀 Criando instância WhatsApp: ${instanceName}`);
  
  try {
    // Descobrir porta do servidor primeiro
    const portResult = await handleDiscoverWhatsAppPort();
    if (!portResult.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error('Falha ao descobrir porta do servidor');
    }
    
    const portData = JSON.parse(await portResult.text());
    const serverPort = portData.recommendedPort || 3001;
    
    console.log(`[Hostinger Proxy] Usando porta ${serverPort} para criação da instância`);
    
    // Criar instância via comando curl
    const createCommand = `curl -s -X POST "http://localhost:${serverPort}/instance/create" \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
      -d '{"instanceName": "${instanceName}", "token": "3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"}' \\
      --connect-timeout 30 || echo "CREATE_FAILED"`;
    
    const result = await executeSSHCommand(createCommand, `Criar instância ${instanceName}`);
    
    if (result.output.includes('CREATE_FAILED')) {
      throw new Error('Falha na criação da instância via SSH');
    }
    
    // Tentar parsear resposta JSON
    let instanceData = null;
    try {
      instanceData = JSON.parse(result.output);
    } catch {
      // Se não conseguir parsear, criar resposta básica
      instanceData = {
        instance: {
          instanceName,
          status: 'created',
          serverUsed: serverPort
        }
      };
    }
    
    return createSuccessResponse({
      success: true,
      instance: instanceData.instance || { instanceName, status: 'created' },
      qrCode: instanceData.qrCode || null,
      serverPort
    });

  } catch (error) {
    return createErrorResponse(`Erro ao criar instância: ${error.message}`, 'CREATE_INSTANCE_ERROR', 500);
  }
}

async function handleDeleteWhatsAppInstance(instanceId: string, userId: string) {
  console.log(`[Hostinger Proxy] 🗑️ Deletando instância: ${instanceId}`);
  
  try {
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    const serverPort = portData.recommendedPort || 3001;
    
    const deleteCommand = `curl -s -X DELETE "http://localhost:${serverPort}/instance/${instanceId}" \\
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
      --connect-timeout 15 || echo "DELETE_FAILED"`;
    
    const result = await executeSSHCommand(deleteCommand, `Deletar instância ${instanceId}`);
    
    if (result.output.includes('DELETE_FAILED')) {
      throw new Error('Falha na deleção da instância via SSH');
    }
    
    return createSuccessResponse({
      success: true,
      deleted: true,
      instanceId,
      serverPort
    });

  } catch (error) {
    return createErrorResponse(`Erro ao deletar instância: ${error.message}`, 'DELETE_INSTANCE_ERROR', 500);
  }
}

async function handleGetServerStatus(userId: string) {
  console.log('[Hostinger Proxy] 📊 Obtendo status do servidor...');
  
  try {
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    const serverPort = portData.recommendedPort || 3001;
    
    const statusCommand = `curl -s "http://localhost:${serverPort}/instances" \\
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
      --connect-timeout 10 || echo "STATUS_FAILED"`;
    
    const result = await executeSSHCommand(statusCommand, 'Obter status do servidor');
    
    let instances = [];
    if (!result.output.includes('STATUS_FAILED')) {
      try {
        const data = JSON.parse(result.output);
        instances = data.instances || data || [];
      } catch {
        instances = [];
      }
    }
    
    return createSuccessResponse({
      success: true,
      instances,
      server: `WhatsApp via SSH (Porta ${serverPort})`,
      serverPort
    });

  } catch (error) {
    return createErrorResponse(`Erro ao obter status: ${error.message}`, 'GET_STATUS_ERROR', 500);
  }
}

async function handleRefreshQRCode(instanceId: string, userId: string) {
  return await handleGetQRCode(instanceId, userId);
}

async function handleGetQRCode(instanceId: string, userId: string) {
  console.log(`[Hostinger Proxy] 🔍 Obtendo QR Code: ${instanceId}`);
  
  try {
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    const serverPort = portData.recommendedPort || 3001;
    
    const qrCommand = `curl -s "http://localhost:${serverPort}/instance/${instanceId}/qr" \\
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
      --connect-timeout 25 || echo "QR_FAILED"`;
    
    const result = await executeSSHCommand(qrCommand, `Obter QR Code ${instanceId}`);
    
    if (result.output.includes('QR_FAILED')) {
      return createSuccessResponse({
        success: true,
        waiting: true,
        qrCode: null
      });
    }
    
    let qrData = null;
    try {
      qrData = JSON.parse(result.output);
    } catch {
      return createSuccessResponse({
        success: true,
        waiting: true,
        qrCode: null
      });
    }
    
    return createSuccessResponse({
      success: true,
      qrCode: qrData.qrCode || qrData.base64 || null,
      waiting: !qrData.qrCode && !qrData.base64
    });

  } catch (error) {
    return createErrorResponse(`Erro ao obter QR: ${error.message}`, 'GET_QR_ERROR', 500);
  }
}

async function handleSendMessage(instanceId: string, phone: string, message: string, userId: string) {
  console.log(`[Hostinger Proxy] 📤 Enviando mensagem: ${instanceId} -> ${phone}`);
  
  try {
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    const serverPort = portData.recommendedPort || 3001;
    
    const sendCommand = `curl -s -X POST "http://localhost:${serverPort}/send" \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
      -d '{"instanceId": "${instanceId}", "phone": "${phone.replace(/\D/g, '')}", "message": ${JSON.stringify(message)}}' \\
      --connect-timeout 30 || echo "SEND_FAILED"`;
    
    const result = await executeSSHCommand(sendCommand, `Enviar mensagem ${instanceId}`);
    
    if (result.output.includes('SEND_FAILED')) {
      throw new Error('Falha no envio da mensagem via SSH');
    }
    
    let messageData = null;
    try {
      messageData = JSON.parse(result.output);
    } catch {
      messageData = { messageId: `msg_${Date.now()}` };
    }
    
    return createSuccessResponse({
      success: true,
      messageId: messageData.messageId || `msg_${Date.now()}`
    });

  } catch (error) {
    return createErrorResponse(`Erro ao enviar mensagem: ${error.message}`, 'SEND_MESSAGE_ERROR', 500);
  }
}

async function handleSyncInstances(userId: string) {
  console.log('[Hostinger Proxy] 🔄 Sincronizando instâncias...');
  
  try {
    // Obter status atual do servidor
    const statusResult = await handleGetServerStatus(userId);
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

async function handleCheckServerHealth() {
  console.log('[Hostinger Proxy] 🩺 Verificando saúde do servidor...');
  
  try {
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    
    const isHealthy = portData.workingPort !== null;
    const serverPort = portData.recommendedPort || 3001;
    
    return createSuccessResponse({
      success: true,
      data: {
        status: isHealthy ? 'online' : 'offline',
        version: '1.0.0-SSH',
        server: `WhatsApp via SSH (Porta ${serverPort})`,
        uptime: 'N/A (SSH Mode)',
        permanentMode: true,
        activeInstances: 0,
        serverPort,
        discoveryResult: portData
      }
    });

  } catch (error) {
    return createErrorResponse(`Erro ao verificar saúde: ${error.message}`, 'HEALTH_CHECK_ERROR', 500);
  }
}

async function handleTestConnection() {
  console.log('[Hostinger Proxy] 🧪 Testando conexão com VPS...');
  
  const isConnected = await testSSHConnection();
  
  if (isConnected) {
    return createSuccessResponse({
      status: 'online',
      message: 'VPS acessível via SSH',
      timestamp: new Date().toISOString(),
      connection_method: 'SSH'
    });
  } else {
    return createErrorResponse('VPS não acessível via SSH', 'SSH_CONNECTION_FAILED', 503);
  }
}

async function handleExecuteCommand(command: string, description?: string) {
  console.log(`[Hostinger Proxy] 🔧 Executando comando: ${description || command.substring(0, 50)}...`);
  
  if (!command) {
    return createErrorResponse('Comando não fornecido', 'MISSING_COMMAND', 400);
  }

  if (!(await checkSSHKeyExists())) {
    return createErrorResponse(
      'Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets do Supabase.',
      'SSH_KEY_NOT_CONFIGURED',
      500
    );
  }

  try {
    const result = await executeSSHCommand(command, description);
    
    if (result.success) {
      return createSuccessResponse({
        success: true,
        output: result.output,
        exit_code: result.exit_code,
        duration: result.duration,
        connection_method: 'SSH',
        timestamp: new Date().toISOString()
      });
    } else {
      return createErrorResponse(
        `Comando falhou com exit code ${result.exit_code}: ${result.output}`,
        'COMMAND_FAILED',
        400
      );
    }
  } catch (sshError) {
    console.error('[Hostinger Proxy] Erro SSH específico:', sshError);
    return createErrorResponse(
      `Erro SSH: ${sshError.message}`,
      'SSH_EXECUTION_ERROR',
      500
    );
  }
}

async function handleCheckWhatsAppServer() {
  console.log('[Hostinger Proxy] 🔍 Verificando servidor WhatsApp...');
  
  try {
    // Verificar se PM2 está rodando
    const pm2Status = await executeSSHCommand('pm2 status --no-color', 'Verificar status PM2');
    
    if (!pm2Status.success) {
      return createErrorResponse('PM2 não está instalado ou acessível', 'PM2_NOT_FOUND', 404);
    }

    // Verificar se existe processo WhatsApp
    const pm2List = await executeSSHCommand('pm2 list --no-color', 'Listar processos PM2');
    
    const hasWhatsAppProcess = pm2List.output.includes('whatsapp') || 
                             pm2List.output.includes('WhatsApp') ||
                             pm2List.output.includes('server');

    // Descobrir porta ativa
    const portResult = await handleDiscoverWhatsAppPort();
    const portData = JSON.parse(await portResult.text());
    
    const portAccessible = portData.workingPort !== null;

    return createSuccessResponse({
      pm2_status: pm2Status.output,
      has_whatsapp_process: hasWhatsAppProcess,
      port_accessible: portAccessible,
      port_discovery: portData,
      server_running: hasWhatsAppProcess && portAccessible
    });

  } catch (error) {
    return createErrorResponse(`Erro ao verificar servidor: ${error.message}`, 'CHECK_SERVER_ERROR', 500);
  }
}

async function handleDiscoverWhatsAppToken() {
  console.log('[Hostinger Proxy] 🔍 Descobrindo token WhatsApp...');
  
  try {
    // Procurar por arquivos de configuração
    const findConfigs = await executeSSHCommand(
      'find /root -name "*.js" -o -name "*.json" -o -name "*.env" | grep -E "(whatsapp|server)" | head -10',
      'Procurar arquivos de configuração'
    );

    // Procurar por variáveis de ambiente
    const envVars = await executeSSHCommand(
      'env | grep -i token || echo "NO_TOKEN_ENV_VARS"',
      'Verificar variáveis de ambiente'
    );

    // Verificar se existe arquivo .env
    const envFile = await executeSSHCommand(
      'cat /root/whatsapp-web-server/.env 2>/dev/null || echo "NO_ENV_FILE"',
      'Verificar arquivo .env'
    );

    // Verificar configuração PM2
    const pm2Config = await executeSSHCommand(
      'pm2 show whatsapp-server 2>/dev/null || pm2 show server 2>/dev/null || echo "NO_PM2_CONFIG"',
      'Verificar configuração PM2'
    );

    // Tentar descobrir token padrão baseado em padrões comuns
    let discoveredToken = null;
    
    // Verificar se há um token óbvio nos arquivos
    if (envFile.output && !envFile.output.includes('NO_ENV_FILE')) {
      const tokenMatch = envFile.output.match(/TOKEN\s*=\s*([^\s\n]+)/i);
      if (tokenMatch) {
        discoveredToken = tokenMatch[1];
      }
    }

    // Se não encontrou, usar token padrão comum
    if (!discoveredToken) {
      discoveredToken = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    }

    return createSuccessResponse({
      config_files: findConfigs.output,
      env_vars: envVars.output,
      env_file: envFile.output,
      pm2_config: pm2Config.output,
      discovered_token: discoveredToken,
      token_source: discoveredToken === '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3' ? 'default' : 'discovered'
    });

  } catch (error) {
    return createErrorResponse(`Erro ao descobrir token: ${error.message}`, 'DISCOVER_TOKEN_ERROR', 500);
  }
}

async function handleConfigureWhatsAppToken(token: string) {
  console.log('[Hostinger Proxy] ⚙️ Configurando token WhatsApp...');
  
  if (!token) {
    return createErrorResponse('Token não fornecido', 'MISSING_TOKEN', 400);
  }

  try {
    // Criar diretório se não existir
    await executeSSHCommand('mkdir -p /root/whatsapp-web-server', 'Criar diretório');

    // Criar ou atualizar arquivo .env
    const envContent = `
# WhatsApp Web.js Server Configuration
API_TOKEN=${token}
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
`;

    await executeSSHCommand(
      `cat > /root/whatsapp-web-server/.env << 'EOF'${envContent}EOF`,
      'Criar arquivo .env'
    );

    // Reiniciar servidor se estiver rodando
    const restartResult = await executeSSHCommand(
      'cd /root/whatsapp-web-server && pm2 restart whatsapp-server 2>/dev/null || pm2 restart server 2>/dev/null || echo "NO_RESTART_NEEDED"',
      'Reiniciar servidor'
    );

    return createSuccessResponse({
      token_configured: true,
      env_file_created: true,
      restart_result: restartResult.output,
      message: 'Token configurado com sucesso'
    });

  } catch (error) {
    return createErrorResponse(`Erro ao configurar token: ${error.message}`, 'CONFIGURE_TOKEN_ERROR', 500);
  }
}

async function handleDirectEndpoint(path: string, method: string, bodyData: any) {
  if (path === '/health' || path === '/status') {
    return await handleTestConnection();
  }

  if (path === '/execute' && method === 'POST') {
    const { command, description, vpsId }: CommandRequest = bodyData;
    
    if (!command) {
      return createErrorResponse('Comando não fornecido', 'MISSING_COMMAND', 400);
    }

    if (!(await checkSSHKeyExists())) {
      return createErrorResponse(
        'Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets do Supabase.',
        'SSH_KEY_NOT_CONFIGURED',
        500
      );
    }

    try {
      const result = await executeSSHCommand(command, description);
      
      if (result.success) {
        return createSuccessResponse({
          output: result.output,
          exit_code: result.exit_code,
          duration: result.duration,
          connection_method: 'SSH',
          timestamp: new Date().toISOString()
        });
      } else {
        return createErrorResponse(
          `Comando falhou com exit code ${result.exit_code}`,
          undefined,
          500
        );
      }
    } catch (sshError) {
      console.error('[Hostinger Proxy] Erro SSH específico:', sshError);
      return createErrorResponse(
        `Erro SSH: ${sshError.message}`,
        'SSH_EXECUTION_ERROR',
        500
      );
    }
  }

  return createNotFoundResponse(path, method);
}
