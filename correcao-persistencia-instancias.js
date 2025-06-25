#!/usr/bin/env node

// CORREÇÃO URGENTE - PERSISTÊNCIA DE INSTÂNCIAS E FILTRO DE CONTATOS
console.log('🔧 CORREÇÃO PERSISTÊNCIA + FILTROS');
console.log('==================================');

const fs = require('fs');
const path = require('path');

// 1. Backup
const backupFile = `server.js.backup-persistencia-${Date.now()}`;
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
      instancesToSave[id] = {
        instanceId: instance.instanceId,
        status: instance.status,
        connected: instance.connected,
        phone: instance.phone,
        profileName: instance.profileName,
        lastUpdate: instance.lastUpdate,
        createdByUserId: instance.createdByUserId
        // NÃO salvar socket (não serializável)
      };
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

// 5. Corrigir filtro de contatos - MAIS PERMISSIVO
const contactFilterRegex = /if \(contactId && contactId\.includes\('@c\.us'\) && !contactId\.includes\('@g\.us'\)/;
if (contactFilterRegex.test(serverContent)) {
  serverContent = serverContent.replace(contactFilterRegex,
    `if (contactId && (contactId.includes('@c.us') || contactId.includes('@s.whatsapp.net')) && !contactId.includes('@g.us')`);
  console.log('✅ Filtro de contatos expandido para incluir @s.whatsapp.net');
}

// 6. Melhorar importação de contatos - CAPTURAR MAIS FONTES
const contactImportRegex = /console\.log\(\`\[Import History\] 👥 Obtendo contatos reais para \$\{instanceId\}\.\.\.`\);/;
if (contactImportRegex.test(serverContent)) {
  const improvedContactImport = `
        console.log(\`[Import History] 👥 Obtendo contatos reais para \${instanceId}...\`);
        
        // FONTE 1: Store contacts
        const storeContacts = socketStore.contacts || {};
        console.log(\`[Import History] 📊 Store contacts: \${Object.keys(storeContacts).length}\`);
        
        // FONTE 2: Chats participants  
        const chatsFromStore = socketStore.chats || {};
        console.log(\`[Import History] 💬 Chats disponíveis: \${Object.keys(chatsFromStore).length}\`);
        
        // FONTE 3: Messages senders
        const messagesStore = socketStore.messages || {};
        console.log(\`[Import History] 📨 Messages store: \${Object.keys(messagesStore).length}\`);
        
        let contactCount = 0;
        const processedContacts = new Set();
        
        // Processar contatos do store
        Object.keys(storeContacts).forEach(contactId => {
          if (contactCount >= batchSize) return;
          if (contactId && (contactId.includes('@c.us') || contactId.includes('@s.whatsapp.net')) && !contactId.includes('@g.us')) {
            if (!processedContacts.has(contactId)) {
              const contact = storeContacts[contactId];
              const phone = contactId.split('@')[0];
              const name = contact?.name || contact?.notify || contact?.verifiedName || \`Lead-\${phone.substring(phone.length - 4)}\`;
              
              contacts.push({
                from: contactId,
                name: name,
                phone: phone,
                profileName: contact?.verifiedName || name,
                instanceId: instanceId,
                source: 'store_contacts'
              });
              
              processedContacts.add(contactId);
              contactCount++;
            }
          }
        });
        
        // Processar participantes dos chats
        Object.values(chatsFromStore).forEach(chat => {
          if (contactCount >= batchSize) return;
          if (chat.id && (chat.id.includes('@c.us') || chat.id.includes('@s.whatsapp.net')) && !chat.id.includes('@g.us')) {
            if (!processedContacts.has(chat.id)) {
              const phone = chat.id.split('@')[0];
              const name = chat.name || \`Lead-\${phone.substring(phone.length - 4)}\`;
              
              contacts.push({
                from: chat.id,
                name: name,
                phone: phone,
                profileName: chat.name || name,
                instanceId: instanceId,
                source: 'chat_participants'
              });
              
              processedContacts.add(chat.id);
              contactCount++;
            }
          }
        });
        
        console.log(\`[Import History] ✅ \${contacts.length} contatos únicos processados de múltiplas fontes\`);`;
  
  serverContent = serverContent.replace(contactImportRegex, improvedContactImport);
  console.log('✅ Importação de contatos melhorada com múltiplas fontes');
}

// 7. Adicionar reconexão automática de instâncias salvas
const serverStartRegex = /console\.log\(\`🚀 Servidor WhatsApp rodando na porta \$\{PORT\}\`\);/;
if (serverStartRegex.test(serverContent)) {
  const reconnectionCode = `
  console.log(\`🚀 Servidor WhatsApp rodando na porta \${PORT}\`);
  
  // RECONECTAR INSTÂNCIAS SALVAS
  setTimeout(() => {
    const savedInstances = Object.keys(instances);
    if (savedInstances.length > 0) {
      console.log(\`🔄 Reconectando \${savedInstances.length} instâncias salvas...\`);
      savedInstances.forEach(instanceId => {
        console.log(\`🔌 Reconectando instância: \${instanceId}\`);
        createWhatsAppInstance(instanceId, instances[instanceId].createdByUserId);
      });
    }
  }, 5000);`;
  
  serverContent = serverContent.replace(serverStartRegex, reconnectionCode);
  console.log('✅ Sistema de reconexão automática adicionado');
}

// 8. Corrigir enum message_status no webhook
const webhookRegex = /timestamp: messageData\.timestamp \? new Date\(messageData\.timestamp \* 1000\)\.toISOString\(\) : new Date\(\)\.toISOString\(\),/;
if (webhookRegex.test(serverContent)) {
  serverContent = serverContent.replace(webhookRegex,
    `timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString(),
    messageStatus: 'delivered', // Fix enum error
    messageDirection: messageData.fromMe ? 'outgoing' : 'incoming',`);
  console.log('✅ Correção do enum message_status aplicada');
}

// 9. Salvar arquivo
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo atualizado');

// 10. Verificar sintaxe
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
    console.log('2. Aguarde 10s para reconexão automática');
    console.log('3. curl http://localhost:3002/instances');
    console.log('4. Teste importação novamente');
  }
}); 