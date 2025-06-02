
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
  timeout: 60000 // 60 segundos para comandos longos
};

async function checkSSHKeyExists(): Promise<boolean> {
  const sshKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
  if (!sshKey) {
    console.error('[SSH] Chave SSH privada não configurada nos secrets');
    return false;
  }
  console.log('[SSH] Chave SSH privada encontrada nos secrets');
  return true;
}

async function executeSSHCommand(command: string, description?: string): Promise<any> {
  console.log(`[SSH] Executando: ${description || command.substring(0, 100)}...`);
  
  // Verificar se a chave SSH está configurada
  if (!(await checkSSHKeyExists())) {
    throw new Error('Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets do Supabase.');
  }
  
  try {
    // Salvar chave SSH temporariamente
    const sshKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
    const tempKeyPath = '/tmp/ssh_key';
    
    // Escrever chave SSH no arquivo temporário
    await Deno.writeTextFile(tempKeyPath, sshKey + '\n');
    await Deno.chmod(tempKeyPath, 0o600);
    
    // Comando SSH com chave privada
    const sshArgs = [
      '-i', tempKeyPath,
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
    
    console.log(`[SSH] Conectando em ${VPS_CONFIG.hostname} com chave SSH privada`);
    
    // Executar comando SSH usando Deno
    const process = new Deno.Command('ssh', {
      args: sshArgs,
      stdout: 'piped',
      stderr: 'piped',
    });
    
    const startTime = Date.now();
    const { code, stdout, stderr } = await process.output();
    const duration = Date.now() - startTime;
    
    const outputText = new TextDecoder().decode(stdout);
    const errorText = new TextDecoder().decode(stderr);
    
    console.log(`[SSH] Exit code: ${code}, Duration: ${duration}ms`);
    if (outputText) console.log(`[SSH] Output: ${outputText.substring(0, 500)}...`);
    if (errorText) console.log(`[SSH] Error: ${errorText.substring(0, 500)}...`);
    
    // Limpar arquivo temporário
    try {
      await Deno.remove(tempKeyPath);
    } catch (e) {
      console.warn('[SSH] Falha ao remover arquivo temporário:', e);
    }
    
    // Retornar resultado no formato esperado
    return {
      success: code === 0,
      output: outputText || errorText,
      exit_code: code,
      duration: duration
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
    
    // Melhorar parsing do path - mais robusto
    let path = url.pathname;
    console.log(`[SSH Proxy] Path original: ${path}`);
    
    // Remover prefixos da função de diferentes formas
    const prefixes = [
      '/functions/v1/hostinger_proxy',
      '/hostinger_proxy',
      '/v1/hostinger_proxy'
    ];
    
    for (const prefix of prefixes) {
      if (path.startsWith(prefix)) {
        path = path.substring(prefix.length);
        break;
      }
    }
    
    // Normalizar path
    if (!path || path === '') {
      path = '/';
    } else if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remover barras duplas
    path = path.replace(/\/+/g, '/');
    
    const method = req.method;
    console.log(`[SSH Proxy] ${method} ${path} (processado de: ${url.pathname})`);

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

      // Verificar se a chave SSH está configurada antes de executar
      if (!(await checkSSHKeyExists())) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets do Supabase.',
            code: 'SSH_KEY_NOT_CONFIGURED'
          }),
          { 
            status: 500, 
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
        available_endpoints: ['/health', '/status', '/execute'],
        debug_info: {
          original_path: url.pathname,
          processed_path: path,
          method: method
        }
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
