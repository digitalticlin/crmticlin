#!/usr/bin/env node

// CORREÇÃO COMPLETA - EXTRAÇÃO DE CONTATOS DOS CHATS
console.log('🔧 CORREÇÃO EXTRAÇÃO COMPLETA');
console.log('=============================');

const fs = require('fs');

// 1. Backup
const backupFile = `server.js.backup-extracao-${Date.now()}`;
fs.copyFileSync('server.js', backupFile);
console.log(`💾 Backup criado: ${backupFile}`);

// 2. Ler arquivo
let serverContent = fs.readFileSync('server.js', 'utf8');

// 3. Encontrar e substituir seção de contatos
const contactsStart = /\/\/ MÚLTIPLAS FONTES DE CONTATOS/;
const contactsEnd = /console\.log\(\`\[Import History\] ✅ \$\{contacts\.length\} contatos únicos processados\`\);/;

if (contactsStart.test(serverContent) && contactsEnd.test(serverContent)) {
  const beforeContacts = serverContent.split(/\/\/ MÚLTIPLAS FONTES DE CONTATOS/)[0];
  const afterContacts = serverContent.split(/console\.log\(\`\[Import History\] ✅ \$\{contacts\.length\} contatos únicos processados\`\);/)[1];
  
  const newContactsCode = `// EXTRAÇÃO COMPLETA DE CONTATOS DOS CHATS
        const storeContacts = socketStore.contacts || {};
        const chatsFromStore = socketStore.chats || {};
        const messagesStore = socketStore.messages || {};
        
        console.log(\`[Import History] 📊 Análise completa do store:\`);
        console.log(\`   - Store contacts: \${Object.keys(storeContacts).length}\`);
        console.log(\`   - Chats totais: \${Object.keys(chatsFromStore).length}\`);
        console.log(\`   - Messages: \${Object.keys(messagesStore).length}\`);
        
        let importContactCount = 0;
        const processedContactIds = new Set();
        
        // EXTRAIR CONTATOS DOS CHATS (onde realmente estão os dados)
        for (const [chatKey, chatData] of Object.entries(chatsFromStore)) {
          if (importContactCount >= batchSize) break;
          
          // Pular se não for objeto válido
          if (!chatData || typeof chatData !== 'object') continue;
          
          const chatId = chatData.id || chatKey;
          
          console.log(\`[Import History] 🔍 Analisando chat: \${chatKey} -> \${chatId}\`);
          
          if (chatId && typeof chatId === 'string') {
            // Filtrar apenas contatos individuais (não grupos nem status)
            if ((chatId.includes('@s.whatsapp.net') || chatId.includes('@c.us')) && 
                !chatId.includes('@g.us') && 
                !chatId.includes('status@broadcast') &&
                chatId !== 'key' && chatId !== 'idGetter' && chatId !== 'dict') {
              
              if (!processedContactIds.has(chatId)) {
                const phone = chatId.split('@')[0];
                
                // Extrair nome do contato
                let contactName = \`Lead-\${phone.substring(phone.length - 4)}\`;
                
                if (chatData.name && chatData.name.trim() !== '') {
                  contactName = chatData.name.trim();
                } else if (chatData.notify && chatData.notify.trim() !== '') {
                  contactName = chatData.notify.trim();
                } else if (chatData.verifiedName && chatData.verifiedName.trim() !== '') {
                  contactName = chatData.verifiedName.trim();
                }
                
                const contactObj = {
                  from: chatId,
                  name: contactName,
                  phone: phone,
                  profileName: chatData.verifiedName || contactName,
                  instanceId: instanceId,
                  source: 'chat_extraction',
                  chatData: {
                    unreadCount: chatData.unreadCount || 0,
                    lastMessageTime: chatData.lastMessageTime || null,
                    isGroup: false
                  }
                };
                
                contacts.push(contactObj);
                processedContactIds.add(chatId);
                importContactCount++;
                
                console.log(\`[Import History] ✅ Contato extraído: \${contactName} (\${phone}) de \${chatId}\`);
              }
            } else {
              console.log(\`[Import History] ⏭️ Chat ignorado (grupo/status): \${chatId}\`);
            }
          }
        }
        
        console.log(\`[Import History] 🎉 \${contacts.length} contatos extraídos dos chats\`);`;
  
  serverContent = beforeContacts + newContactsCode + afterContacts;
  console.log('✅ Seção de extração de contatos atualizada');
} else {
  console.log('❌ Não foi possível localizar seção de contatos');
}

// 4. Salvar arquivo
fs.writeFileSync('server.js', serverContent);
console.log('💾 Arquivo server.js atualizado');

// 5. Verificar sintaxe
const { exec } = require('child_process');
exec('node -c server.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro de sintaxe:', error.message);
    fs.copyFileSync(backupFile, 'server.js');
    console.log('🔄 Backup restaurado');
  } else {
    console.log('✅ Correção aplicada com sucesso!');
    console.log('');
    console.log('🚀 EXECUTE:');
    console.log('1. pm2 restart whatsapp-server');
    console.log('2. Recriar instância');
    console.log('3. Testar importação');
    console.log('');
    console.log('📊 DEVE EXTRAIR:');
    console.log('- Lead-2287 (556296662287)');
    console.log('- Lead-2114 (556291572114)');
  }
}); 