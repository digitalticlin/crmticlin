#!/usr/bin/env node

// FIX URGENTE - SOCKETSTORE UNDEFINED
console.log('🔧 FIX SOCKETSTORE UNDEFINED');
console.log('============================');

const fs = require('fs');

// 1. Backup
const backupFile = `server.js.backup-socketstore-${Date.now()}`;
fs.copyFileSync('server.js', backupFile);
console.log(`💾 Backup criado: ${backupFile}`);

// 2. Ler arquivo
let serverContent = fs.readFileSync('server.js', 'utf8');

// 3. Encontrar e corrigir a definição de socketStore no endpoint import-history
const importHistoryRegex = /\/\/ USAR STORE GLOBAL OU SOCKET STORE\s*const socketStore = socket\.store \|\| store;/;

if (importHistoryRegex.test(serverContent)) {
  console.log('✅ Definição socketStore encontrada - já corrigida');
} else {
  // Procurar por outras variações da definição
  const storeUsageRegex = /const storeContacts = socketStore\.contacts \|\| \{\};/;
  
  if (storeUsageRegex.test(serverContent)) {
    // Inserir definição antes do primeiro uso
    serverContent = serverContent.replace(storeUsageRegex, 
      `// DEFINIR SOCKETSTORE CORRETAMENTE
        const socketStore = socket.store || store;
        console.log(\`[Import History] 🗃️ Store disponível: \${!!socketStore}, Contatos: \${Object.keys(socketStore.contacts || {}).length}, Chats: \${Object.keys(socketStore.chats || {}).length}\`);
        
        const storeContacts = socketStore.contacts || {};`);
    console.log('✅ Definição socketStore adicionada antes do uso');
  } else {
    // Se não encontrou, vamos procurar o início do endpoint
    const endpointStartRegex = /(app\.post\('\/instance\/:instanceId\/import-history'[\s\S]*?const instance = instances\[instanceId\];[\s\S]*?const socket = instance\.socket;)/;
    
    if (endpointStartRegex.test(serverContent)) {
      serverContent = serverContent.replace(endpointStartRegex, 
        `$1
        
        // DEFINIR SOCKETSTORE CORRETAMENTE
        const socketStore = socket.store || store;
        console.log(\`[Import History] 🗃️ Store status: disponível=\${!!socketStore}, socket.store=\${!!socket.store}, global.store=\${!!store}\`);`);
      console.log('✅ Definição socketStore adicionada no início do endpoint');
    }
  }
}

// 4. Verificar se há outras referências não definidas
const undefinedReferences = [
  /const chatsFromStore = socketStore\.chats/,
  /const messagesStore = socketStore\.messages/
];

undefinedReferences.forEach((regex, index) => {
  if (regex.test(serverContent)) {
    console.log(`✅ Referência ${index + 1} ao socketStore encontrada - OK`);
  }
});

// 5. Adicionar verificação de segurança
const safetyCheck = `
        // VERIFICAÇÃO DE SEGURANÇA DO SOCKETSTORE
        if (!socketStore) {
          console.error('[Import History] ❌ socketStore não definido - usando store global');
          const socketStore = store;
        }
        
        if (!socketStore.contacts) {
          console.log('[Import History] ⚠️ socketStore.contacts não existe, inicializando vazio');
          socketStore.contacts = {};
        }
        
        if (!socketStore.chats) {
          console.log('[Import History] ⚠️ socketStore.chats não existe, inicializando vazio');
          socketStore.chats = {};
        }`;

// Inserir verificação após a definição do socketStore
const afterSocketStoreRegex = /console\.log\(\`\[Import History\] 🗃️ Store (status|disponível):/;
if (afterSocketStoreRegex.test(serverContent)) {
  serverContent = serverContent.replace(afterSocketStoreRegex, 
    `${safetyCheck}
        
        console.log(\`[Import History] 🗃️ Store status:`);
  console.log('✅ Verificação de segurança adicionada');
}

// 6. Salvar arquivo
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo atualizado');

// 7. Verificar sintaxe
const { exec } = require('child_process');
exec('node -c server.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro de sintaxe:', error.message);
    fs.copyFileSync(backupFile, 'server.js');
    console.log('🔄 Backup restaurado');
  } else {
    console.log('✅ Fix aplicado com sucesso!');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. pm2 restart whatsapp-server');
    console.log('2. Aguarde 5s');
    console.log('3. Teste importação novamente');
    console.log('4. Deve mostrar os 2 chats encontrados: 556296662287 e 556291572114');
  }
}); 