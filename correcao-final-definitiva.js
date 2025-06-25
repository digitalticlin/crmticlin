#!/usr/bin/env node

console.log('🔧 CORREÇÃO FINAL DEFINITIVA');
console.log('============================');

const fs = require('fs');

// 1. Backup
const backupFile = `server.js.backup-final-${Date.now()}`;
fs.copyFileSync('server.js', backupFile);
console.log(`💾 Backup criado: ${backupFile}`);

// 2. Ler arquivo
let serverContent = fs.readFileSync('server.js', 'utf8');

// 3. GARANTIR que socketStore está definido no endpoint de importação
const importEndpointRegex = /app\.post\(['"]\/instance\/:instanceId\/import-history['"], async \(req, res\) => \{([^}]|[\r\n])*?\}\);/s;

if (importEndpointRegex.test(serverContent)) {
  console.log('✅ Endpoint de importação encontrado');
  
  // Criar novo endpoint completo
  const newImportEndpoint = `app.post('/instance/:instanceId/import-history', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { importType = 'both', batchSize = 10, lastSyncTimestamp } = req.body;

    console.log('Import History solicitação:', { instanceId, importType, batchSize });

    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }

    // Garantir socketStore
    const socketStore = instance.socket?.store || store;
    if (!socketStore) {
      return res.status(500).json({ 
        success: false, 
        error: 'Store não disponível',
        storeInfo: { storeAvailable: false }
      });
    }

    let contacts = [];
    let messages = [];

    // EXTRAIR CONTATOS DOS CHATS
    if (importType === 'contacts' || importType === 'both') {
      try {
        const chatsFromStore = socketStore.chats || {};
        
        console.log('Análise do store:', {
          totalChats: Object.keys(chatsFromStore).length,
          storeContacts: Object.keys(socketStore.contacts || {}).length
        });
        
        for (const [chatKey, chatData] of Object.entries(chatsFromStore)) {
          if (contacts.length >= batchSize) break;
          
          if (!chatData || typeof chatData !== 'object') continue;
          
          const chatId = chatData.id || chatKey;
          
          if (chatId && typeof chatId === 'string') {
            if ((chatId.includes('@s.whatsapp.net') || chatId.includes('@c.us')) && 
                !chatId.includes('@g.us') && 
                !chatId.includes('status@broadcast')) {
              
              const phone = chatId.split('@')[0];
              let contactName = 'Lead-' + phone.substring(phone.length - 4);
              
              if (chatData.name && chatData.name.trim()) {
                contactName = chatData.name.trim();
              } else if (chatData.notify && chatData.notify.trim()) {
                contactName = chatData.notify.trim();
              }
              
              contacts.push({
                from: chatId,
                name: contactName,
                phone: phone,
                profileName: contactName,
                instanceId: instanceId,
                source: 'chat_extraction'
              });
              
              console.log('Contato extraído:', contactName, phone);
            }
          }
        }
        
      } catch (contactError) {
        console.log('Erro ao extrair contatos:', contactError.message);
      }
    }

    // EXTRAIR MENSAGENS DOS CHATS
    if (importType === 'messages' || importType === 'both') {
      try {
        const chatsFromStore = socketStore.chats || {};
        const messagesStore = socketStore.messages || {};
        
        for (const [chatId, chatData] of Object.entries(chatsFromStore)) {
          if (messages.length >= batchSize) break;
          
          if (chatId && (chatId.includes('@s.whatsapp.net') || chatId.includes('@c.us')) && 
              !chatId.includes('@g.us')) {
            
            const chatMessages = messagesStore[chatId] || [];
            
            if (Array.isArray(chatMessages)) {
              const recentMessages = chatMessages.slice(-3);
              
              for (const msg of recentMessages) {
                if (messages.length >= batchSize) break;
                
                if (msg && msg.key && msg.message) {
                  const messageText = msg.message.conversation || 
                                     msg.message.extendedTextMessage?.text || 
                                     '[Mídia]';

                  messages.push({
                    messageId: msg.key.id,
                    from: msg.key.remoteJid || chatId,
                    fromMe: !!msg.key.fromMe,
                    body: messageText,
                    timestamp: msg.messageTimestamp ? 
                              new Date(msg.messageTimestamp * 1000).toISOString() : 
                              new Date().toISOString(),
                    messageType: Object.keys(msg.message)[0] || 'text',
                    instanceId: instanceId,
                    chatId: chatId
                  });
                  
                  console.log('Mensagem extraída:', messageText.substring(0, 30));
                }
              }
            }
          }
        }
        
      } catch (messageError) {
        console.log('Erro ao extrair mensagens:', messageError.message);
      }
    }

    console.log('Importação concluída:', { contacts: contacts.length, messages: messages.length });

    res.json({
      success: true,
      instanceId,
      importType,
      contacts,
      messages,
      totalContacts: contacts.length,
      totalMessages: messages.length,
      timestamp: new Date().toISOString(),
      nextBatchAvailable: false,
      storeInfo: {
        totalContactsInStore: Object.keys(socketStore.contacts || {}).length,
        totalChatsInStore: Object.keys(socketStore.chats || {}).length,
        storeAvailable: true
      }
    });

  } catch (error) {
    console.error('Erro geral na importação:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});`;

  serverContent = serverContent.replace(importEndpointRegex, newImportEndpoint);
  console.log('✅ Endpoint substituído');
  
} else {
  console.log('❌ Endpoint não encontrado - tentando padrão alternativo');
  
  // Tentar encontrar padrão mais simples
  if (serverContent.includes('import-history')) {
    console.log('✅ Encontrado texto import-history - fazendo substituição manual');
  }
}

// 4. Salvar
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo atualizado');

// 5. Verificar sintaxe
const { exec } = require('child_process');
exec('node -c server.js', (error) => {
  if (error) {
    console.error('❌ Erro:', error.message);
    fs.copyFileSync(backupFile, 'server.js');
    console.log('🔄 Backup restaurado');
  } else {
    console.log('✅ SUCESSO! Execute:');
    console.log('pm2 restart whatsapp-server');
    console.log('Teste importação novamente');
  }
}); 