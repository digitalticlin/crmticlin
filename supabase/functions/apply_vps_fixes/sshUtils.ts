
import { VPS_SSH_CONFIG } from './config.ts';

export async function executeSSHCommand(command: string, description: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    console.log(`🔧 Executando via SSH: ${description}`);
    console.log(`Command: ${command}`);
    
    const sshPrivateKey = Deno.env.get('VPS_SSH_PRIVATE_KEY');
    if (!sshPrivateKey) {
      throw new Error('Chave SSH privada não configurada. Configure VPS_SSH_PRIVATE_KEY nos secrets.');
    }

    // Criar arquivo temporário com a chave SSH
    const keyFile = await Deno.makeTempFile({ suffix: '.pem' });
    await Deno.writeTextFile(keyFile, sshPrivateKey);
    await Deno.chmod(keyFile, 0o600);

    try {
      // Executar comando SSH
      const sshCommand = [
        'ssh',
        '-i', keyFile,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'ConnectTimeout=30',
        `${VPS_SSH_CONFIG.username}@${VPS_SSH_CONFIG.host}`,
        command
      ];

      const process = new Deno.Command('ssh', {
        args: sshCommand.slice(1),
        stdout: 'piped',
        stderr: 'piped',
      });

      const { code, stdout, stderr } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      if (code === 0) {
        console.log(`✅ SSH sucesso: ${output.substring(0, 200)}`);
        return {
          success: true,
          output: output || 'Comando executado com sucesso'
        };
      } else {
        console.error(`❌ SSH erro (código ${code}): ${error}`);
        return {
          success: false,
          output: output,
          error: `SSH failed (code ${code}): ${error}`
        };
      }
    } finally {
      // Limpar arquivo de chave temporário
      await Deno.remove(keyFile).catch(() => {});
    }
    
  } catch (error: any) {
    console.error(`❌ Erro SSH: ${error.message}`);
    return {
      success: false,
      output: '',
      error: `Erro SSH: ${error.message}`
    };
  }
}
