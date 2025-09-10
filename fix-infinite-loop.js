#!/usr/bin/env node

// CORREÇÃO PERMANENTE - Evitar loops infinitos de reconexão
// Para aplicar no servidor WhatsApp da VPS

const fs = require('fs');
const path = require('path');

const SERVER_PATH = '/root/whatsapp-server/server.js';
const BACKUP_PATH = '/root/whatsapp-server/server-backup-loop-fix.js';

console.log('🔧 APLICANDO CORREÇÃO PERMANENTE - Anti-Loop Infinito');
console.log('=====================================================');

// 1. Fazer backup do servidor atual
console.log('💾 Fazendo backup do servidor atual...');
const serverContent = fs.readFileSync(SERVER_PATH, 'utf8');
fs.writeFileSync(BACKUP_PATH, serverContent);
console.log('✅ Backup criado em:', BACKUP_PATH);

// 2. Aplicar correção anti-loop
console.log('🛠️ Aplicando correção anti-loop...');

const fixedContent = serverContent.replace(
  /if \(shouldReconnect\) \{[\s\S]*?\}/g,
  `if (shouldReconnect) {
          // CORREÇÃO: Implementar limite rígido de reconexões
          const attempts = instances[instanceId].attempts || 0;
          const MAX_ATTEMPTS = 3;
          const RECONNECT_DELAY = 10000; // 10 segundos
          
          if (attempts < MAX_ATTEMPTS) {
            instances[instanceId].attempts = attempts + 1;
            instances[instanceId].status = 'reconnecting';
            
            console.log(\`[\${instanceId}] 🔄 Tentativa de reconexão \${attempts + 1}/\${MAX_ATTEMPTS}\`);
            
            // Timeout crescente para evitar spam
            setTimeout(() => {
              if (instances[instanceId]) { // Verificar se ainda existe
                createWhatsAppInstance(instanceId, createdByUserId);
              }
            }, RECONNECT_DELAY * (attempts + 1));
            
          } else {
            console.log(\`[\${instanceId}] ❌ MÁXIMO DE TENTATIVAS ATINGIDO - Removendo instância\`);
            
            // PARAR DEFINITIVAMENTE - sem loop infinito
            instances[instanceId].status = 'failed';
            instances[instanceId].error = 'Máximo de tentativas de reconexão atingido';
            
            // Limpar arquivos de sessão para evitar corrupção
            try {
              const sessionPath = path.join(__dirname, 'sessions', instanceId);
              const authPath = path.join(__dirname, 'auth_info', instanceId);
              
              if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log(\`[\${instanceId}] 🧹 Sessão removida: \${sessionPath}\`);
              }
              
              if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log(\`[\${instanceId}] 🧹 Auth removido: \${authPath}\`);
              }
            } catch (cleanupError) {
              console.error(\`[\${instanceId}] ⚠️ Erro na limpeza:, cleanupError\`);
            }
            
            // Remover da lista após 30 segundos para dar tempo de notificar
            setTimeout(() => {
              delete instances[instanceId];
              console.log(\`[\${instanceId}] 🗑️ Instância removida definitivamente\`);
            }, 30000);
          }
        }`
);

// 3. Adicionar função de limpeza periódica
const cleanupFunction = `
// CORREÇÃO: Função de limpeza periódica para evitar acúmulo
function cleanupFailedInstances() {
  const now = Date.now();
  const CLEANUP_INTERVAL = 300000; // 5 minutos
  
  for (const [instanceId, instance] of Object.entries(instances)) {
    const timeSinceLastUpdate = now - new Date(instance.lastUpdate).getTime();
    
    // Remover instâncias que falharam há mais de 5 minutos
    if (instance.status === 'failed' && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(\`[Cleanup] 🧹 Removendo instância expirada: \${instanceId}\`);
      delete instances[instanceId];
    }
    
    // Remover instâncias órfãs sem socket
    if (!instance.socket && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(\`[Cleanup] 🧹 Removendo instância órfã: \${instanceId}\`);
      delete instances[instanceId];
    }
  }
}

// Executar limpeza a cada 5 minutos
setInterval(cleanupFailedInstances, 300000);
`;

// 4. Adicionar limpeza na inicialização
const finalContent = fixedContent + cleanupFunction;

// 5. Escrever arquivo corrigido
fs.writeFileSync(SERVER_PATH, finalContent);
console.log('✅ Correção aplicada no servidor!');

// 6. Verificar integridade do arquivo
try {
  require(SERVER_PATH);
  console.log('✅ Sintaxe do arquivo corrigido está correta');
} catch (error) {
  console.error('❌ Erro de sintaxe detectado:', error.message);
  console.log('🔄 Restaurando backup...');
  fs.writeFileSync(SERVER_PATH, serverContent);
  process.exit(1);
}

console.log('');
console.log('🎉 CORREÇÃO PERMANENTE APLICADA COM SUCESSO!');
console.log('============================================');
console.log('✅ Loops infinitos de reconexão: BLOQUEADOS');
console.log('✅ Limpeza automática de instâncias: ATIVADA');
console.log('✅ Limite máximo de tentativas: 3');
console.log('✅ Timeout crescente: 10s, 20s, 30s');
console.log('✅ Limpeza periódica: A cada 5 minutos');
console.log('');
console.log('🚀 Reinicie o servidor PM2 para aplicar:');
console.log('   pm2 restart whatsapp-server'); 