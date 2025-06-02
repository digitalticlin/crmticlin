
import { executeAPICommand, testAPIConnection } from './apiUtils.ts';
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

export async function testConnection(): Promise<FixStep> {
  return executeFixStep(
    'Verificação de conexão API',
    'Testando conexão com API Server da VPS...',
    'GET /status',
    () => testAPIConnection()
  );
}

export async function createBackup(): Promise<FixStep> {
  return executeFixStep(
    'Backup do servidor atual',
    'Criando backup do arquivo server.js...',
    'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"',
    () => executeAPICommand(
      'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"',
      'Criação de backup'
    )
  );
}

export async function installAPIServer(): Promise<FixStep> {
  const step: FixStep = {
    step: 'Instalação do API Server',
    status: 'running',
    details: 'Instalando API Server na porta 3002...',
    command: 'Instalação e configuração do API Server'
  };

  const startTime = Date.now();
  
  try {
    // Criar diretório e instalar código
    await executeAPICommand('mkdir -p /root/vps-api-server', 'Criação de diretório API');
    
    const installAPICommand = `cat > /root/vps-api-server/server.js << 'EOF'
${API_SERVER_CODE}
EOF`;
    
    const packageAPICommand = `cd /root/vps-api-server && cat > package.json << 'EOF'
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
EOF`;
    
    const apiResult = await executeAPICommand(installAPICommand, 'Instalação do código API Server');
    const packageResult = await executeAPICommand(packageAPICommand, 'Criação do package.json API');
    const installResult = await executeAPICommand('cd /root/vps-api-server && npm install', 'Instalação de dependências API');
    
    if (apiResult.success && packageResult.success && installResult.success) {
      step.status = 'success';
      step.details = 'API Server instalado e dependências configuradas';
      step.output = 'API Server pronto na porta 3002';
    } else {
      throw new Error('Falha na instalação do API Server');
    }
  } catch (error: any) {
    step.status = 'error';
    step.details = `Erro na instalação do API Server: ${error.message}`;
  }
  
  step.duration = Date.now() - startTime;
  return step;
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
    // Criar diretório
    await executeAPICommand('mkdir -p /root/whatsapp-server', 'Criação de diretório WhatsApp');
    
    // Aplicar código corrigido
    const writeWhatsAppCommand = `cat > /root/whatsapp-server/server.js << 'EOF'
${FIXED_SERVER_CODE}
EOF`;
    
    const whatsappResult = await executeAPICommand(writeWhatsAppCommand, 'Aplicação do código WhatsApp corrigido');
    
    if (whatsappResult.success) {
      step.status = 'success';
      step.details = 'Arquivo server.js atualizado com correções SSL/Timeout';
      step.output = 'Código corrigido aplicado com sucesso';
    } else {
      throw new Error('Falha na aplicação do código WhatsApp');
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
    command: 'npm install no diretório WhatsApp'
  };

  const startTime = Date.now();
  
  try {
    // Criar package.json
    const packageWhatsAppCommand = `cd /root/whatsapp-server && cat > package.json << 'EOF'
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
EOF`;
    
    await executeAPICommand(packageWhatsAppCommand, 'Criação do package.json WhatsApp');
    await executeAPICommand('cd /root/whatsapp-server && npm install', 'Instalação de dependências WhatsApp');
    
    step.status = 'success';
    step.details = 'Dependências verificadas e instaladas';
    step.output = 'package.json criado e dependências instaladas';
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
    await executeAPICommand('pkill -f "node.*server.js" || true', 'Parada de processos antigos');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Iniciar WhatsApp server
    await executeAPICommand(
      'cd /root/whatsapp-server && nohup node server.js > whatsapp.log 2>&1 & echo "WhatsApp server iniciado"',
      'Inicialização do WhatsApp server'
    );
    
    // Iniciar API server
    await executeAPICommand(
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
    step: 'Verificação pós-instalação',
    status: 'running',
    details: 'Aguardando servidores estabilizarem e verificando endpoints...',
    command: 'sleep 10 && curl health endpoints'
  };

  const startTime = Date.now();
  
  try {
    // Aguardar estabilização
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const whatsappResult = await executeAPICommand(
      'curl -s http://localhost:3001/health',
      'Verificação do WhatsApp server'
    );
    
    const apiResult = await executeAPICommand(
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
