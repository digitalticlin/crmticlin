
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
    console.log('[SSH Proxy] Iniciando requisição via SSH');

    const url = new URL(req.url);
    const path = normalizePath(url.pathname);
    const method = req.method;
    
    console.log(`[SSH Proxy] ${method} ${path} (processado de: ${url.pathname})`);

    // Processar diferentes endpoints
    if (path === '/health' || path === '/status') {
      // Teste de conectividade básico
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

    if (path === '/execute' && method === 'POST') {
      let requestBody = null;
      if (req.body) {
        requestBody = await req.text();
        console.log(`[SSH Proxy] Request body: ${requestBody.substring(0, 200)}...`);
      }

      const { command, description, vpsId }: CommandRequest = JSON.parse(requestBody || '{}');
      
      if (!command) {
        return createErrorResponse('Comando não fornecido', 'MISSING_COMMAND', 400);
      }

      // Verificar se a chave SSH está configurada antes de executar
      if (!(await checkSSHKeyExists())) {
        return createErrorResponse(
          'Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets do Supabase.',
          'SSH_KEY_NOT_CONFIGURED',
          500
        );
      }

      // Executar comando via SSH
      console.log(`[SSH Proxy] Executando comando: ${description || 'Comando personalizado'}`);
      
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
        console.error('[SSH Proxy] Erro SSH específico:', sshError);
        return createErrorResponse(
          `Erro SSH: ${sshError.message}`,
          'SSH_EXECUTION_ERROR',
          500
        );
      }
    }

    // Endpoint não encontrado
    return createNotFoundResponse(path, method);

  } catch (error: any) {
    console.error('[SSH Proxy] Erro geral:', error);
    return createErrorResponse(
      error.message || 'Erro interno do servidor SSH',
      'INTERNAL_SSH_ERROR',
      500
    );
  }
});
