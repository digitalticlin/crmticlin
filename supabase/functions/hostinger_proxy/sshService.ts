
import { VPS_CONFIG } from './config.ts';
import { SSHResult } from './types.ts';

export async function checkSSHKeyExists(): Promise<boolean> {
  const sshKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
  if (!sshKey) {
    console.error('[SSH] Chave SSH privada não configurada nos secrets');
    return false;
  }
  console.log('[SSH] Chave SSH privada encontrada nos secrets');
  return true;
}

export async function executeSSHCommand(command: string, description?: string): Promise<SSHResult> {
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

export async function testSSHConnection(): Promise<boolean> {
  try {
    console.log('[SSH] Testando conectividade...');
    const result = await executeSSHCommand('echo "SSH connection test successful"', 'Teste de conectividade SSH');
    return result.success && result.output.includes('SSH connection test successful');
  } catch (error) {
    console.error('[SSH] Teste de conectividade falhou:', error);
    return false;
  }
}
