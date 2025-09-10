// 🔧 CORREÇÃO SIMPLES PARA LOGGER DO BAILEYS
// Este script aplica uma correção direta no connection-manager.js

const fs = require('fs');

console.log('🔧 === APLICANDO CORREÇÃO DE LOGGER ===');

try {
  const filePath = '/root/whatsapp-server/src/utils/connection-manager.js';
  
  // Ler arquivo atual
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('📂 Arquivo lido com sucesso');
  
  // CORREÇÃO: Adicionar logger compatível antes do makeWASocket
  const loggerCode = `
// 🔧 LOGGER COMPATÍVEL PARA BAILEYS (correção aplicada)
const createBaileysLogger = () => {
  return {
    fatal: (msg) => console.error('[FATAL]', msg),
    error: (msg) => console.error('[ERROR]', msg),
    warn: (msg) => console.warn('[WARN]', msg),
    info: (msg) => console.log('[INFO]', msg),
    debug: (msg) => console.log('[DEBUG]', msg),
    trace: (msg) => console.log('[TRACE]', msg),
    child: () => createBaileysLogger()
  };
};

`;

  // Adicionar logger no início do arquivo se não existir
  if (!content.includes('createBaileysLogger')) {
    content = loggerCode + content;
    console.log('✅ Logger compatível adicionado');
  }
  
  // Encontrar e corrigir makeWASocket
  const makeWASocketRegex = /makeWASocket\s*\(\s*{([^}]+)}/g;
  
  if (makeWASocketRegex.test(content)) {
    content = content.replace(makeWASocketRegex, `makeWASocket({
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
    logger: createBaileysLogger(), // 🔧 LOGGER CORRIGIDO
    shouldIgnoreJid: (jid) => {
      return jid.includes('@g.us') || 
             jid.includes('@broadcast') || 
             jid.includes('@newsletter') ||
             jid.includes('@lid');
    }`);
    
    console.log('✅ makeWASocket corrigido com logger');
  }
  
  // Fazer backup do arquivo original
  fs.writeFileSync(filePath + '.backup-before-logger-fix', fs.readFileSync(filePath));
  console.log('📦 Backup criado: connection-manager.js.backup-before-logger-fix');
  
  // Salvar arquivo corrigido
  fs.writeFileSync(filePath, content);
  console.log('✅ Arquivo corrigido salvo');
  
  console.log('🎉 CORREÇÃO APLICADA COM SUCESSO!');
  console.log('📋 Próximos passos:');
  console.log('   1. pm2 restart whatsapp-server');
  console.log('   2. pm2 logs whatsapp-server --lines 20');
  
} catch (error) {
  console.error('❌ Erro ao aplicar correção:', error.message);
  process.exit(1);
} 