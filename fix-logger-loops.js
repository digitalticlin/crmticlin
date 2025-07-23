// 🔧 SCRIPT PARA CORRIGIR LOGGER E LOOPS INFINITOS
// Este script corrige os problemas identificados nos logs

const fs = require('fs');
const path = require('path');

console.log('🔧 === CORREÇÃO DE LOGGER E LOOPS INFINITOS ===');

// 1. CRIAR LOGGER COMPATÍVEL PARA BAILEYS
const createFixedLogger = () => {
  return `
// 🔧 LOGGER CORRIGIDO PARA BAILEYS
const createCompatibleLogger = () => {
  const logger = {
    fatal: (msg) => console.error('[FATAL]', msg),
    error: (msg) => console.error('[ERROR]', msg),
    warn: (msg) => console.warn('[WARN]', msg),
    info: (msg) => console.log('[INFO]', msg),
    debug: (msg) => console.log('[DEBUG]', msg),
    trace: (msg) => console.log('[TRACE]', msg),
    child: () => logger
  };
  return logger;
};

module.exports = { createCompatibleLogger };
`;
};

// 2. PATCH PARA CONNECTION MANAGER
const createConnectionPatch = () => {
  return `
// 🔧 PATCH PARA CORRIGIR LOOPS DE CONEXÃO
const fs = require('fs');

// Ler arquivo atual
const connectionManagerPath = '/root/whatsapp-server/src/utils/connection-manager.js';
const content = fs.readFileSync(connectionManagerPath, 'utf8');

// Aplicar correções
let fixedContent = content;

// CORREÇÃO 1: Adicionar logger compatível no início
if (!fixedContent.includes('createCompatibleLogger')) {
  const loggerImport = \`
// 🔧 LOGGER COMPATÍVEL PARA BAILEYS
const createCompatibleLogger = () => {
  const logger = {
    fatal: (msg) => console.error('[FATAL]', msg),
    error: (msg) => console.error('[ERROR]', msg),  
    warn: (msg) => console.warn('[WARN]', msg),
    info: (msg) => console.log('[INFO]', msg),
    debug: (msg) => console.log('[DEBUG]', msg),
    trace: (msg) => console.log('[TRACE]', msg),
    child: () => logger
  };
  return logger;
};

\`;
  fixedContent = loggerImport + fixedContent;
}

// CORREÇÃO 2: Usar logger compatível em makeWASocket
fixedContent = fixedContent.replace(
  /makeWASocket\\({[^}]*}/g,
  \`makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.appropriate('Desktop'),
    defaultQueryTimeoutMs: 60_000,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    retryRequestDelayMs: 1000,
    maxMsgRetryCount: 3,
    logger: createCompatibleLogger(), // 🔧 LOGGER COMPATÍVEL
    shouldIgnoreJid: (jid) => {
      return jid.includes('@g.us') || 
             jid.includes('@broadcast') || 
             jid.includes('@newsletter') ||
             jid.includes('@lid');
    }\`
);

// CORREÇÃO 3: Timeout para conexões travadas
fixedContent = fixedContent.replace(
  /instance\\.status = 'connecting';/g,
  \`instance.status = 'connecting';
  instance.connectionStartTime = Date.now();
  
  // 🔧 TIMEOUT PARA CONEXÕES TRAVADAS (2 minutos)
  setTimeout(() => {
    if (instance.status === 'connecting' && 
        Date.now() - instance.connectionStartTime > 120000) {
      console.log(\\\`[\\\${instanceId}] ⚠️ Conexão travada, reiniciando...\\\`);
      instance.status = 'error';
      instance.error = 'Timeout na conexão';
      if (socket) {
        socket.end();
        socket.removeAllListeners();
      }
    }
  }, 125000);\`
);

// Salvar arquivo corrigido
fs.writeFileSync(connectionManagerPath + '.fixed', fixedContent);
console.log('✅ Arquivo corrigido salvo como connection-manager.js.fixed');
`;
};

// 3. SCRIPT PRINCIPAL
const mainScript = `
console.log('🔧 Aplicando correções...');

${createConnectionPatch()}

// 4. SCRIPT PARA REINICIAR INSTÂNCIAS TRAVADAS
const axios = require('axios');

async function restartStuckInstances() {
  try {
    console.log('🔄 Verificando instâncias travadas...');
    
    const response = await axios.get('http://localhost:3001/status');
    const instances = response.data.instances;
    
    const stuckInstances = instances.filter(inst => 
      inst.status === 'connecting' && 
      Date.now() - new Date(inst.lastUpdate).getTime() > 120000 // 2 minutos
    );
    
    console.log(\`🚨 Encontradas \${stuckInstances.length} instâncias travadas\`);
    
    for (const instance of stuckInstances) {
      console.log(\`🔄 Reiniciando \${instance.instanceId}...\`);
      
      try {
        // Deletar instância travada
        await axios.delete(\`http://localhost:3001/instance/\${instance.instanceId}\`);
        
        // Aguardar 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recriar instância
        await axios.post('http://localhost:3001/instance/create', {
          instanceId: instance.instanceId,
          createdByUserId: instance.createdByUserId
        });
        
        console.log(\`✅ \${instance.instanceId} reiniciada\`);
        
      } catch (error) {
        console.error(\`❌ Erro ao reiniciar \${instance.instanceId}:\`, error.message);
      }
      
      // Delay entre reinicializações
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar instâncias:', error.message);
  }
}

// Executar correção
setTimeout(restartStuckInstances, 5000);
`;

// Escrever arquivo
fs.writeFileSync('fix-logger-loops.js', mainScript);
console.log('✅ Script de correção criado: fix-logger-loops.js');
console.log('📋 Para usar na VPS:');
console.log('   1. cd /root/whatsapp-server');
console.log('   2. node fix-logger-loops.js'); 