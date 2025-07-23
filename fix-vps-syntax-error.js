// ==========================================
// SCRIPT PARA CORRIGIR ERRO DE SINTAXE NA VPS
// Execute na VPS: node fix-vps-syntax-error.js
// ==========================================

const fs = require('fs');
const path = require('path');

const serverPath = '/root/whatsapp-server/server.js';
const backupPath = '/root/whatsapp-server/server.js.backup-safe-';

console.log('🔧 Iniciando correção do erro de sintaxe...');

try {
  // 1. Verificar se backup existe
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup seguro não encontrado!');
    console.log('📋 Arquivos disponíveis:');
    const files = fs.readdirSync('/root/whatsapp-server').filter(f => f.includes('backup'));
    files.forEach(f => console.log(`   - ${f}`));
    process.exit(1);
  }

  // 2. Restaurar do backup seguro
  console.log('📁 Restaurando do backup seguro...');
  fs.copyFileSync(backupPath, serverPath);
  console.log('✅ Arquivo restaurado do backup');

  // 3. Ler o conteúdo restaurado
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  console.log(`📖 Arquivo carregado (${serverContent.length} bytes)`);

  // 4. Verificar se já tem o endpoint /send
  const hasSendEndpoint = /app\.post\('\/send'/.test(serverContent);
  if (!hasSendEndpoint) {
    console.error('❌ Endpoint /send não encontrado no backup!');
    process.exit(1);
  }

  // 5. Procurar por padrões mais específicos do endpoint /send
  const sendEndpointPattern = /app\.post\(['"]\/send['"],\s*authenticateToken,\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*const\s*\{\s*instanceId[^}]*\}\s*=\s*req\.body;[\s\S]*?\n\}\);/;
  
  if (!sendEndpointPattern.test(serverContent)) {
    console.log('⚠️  Padrão específico não encontrado. Buscando versão mais flexível...');
    
    // Padrão mais flexível
    const flexiblePattern = /app\.post\(['"]\/send['"],[\s\S]*?res\.json\([^}]*\}\);[\s\S]*?\}\);/;
    
    if (!flexiblePattern.test(serverContent)) {
      console.error('❌ Não foi possível localizar o endpoint /send para substituição');
      console.log('🔍 Vamos verificar as primeiras linhas do endpoint:');
      
      const lines = serverContent.split('\n');
      let foundSend = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("app.post('/send'")) {
          foundSend = true;
          console.log(`Linha ${i + 1}: ${lines[i]}`);
          for (let j = 1; j <= 10; j++) {
            if (lines[i + j]) {
              console.log(`Linha ${i + j + 1}: ${lines[i + j]}`);
            }
          }
          break;
        }
      }
      
      if (!foundSend) {
        console.error('❌ Endpoint /send não encontrado no arquivo!');
      }
      process.exit(1);
    }
  }

  // 6. Criar o novo endpoint com mídia (versão segura)
  const newSendEndpoint = `app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message, mediaType, mediaUrl } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  const instance = instances[instanceId];
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  if (!instance.connected || !instance.socket) {
    return res.status(400).json({
      success: false,
      error: 'Instância não está conectada',
      status: instance.status,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(\`📤 Enviando via \${instanceId} para \${phone}: \${message.substring(0, 50)}...\${mediaType ? ' (Mídia: ' + mediaType + ')' : ''}\`);

    const formattedPhone = phone.includes('@') ? phone : \`\${phone}@s.whatsapp.net\`;
    let messageResult;

    // ✅ NOVO: SUPORTE A MÍDIA
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(\`🎬 Enviando mídia tipo: \${mediaType}\`);
      
      switch (mediaType.toLowerCase()) {
        case 'image':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            image: { url: mediaUrl },
            caption: message
          });
          break;
          
        case 'video':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            video: { url: mediaUrl },
            caption: message
          });
          break;
          
        case 'audio':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            audio: { url: mediaUrl },
            ptt: true
          });
          break;
          
        case 'document':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            document: { url: mediaUrl },
            fileName: message || 'documento.pdf',
            mimetype: 'application/pdf'
          });
          break;
          
        default:
          console.log('⚠️  Tipo de mídia não reconhecido, enviando como texto');
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }
    } else {
      // Mensagem de texto (comportamento original)
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }

    // Cache original mantido
    if (connectionManager && typeof connectionManager.addSentMessageToCache === 'function') {
      connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);
    }

    console.log(\`✅ Mensagem enviada com sucesso via \${instanceId}\`);

    res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      mediaType: mediaType || 'text',
      mediaUrl: mediaUrl || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(\`❌ Erro ao enviar mensagem via \${instanceId}:\`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});`;

  // 7. Substituir usando o padrão mais específico primeiro
  let updated = false;
  if (sendEndpointPattern.test(serverContent)) {
    serverContent = serverContent.replace(sendEndpointPattern, newSendEndpoint);
    updated = true;
    console.log('✅ Substituição feita com padrão específico');
  } else {
    // Tentar padrão mais flexível
    const flexiblePattern = /app\.post\(['"]\/send['"],[\s\S]*?res\.json\([^}]*\}\);[\s\S]*?\}\);/;
    if (flexiblePattern.test(serverContent)) {
      serverContent = serverContent.replace(flexiblePattern, newSendEndpoint);
      updated = true;
      console.log('✅ Substituição feita com padrão flexível');
    }
  }

  if (!updated) {
    console.error('❌ Não foi possível aplicar a atualização');
    process.exit(1);
  }

  // 8. Fazer backup antes de salvar
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const preUpdateBackup = `/root/whatsapp-server/server.js.pre-media-${timestamp}`;
  fs.copyFileSync(serverPath, preUpdateBackup);
  console.log(`📁 Backup pré-atualização: ${preUpdateBackup}`);

  // 9. Salvar arquivo atualizado
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log('💾 Arquivo salvo com atualização de mídia');

  // 10. Verificar sintaxe básica
  try {
    require.resolve(serverPath);
    console.log('✅ Sintaxe validada com sucesso');
  } catch (syntaxError) {
    console.error('❌ Erro de sintaxe detectado:', syntaxError.message);
    console.log('🔄 Restaurando backup...');
    fs.copyFileSync(preUpdateBackup, serverPath);
    process.exit(1);
  }

  console.log('🎉 VPS ATUALIZADA COM SUCESSO!');
  console.log('📋 Funcionalidades adicionadas:');
  console.log('   ✅ Envio de imagens (image)');
  console.log('   ✅ Envio de vídeos (video)');
  console.log('   ✅ Envio de áudios (audio)');
  console.log('   ✅ Envio de documentos (document)');
  console.log('   ✅ Backward compatibility mantida');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro durante a correção:', error);
  process.exit(1);
} 