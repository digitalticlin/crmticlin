#!/usr/bin/env node

// CORREÇÃO PERSISTÊNCIA - FIX DE SINTAXE
console.log('🔧 CORREÇÃO PERSISTÊNCIA - FIX SINTAXE');
console.log('=====================================');

const fs = require('fs');
const path = require('path');

// 1. Backup
const backupFile = `server.js.backup-fix-${Date.now()}`;
fs.copyFileSync('server.js', backupFile);
console.log(`💾 Backup criado: ${backupFile}`);

// 2. Ler arquivo
let serverContent = fs.readFileSync('server.js', 'utf8');

// 3. Adicionar persistência de instâncias
const persistenceCode = `
// PERSISTÊNCIA DE INSTÂNCIAS
const INSTANCES_FILE = path.join(__dirname, 'instances.json');

// Carregar instâncias salvas
function loadInstances() {
  try {
    if (fs.existsSync(INSTANCES_FILE)) {
      const savedInstances = JSON.parse(fs.readFileSync(INSTANCES_FILE, 'utf8'));
      console.log(\`📁 \${Object.keys(savedInstances).length} instâncias carregadas do arquivo\`);
      return savedInstances;
    }
  } catch (error) {
    console.log('⚠️ Erro ao carregar instâncias:', error.message);
  }
  return {};
}

// Salvar instâncias
function saveInstances() {
  try {
    const instancesToSave = {};
    Object.keys(instances).forEach(id => {
      const instance = instances[id];
      if (instance) {
        instancesToSave[id] = {
          instanceId: instance.instanceId,
          status: instance.status,
          connected: instance.connected,
          phone: instance.phone,
          profileName: instance.profileName,
          lastUpdate: instance.lastUpdate,
          createdByUserId: instance.createdByUserId
        };
      }
    });
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(instancesToSave, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar instâncias:', error.message);
  }
}

// Salvar instâncias a cada 10 segundos
setInterval(saveInstances, 10000);

console.log('💾 Sistema de persistência de instâncias ativado');
`;

// Inserir após inicialização do store
const storeInitRegex = /console\.log\('🗃️ Store Baileys inicializado com persistência'\);/;
if (storeInitRegex.test(serverContent)) {
  serverContent = serverContent.replace(storeInitRegex, 
    `console.log('🗃️ Store Baileys inicializado com persistência');\n${persistenceCode}`);
  console.log('✅ Sistema de persistência adicionado');
}

// 4. Modificar inicialização das instâncias
const instancesInitRegex = /const instances = \{\};/;
if (instancesInitRegex.test(serverContent)) {
  serverContent = serverContent.replace(instancesInitRegex, 
    `const instances = loadInstances();`);
  console.log('✅ Carregamento de instâncias modificado');
}

// 5. Melhorar importação de contatos - SUBSTITUIR BLOCO COMPLETO
const contactSectionStart = /console\.log\(\`\[Import History\] 👥 Obtendo contatos reais para \$\{instanceId\}\.\.\.\`\);/;
const contactSectionEnd = /console\.log\(\`\[Import History\] ✅ \$\{contacts\.length\} contatos reais obtidos\`\);/;

if (contactSectionStart.test(serverContent) && contactSectionEnd.test(serverContent)) {
  // Encontrar e substituir todo o bloco de importação de contatos
  const contactBlockRegex = /console\.log\(\`\[Import History\] 👥 Obtendo contatos reais para \$\{instanceId\}\.\.\.\`\);[\s\S]*?console\.log\(\`\[Import History\] ✅ \$\{contacts\.length\} contatos reais obtidos\`\);/;
  
  const newContactBlock = `console.log(\`[Import History] 👥 Obtendo contatos reais para \${instanceId}...\`);
        
        // MÚLTIPLAS FONTES DE CONTATOS
        const storeContacts = socketStore.contacts || {};
        const chatsFromStore = socketStore.chats || {};
        const messagesStore = socketStore.messages || {};
        
        console.log(\`[Import History] 📊 Fontes disponíveis:\`);
        console.log(\`   - Store contacts: \${Object.keys(storeContacts).length}\`);
        console.log(\`   - Chats: \${Object.keys(chatsFromStore).length}\`);
        console.log(\`   - Messages: \${Object.keys(messagesStore).length}\`);
        
        let importContactCount = 0;
        const processedContactIds = new Set();
        
        // FONTE 1: Store contacts
        for (const contactId of Object.keys(storeContacts)) {
          if (importContactCount >= batchSize) break;
          
          if (contactId && (contactId.includes('@c.us') || contactId.includes('@s.whatsapp.net')) && !contactId.includes('@g.us')) {
            if (!processedContactIds.has(contactId)) {
              const contact = storeContacts[contactId];
              const phone = contactId.split('@')[0];
              const contactName = contact?.name || contact?.notify || contact?.verifiedName || \`Lead-\${phone.substring(phone.length - 4)}\`;
              
              contacts.push({
                from: contactId,
                name: contactName,
                phone: phone,
                profileName: contact?.verifiedName || contactName,
                instanceId: instanceId,
                source: 'store_contacts'
              });
              
              processedContactIds.add(contactId);
              importContactCount++;
            }
          }
        }
        
        // FONTE 2: Chats participants
        for (const chat of Object.values(chatsFromStore)) {
          if (importContactCount >= batchSize) break;
          
          if (chat.id && (chat.id.includes('@c.us') || chat.id.includes('@s.whatsapp.net')) && !chat.id.includes('@g.us')) {
            if (!processedContactIds.has(chat.id)) {
              const phone = chat.id.split('@')[0];
              const chatName = chat.name || \`Lead-\${phone.substring(phone.length - 4)}\`;
              
              contacts.push({
                from: chat.id,
                name: chatName,
                phone: phone,
                profileName: chat.name || chatName,
                instanceId: instanceId,
                source: 'chat_participants'
              });
              
              processedContactIds.add(chat.id);
              importContactCount++;
            }
          }
        }
        
        console.log(\`[Import History] ✅ \${contacts.length} contatos únicos processados\`);`;
  
  serverContent = serverContent.replace(contactBlockRegex, newContactBlock);
  console.log('✅ Bloco de importação de contatos substituído');
}

// 6. Adicionar reconexão automática
const serverListenRegex = /const server = app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{/;
if (serverListenRegex.test(serverContent)) {
  // Encontrar o final da função listen
  const listenEndRegex = /\}\);\s*\/\/ Configurações de timeout do servidor/;
  if (listenEndRegex.test(serverContent)) {
    serverContent = serverContent.replace(listenEndRegex, `});

// RECONEXÃO AUTOMÁTICA DE INSTÂNCIAS
setTimeout(() => {
  const savedInstances = Object.keys(instances);
  if (savedInstances.length > 0) {
    console.log(\`🔄 Reconectando \${savedInstances.length} instâncias salvas...\`);
    savedInstances.forEach(instanceId => {
      console.log(\`🔌 Reconectando instância: \${instanceId}\`);
      createWhatsAppInstance(instanceId, instances[instanceId].createdByUserId);
    });
  } else {
    console.log('📝 Nenhuma instância salva para reconectar');
  }
}, 5000);

// Configurações de timeout do servidor`);
    console.log('✅ Reconexão automática adicionada');
  }
}

// 7. Corrigir enum message_status no webhook
const webhookDataRegex = /data: messageData\s*\}/;
if (webhookDataRegex.test(serverContent)) {
  serverContent = serverContent.replace(webhookDataRegex, 
    `messageStatus: 'delivered',
    messageDirection: messageData.fromMe ? 'outgoing' : 'incoming',
    data: messageData
  }`);
  console.log('✅ Correção do enum message_status aplicada');
}

// 8. Salvar arquivo
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo atualizado');

// 9. Verificar sintaxe
const { exec } = require('child_process');
exec('node -c server.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro de sintaxe:', error.message);
    fs.copyFileSync(backupFile, 'server.js');
    console.log('🔄 Backup restaurado');
  } else {
    console.log('✅ Correção aplicada com sucesso!');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. pm2 restart whatsapp-server');
    console.log('2. Aguarde 15s para reconexão automática');
    console.log('3. curl http://localhost:3002/instances');
    console.log('4. Se vazio, criar nova: curl -X POST http://localhost:3002/instance/create -H "Content-Type: application/json" -d \'{"instanceId": "contatoluizantoniooliveira", "createdByUserId": "user123"}\'');
    console.log('5. Aguarde 30s e teste importação');
  }
}); 