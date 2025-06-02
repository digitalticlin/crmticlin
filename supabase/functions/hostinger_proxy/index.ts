
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommandRequest {
  vpsId: string;
  command: string;
  description?: string;
}

// Configuração SSH da VPS
const VPS_CONFIG = {
  hostname: '31.97.24.222',
  port: 22,
  username: 'root',
  timeout: 30000 // 30 segundos
};

async function executeSSHCommand(command: string, description?: string): Promise<any> {
  console.log(`[SSH] Executando: ${description || command.substring(0, 100)}...`);
  
  try {
    // Comando SSH com todas as opções de segurança
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ConnectTimeout=30',
      '-o', 'ServerAliveInterval=60',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'BatchMode=yes',
      '-o', 'PasswordAuthentication=no',
      '-o', 'PubkeyAuthentication=yes',
      `${VPS_CONFIG.username}@${VPS_CONFIG.hostname}`,
      command
    ];
    
    console.log(`[SSH] Conectando em ${VPS_CONFIG.hostname} com argumentos:`, sshArgs.slice(0, -2).join(' '));
    
    // Executar comando SSH usando Deno
    const process = new Deno.Command('ssh', {
      args: sshArgs,
      stdout: 'piped',
      stderr: 'piped',
    });
    
    const { code, stdout, stderr } = await process.output();
    
    const outputText = new TextDecoder().decode(stdout);
    const errorText = new TextDecoder().decode(stderr);
    
    console.log(`[SSH] Exit code: ${code}`);
    if (outputText) console.log(`[SSH] Output: ${outputText.substring(0, 500)}...`);
    if (errorText) console.log(`[SSH] Error: ${errorText.substring(0, 500)}...`);
    
    // Retornar resultado no formato esperado
    return {
      success: code === 0,
      output: outputText || errorText,
      exit_code: code,
      duration: 0 // Será calculado pelo chamador se necessário
    };
    
  } catch (error) {
    console.error(`[SSH] Erro na execução:`, error);
    throw new Error(`Falha na conexão SSH: ${error.message}`);
  }
}

async function testSSHConnection(): Promise<boolean> {
  try {
    console.log('[SSH] Testando conectividade...');
    const result = await executeSSHCommand('echo "SSH connection test successful"', 'Teste de conectividade SSH');
    return result.success && result.output.includes('SSH connection test successful');
  } catch (error) {
    console.error('[SSH] Teste de conectividade falhou:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SSH Proxy] Iniciando requisição via SSH');

    const url = new URL(req.url);
    // Corrigir parsing do path - remover prefixo da função e limpar barras extras
    let path = url.pathname.replace('/functions/v1/hostinger_proxy', '').replace(/^\/+/, '/');
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const method = req.method;

    console.log(`[SSH Proxy] ${method} ${path} (original: ${url.pathname})`);

    // Processar diferentes endpoints
    if (path === '/health' || path === '/status') {
      // Teste de conectividade básico
      const isConnected = await testSSHConnection();
      
      if (isConnected) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              status: 'online',
              message: 'VPS acessível via SSH',
              timestamp: new Date().toISOString(),
              connection_method: 'SSH'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'VPS não acessível via SSH',
            code: 'SSH_CONNECTION_FAILED'
          }),
          { 
            status: 503, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (path === '/execute' && method === 'POST') {
      let requestBody = null;
      if (req.body) {
        requestBody = await req.text();
        console.log(`[SSH Proxy] Request body: ${requestBody.substring(0, 200)}...`);
      }

      const { command, description, vpsId } = JSON.parse(requestBody || '{}');
      
      if (!command) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Comando não fornecido',
            code: 'MISSING_COMMAND'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Executar comando via SSH
      console.log(`[SSH Proxy] Executando comando: ${description || 'Comando personalizado'}`);
      
      try {
        const result = await executeSSHCommand(command, description);
        
        if (result.success) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                output: result.output,
                exit_code: result.exit_code,
                duration: result.duration,
                connection_method: 'SSH',
                timestamp: new Date().toISOString()
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Comando falhou com exit code ${result.exit_code}`,
              data: {
                output: result.output,
                exit_code: result.exit_code,
                error_details: result.output
              }
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (sshError) {
        console.error('[SSH Proxy] Erro SSH específico:', sshError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro SSH: ${sshError.message}`,
            code: 'SSH_EXECUTION_ERROR',
            details: sshError.toString()
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Endpoint não encontrado: ${path}`,
        code: 'ENDPOINT_NOT_FOUND',
        available_endpoints: ['/health', '/status', '/execute']
      }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[SSH Proxy] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor SSH',
        code: 'INTERNAL_SSH_ERROR',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
