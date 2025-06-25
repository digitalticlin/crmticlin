#!/usr/bin/env node

// CORREÇÃO CIRÚRGICA - STORE BAILEYS
// Este script adiciona o sistema de store do Baileys ao servidor atual
// sem afetar outras funcionalidades

const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO ISOLADA - STORE BAILEYS');
console.log('===================================');

// 1. Backup do arquivo atual
const backupFile = `server.js.backup-store-${Date.now()}`;
fs.copyFileSync('server.js', backupFile);
console.log(`💾 Backup criado: ${backupFile}`);

// 2. Ler arquivo atual
let serverContent = fs.readFileSync('server.js', 'utf8');

// 3. Adicionar imports do store (se não existir)
if (!serverContent.includes('makeInMemoryStore')) {
  const baileyImport = serverContent.match(/const\s*{\s*[^}]*default:\s*makeWASocket[^}]*}\s*=\s*require\([^)]+\);/);
  
  if (baileyImport) {
    const newImport = baileyImport[0].replace(
      /default:\s*makeWASocket([^}]*)/,
      'default: makeWASocket, makeInMemoryStore$1'
    );
    serverContent = serverContent.replace(baileyImport[0], newImport);
    console.log('✅ Import do makeInMemoryStore adicionado');
  }
}

// 4. Adicionar inicialização do store após as constantes
const storeInitCode = `
// STORE BAILEYS PARA PERSISTÊNCIA DE DADOS
const store = makeInMemoryStore({
  logger: console
});

// Configurar persistência do store
const STORE_FILE = path.join(__dirname, 'store.json');

// Carregar store existente
if (fs.existsSync(STORE_FILE)) {
  try {
    const storeData = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    store.fromJSON(storeData);
    console.log('📁 Store carregado do arquivo');
  } catch (error) {
    console.log('⚠️ Erro ao carregar store, criando novo');
  }
}

// Salvar store a cada 30 segundos
setInterval(() => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store.toJSON(), null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar store:', error.message);
  }
}, 30000);

console.log('🗃️ Store Baileys inicializado com persistência');
`;

// Inserir após as constantes globais
const constantsRegex = /const instances = {};/;
if (constantsRegex.test(serverContent)) {
  serverContent = serverContent.replace(constantsRegex, `const instances = {};\n${storeInitCode}`);
  console.log('✅ Inicialização do store adicionada');
}

// 5. Modificar função createWhatsAppInstance para usar store
const socketCreationRegex = /const socket = makeWASocket\(\{([^}]+)\}\);/s;
if (socketCreationRegex.test(serverContent)) {
  serverContent = serverContent.replace(
    socketCreationRegex,
    `const socket = makeWASocket({$1});

    // CONECTAR SOCKET AO STORE
    store.bind(socket.ev);
    
    // Definir store no socket para acesso posterior
    socket.store = store;`
  );
  console.log('✅ Store conectado ao socket');
}

// 6. Adicionar sincronização de histórico na conexão
const connectionUpdateRegex = /if \(connection === 'open'\) \{([^}]+)}/s;
if (connectionUpdateRegex.test(serverContent)) {
  const match = serverContent.match(connectionUpdateRegex);
  const newConnectionCode = match[0].replace(
    /await notifyConnectionEstablished\([^)]+\);/,
    `await notifyConnectionEstablished(instanceId, phoneNumber, profileName);
        
        // SINCRONIZAR HISTÓRICO APÓS CONEXÃO
        console.log(\`[Store] 📚 Sincronizando histórico para \${instanceId}...\`);
        try {
          // Forçar sync de contatos
          await socket.requestPairingCode?.('');
          
          // Aguardar estabilização
          setTimeout(async () => {
            const contacts = store.contacts || {};
            const chats = store.chats || {};
            console.log(\`[Store] ✅ Histórico sincronizado: \${Object.keys(contacts).length} contatos, \${Object.keys(chats).length} chats\`);
          }, 5000);
        } catch (syncError) {
          console.error(\`[Store] ⚠️ Erro na sincronização:\`, syncError.message);
        }`
  );
  
  serverContent = serverContent.replace(connectionUpdateRegex, newConnectionCode);
  console.log('✅ Sincronização de histórico adicionada');
}

// 7. Modificar endpoint de importação para usar store corretamente
const importHistoryRegex = /const store = socket\.store \|\| \{\};/;
if (importHistoryRegex.test(serverContent)) {
  serverContent = serverContent.replace(
    importHistoryRegex,
    `// USAR STORE GLOBAL OU SOCKET STORE
    const socketStore = socket.store || store;
    console.log(\`[Import History] 🗃️ Store disponível: \${!!socketStore}, Contatos: \${Object.keys(socketStore.contacts || {}).length}, Chats: \${Object.keys(socketStore.chats || {}).length}\`);`
  );
  
  // Corrigir referências ao store
  serverContent = serverContent.replace(
    /const contactsFromStore = store\.contacts \|\| \{\};/g,
    'const contactsFromStore = socketStore.contacts || {};'
  );
  
  serverContent = serverContent.replace(
    /const chatsFromStore = store\.chats \|\| \{\};/g,
    'const chatsFromStore = socketStore.chats || {};'
  );
  
  serverContent = serverContent.replace(
    /const chatMessages = store\.messages\?\.\[chat\.id\] \|\| \[\];/g,
    'const chatMessages = socketStore.messages?.[chat.id] || [];'
  );
  
  console.log('✅ Referências do store corrigidas no endpoint de importação');
}

// 8. Adicionar endpoint de debug do store
const debugEndpoint = `
// ENDPOINT DEBUG - VERIFICAR STORE
app.get('/debug/store/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = instances[instanceId];
    
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    const socketStore = instance.socket?.store || store;
    
    res.json({
      success: true,
      instanceId,
      storeInfo: {
        storeAvailable: !!socketStore,
        totalContacts: Object.keys(socketStore.contacts || {}).length,
        totalChats: Object.keys(socketStore.chats || {}).length,
        totalMessages: Object.keys(socketStore.messages || {}).length,
        contactSample: Object.keys(socketStore.contacts || {}).slice(0, 3),
        chatSample: Object.keys(socketStore.chats || {}).slice(0, 3)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar store', message: error.message });
  }
});

`;

// Inserir antes do último endpoint
const lastEndpointRegex = /app\.delete\('\/instance\/:instanceId'/;
if (lastEndpointRegex.test(serverContent)) {
  serverContent = serverContent.replace(lastEndpointRegex, debugEndpoint + 'app.delete(\'/instance/:instanceId\'');
  console.log('✅ Endpoint de debug adicionado');
}

// 9. Salvar arquivo corrigido
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo server.js atualizado');

// 10. Verificar sintaxe
const { exec } = require('child_process');
exec('node -c server.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro de sintaxe:', error.message);
    console.log('🔄 Restaurando backup...');
    fs.copyFileSync(backupFile, 'server.js');
  } else {
    console.log('✅ Sintaxe OK - Correção aplicada com sucesso!');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. pm2 restart whatsapp-server');
    console.log('2. Aguarde 30s para sincronização');
    console.log('3. Teste: curl http://localhost:3002/debug/store/contatoluizantoniooliveira');
    console.log('4. Importe histórico novamente');
  }
}); 