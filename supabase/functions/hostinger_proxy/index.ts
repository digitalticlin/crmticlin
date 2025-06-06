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

    // Testar conectividade na porta 3001
    const portTest = await executeSSHCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "CONNECTION_FAILED"', 'Testar porta 3001');
    
    const portAccessible = portTest.output.includes('200') || portTest.output.includes('404');

    return createSuccessResponse({
      pm2_status: pm2Status.output,
      has_whatsapp_process: hasWhatsAppProcess,
      port_3001_accessible: portAccessible,
      port_test_output: portTest.output,
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
      discoveredToken = 'default-token'; // Token padrão que muitos servidores usam
    }

    return createSuccessResponse({
      config_files: findConfigs.output,
      env_vars: envVars.output,
      env_file: envFile.output,
      pm2_config: pm2Config.output,
      discovered_token: discoveredToken,
      token_source: discoveredToken === 'default-token' ? 'fallback' : 'discovered'
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
