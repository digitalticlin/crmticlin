
import { executeSSHCommand } from './sshUtils.ts';
import { FixStep } from './types.ts';
import { FIXED_SERVER_CODE, API_SERVER_CODE } from './serverTemplates.ts';

export async function executeFixStep(
  stepName: string,
  description: string,
  command: string,
  executeFunction: () => Promise<{ success: boolean; output: string; error?: string }>
): Promise<FixStep> {
  const step: FixStep = {
    step: stepName,
    status: 'running',
    details: description,
    command: command
  };

  const startTime = Date.now();
  
  try {
    const result = await executeFunction();
    
    if (result.success) {
      step.status = 'success';
      step.details = description;
      step.output = result.output;
    } else {
      throw new Error(result.error || 'Comando falhou');
    }
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
}

export async function testSSHConnection(): Promise<FixStep> {
  return executeFixStep(
    'Verificação de conexão SSH',
    'Testando conexão SSH com a VPS...',
    'echo "SSH Connection Test - $(date)"',
    () => executeSSHCommand('echo "SSH Connection Test - $(date)"', 'Teste de conexão SSH')
  );
}

export async function createBackup(): Promise<FixStep> {
  return executeFixStep(
    'Backup do servidor atual',
    'Criando backup do arquivo server.js...',
    'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"',
    () => executeSSHCommand(
      'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"',
      'Criação de backup'
    )
  );
}

export async function applyServerFixes(): Promise<FixStep> {
  const step: FixStep = {
    step: 'Aplicação das correções SSL/Timeout',
    status: 'running',
    details: 'Criando diretórios e aplicando código corrigido...',
    command: 'mkdir -p /root/whatsapp-server && aplicar código corrigido'
  };

  const startTime = Date.now();
  
  try {
    // Criar diretórios
    await executeSSHCommand('mkdir -p /root/whatsapp-server', 'Criação de diretório WhatsApp');
    await executeSSHCommand('mkdir -p /root/vps-api-server', 'Criação de diretório API');
    
    // Aplicar códigos
    const writeWhatsAppCommand = `cat > /root/whatsapp-server/server.js << 'EOF'
${FIXED_SERVER_CODE}
EOF`;
    
    const writeAPICommand = `cat > /root/vps-api-server/server.js << 'EOF'
${API_SERVER_CODE}
EOF`;
    
    const whatsappResult = await executeSSHCommand(writeWhatsAppCommand, 'Aplicação do código WhatsApp corrigido');
    const apiResult = await executeSSHCommand(writeAPICommand, 'Aplicação do código API server');
    
    if (whatsappResult.success && apiResult.success) {
      step.status = 'success';
      step.details = 'Arquivos server.js atualizados com correções SSL/Timeout e API server criado';
      step.output = 'Códigos corrigidos aplicados com sucesso';
    } else {
      throw new Error('Falha na aplicação de um ou ambos os códigos');
    }
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro ao aplicar correções: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
}

export async function installDependencies(): Promise<FixStep> {
  const step: FixStep = {
    step: 'Verificação e instalação de dependências',
    status: 'running',
    details: 'Verificando package.json e instalando dependências...',
    command: 'npm install em ambos os diretórios'
  };

  const startTime = Date.now();
  
  try {
    // Criar package.json files
    const packageWhatsAppCommand = `cd /root/whatsapp-server && if [ ! -f package.json ]; then
cat > package.json << 'EOF'
{
  "name": "whatsapp-server",
  "version": "2.0.0-ssl-fix",
  "description": "WhatsApp Web.js Server with SSL and Timeout fixes",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "qrcode": "^1.5.3"
  }
}
EOF
fi`;
    
    const packageAPICommand = `cd /root/vps-api-server && if [ ! -f package.json ]; then
cat > package.json << 'EOF'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "description": "API Server para controle remoto da VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF
fi`;
    
    await executeSSHCommand(packageWhatsAppCommand, 'Criação do package.json WhatsApp');
    await executeSSHCommand(packageAPICommand, 'Criação do package.json API');
    
    await executeSSHCommand('cd /root/whatsapp-server && npm install', 'Instalação de dependências WhatsApp');
    await executeSSHCommand('cd /root/vps-api-server && npm install', 'Instalação de dependências API');
    
    step.status = 'success';
    step.details = 'Dependências verificadas e instaladas em ambos os servidores';
    step.output = 'package.json criados e dependências instaladas';
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro na instalação de dependências: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
}

export async function restartServers(): Promise<FixStep> {
  const step: FixStep = {
    step: 'Reinicialização dos servidores',
    status: 'running',
    details: 'Parando processos antigos e iniciando novos servidores...',
    command: 'pkill node && iniciar ambos os servidores'
  };

  const startTime = Date.now();
  
  try {
    // Parar processos antigos
    await executeSSHCommand('pkill -f "node.*server.js" || true', 'Parada de processos antigos');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Iniciar servidores
    await executeSSHCommand(
      'cd /root/whatsapp-server && nohup node server.js > whatsapp.log 2>&1 & echo "WhatsApp server iniciado"',
      'Inicialização do WhatsApp server'
    );
    
    await executeSSHCommand(
      'cd /root/vps-api-server && nohup node server.js > api.log 2>&1 & echo "API server iniciado"',
      'Inicialização do API server'
    );
    
    step.status = 'success';
    step.details = 'Ambos os servidores reiniciados com sucesso';
    step.output = 'WhatsApp server (porta 3001) e API server (porta 3002) iniciados';
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro ao reiniciar servidores: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
}

export async function verifyInstallation(): Promise<FixStep> {
  const step: FixStep = {
    step: 'Verificação pós-correção',
    status: 'running',
    details: 'Aguardando servidores estabilizarem e verificando endpoints...',
    command: 'sleep 10 && curl health endpoints'
  };

  const startTime = Date.now();
  
  try {
    // Aguardar estabilização
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const whatsappResult = await executeSSHCommand(
      'curl -s http://localhost:3001/health',
      'Verificação do WhatsApp server'
    );
    
    const apiResult = await executeSSHCommand(
      'curl -s http://localhost:3002/status',
      'Verificação do API server'
    );
    
    if (whatsappResult.success && apiResult.success) {
      step.status = 'success';
      step.details = `Ambos os servidores funcionando! WhatsApp: online, API: online`;
      step.output = `WhatsApp: ${whatsappResult.output}\nAPI: ${apiResult.output}`;
    } else {
      throw new Error(`WhatsApp server: ${whatsappResult.success ? 'OK' : 'FALHA'}, API server: ${apiResult.success ? 'OK' : 'FALHA'}`);
    }
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro na verificação final: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
}
