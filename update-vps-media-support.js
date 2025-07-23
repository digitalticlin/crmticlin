// ========================================
// SCRIPT PARA ATUALIZAR VPS - SUPORTE A MÍDIA
// Execute este script na VPS para atualizar o endpoint /send
// ========================================

const fs = require('fs');
const path = require('path');

const serverPath = '/root/whatsapp-server/server.js'; // Ajuste o caminho conforme necessário

console.log('🚀 Iniciando atualização da VPS para suporte a mídia...');

try {
  // Fazer backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  // Ler arquivo atual
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  console.log(`📖 Arquivo carregado (${serverContent.length} bytes)`);

  // Encontrar e substituir o endpoint /send atual
  const oldSendEndpoint = /app\.post\('\/send',\s*authenticateToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?\}\s*catch\s*\([^}]*\)\s*\{[\s\S]*?\}\s*\}\);/;

  if (!oldSendEndpoint.test(serverContent)) {
    console.error('❌ Endpoint /send não encontrado no formato esperado!');
    process.exit(1);
  }

  // Novo endpoint com suporte a mídia
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
    console.log(\`📤 Enviando via \${instanceId} para \${phone}: \${message.substring(0, 50)}... (Tipo: \${mediaType || 'text'})\`);

    // Formatar número de telefone
    const formattedPhone = phone.includes('@') ? phone : \`\${phone}@s.whatsapp.net\`;

    let messageResult;

    // ✅ SUPORTE COMPLETO A MÍDIA
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
            ptt: true // Mensagem de voz
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
          // Fallback para texto se tipo não reconhecido
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }
    } else {
      // Mensagem de texto padrão
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }

    // Adicionar ao cache para evitar reenvio de webhook
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

  // Substituir o endpoint antigo pelo novo
  serverContent = serverContent.replace(oldSendEndpoint, newSendEndpoint);

  // Escrever arquivo atualizado
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log('✅ Arquivo atualizado com sucesso!');
  
  console.log('🎉 VPS atualizada para suporte a mídia!');
  console.log('📋 Tipos de mídia suportados: image, video, audio, document');
  console.log('🔄 Reinicie o servidor da VPS para aplicar as mudanças');
  
} catch (error) {
  console.error('❌ Erro durante a atualização:', error);
  process.exit(1);
} 