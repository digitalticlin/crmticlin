// Script para atualizar o endpoint /send na VPS para suportar todos os tipos de mídia
// Executar este script na VPS para modificar o arquivo server.js

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo server.js
const serverPath = '/root/whatsapp-server/server.js';

// Fazer backup do arquivo original
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `/root/whatsapp-server/server.js.backup-${timestamp}`;

console.log(`🔄 Iniciando atualização do endpoint /send...`);
console.log(`📂 Criando backup do arquivo original em ${backupPath}...`);

try {
  // Criar backup
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado com sucesso!`);

  // Ler o arquivo do servidor
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  console.log(`📖 Arquivo do servidor carregado (${serverContent.length} bytes)`);

  // Encontrar o endpoint /send existente
  const sendEndpointRegex = /app\.post\('\/send',\s*authenticateToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?(?=app\.|\}\);$)/;
  
  if (!sendEndpointRegex.test(serverContent)) {
    console.error(`❌ Endpoint /send não encontrado no arquivo!`);
    process.exit(1);
  }

  // Novo código para o endpoint /send universal
  const newSendEndpoint = `app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message, mediaUrl, mediaType } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      version: SERVER_VERSION
    });
  }

  console.log(\`📤 [v\${SERVER_VERSION}] Enviando mensagem para \${phone} via instância \${instanceId}\`);
  console.log(\`🔍 Tipo de mídia: \${mediaType || 'text'}\`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        version: SERVER_VERSION
      });
    }

    const instance = activeInstances.get(instanceId);
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: \`Instância não está pronta. Status atual: \${instance.status}\`,
        version: SERVER_VERSION
      });
    }

    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phone.replace(/\\D/g, '');
    const formattedPhone = cleanPhone.includes('@') ? cleanPhone : \`\${cleanPhone}@c.us\`;
    
    let messageResult;
    
    // Verificar se é uma mensagem de mídia ou texto
    if (mediaUrl && mediaType) {
      console.log(\`📎 [v\${SERVER_VERSION}] Enviando mídia tipo \${mediaType} para \${phone}\`);
      
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
            ptt: true // Enviar como mensagem de voz
          });
          break;
          
        case 'document':
          messageResult = await instance.socket.sendMessage(formattedPhone, { 
            document: { url: mediaUrl },
            fileName: message || 'document.pdf',
            mimetype: 'application/pdf'
          });
          break;
          
        default:
          // Fallback para texto se o tipo de mídia não for reconhecido
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }
    } else {
      // Mensagem de texto simples
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }
    
    console.log(\`✅ [v\${SERVER_VERSION}] Mensagem enviada com sucesso para \${phone}\`);
    
    res.json({
      success: true,
      messageId: messageResult.key.id,
      to: formattedPhone,
      message: message,
      mediaType: mediaType || 'text',
      mediaUrl: mediaUrl || null,
      timestamp: new Date().toISOString(),
      version: SERVER_VERSION
    });

  } catch (error) {
    console.error(\`❌ [v\${SERVER_VERSION}] Erro ao enviar mensagem: \${error.message}\`);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

`;

  // Substituir o endpoint /send existente
  serverContent = serverContent.replace(sendEndpointRegex, newSendEndpoint);

  // Adicionar o novo webhook do N8N
  // Primeiro, verificar se a constante WEBHOOKS existe
  if (serverContent.includes('const WEBHOOKS')) {
    // Verificar se o webhook do N8N já existe
    if (!serverContent.includes('TICLIN_N8N')) {
      // Adicionar o novo webhook
      serverContent = serverContent.replace(
        /const WEBHOOKS\s*=\s*{/,
        `const WEBHOOKS = {\n  TICLIN_N8N: "https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral",`
      );
      console.log(`✅ Webhook do N8N adicionado com sucesso!`);
    } else {
      console.log(`⚠️ Webhook do N8N já existe.`);
    }
  } else {
    console.log(`❌ Constante WEBHOOKS não encontrada no arquivo.`);
  }

  // Atualizar a função de envio de webhook para enviar para múltiplos webhooks
  // Primeiro, verificar se a função sendWebhook existe
  if (serverContent.includes('const sendWebhook') || serverContent.includes('function sendWebhook')) {
    // Substituir a função sendWebhook
    const sendWebhookRegex = /(?:const|function)\s+sendWebhook\s*=\s*async\s*\(event,\s*data\)\s*=>\s*\{[\s\S]*?(?=\}\s*;)/;
    
    if (sendWebhookRegex.test(serverContent)) {
      const newSendWebhook = `const sendWebhook = async (event, data) => {
  try {
    // Enviar para todos os webhooks configurados
    const webhooks = [];
    
    // Webhook principal
    if (WEBHOOKS.MESSAGE_RECEIVER) {
      webhooks.push(fetch(WEBHOOKS.MESSAGE_RECEIVER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      }));
    }
    
    // Webhook do N8N
    if (WEBHOOKS.TICLIN_N8N) {
      webhooks.push(fetch(WEBHOOKS.TICLIN_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      }));
    }
    
    // Executar todas as requisições em paralelo
    await Promise.allSettled(webhooks);
    
  } catch (error) {
    console.error(\`❌ [v\${SERVER_VERSION}] Erro ao enviar webhook: \${error.message}\`);
  }`;

      serverContent = serverContent.replace(sendWebhookRegex, newSendWebhook);
      console.log(`✅ Função sendWebhook atualizada com sucesso!`);
    } else {
      console.log(`❌ Não foi possível encontrar a função sendWebhook para atualizar.`);
    }
  } else {
    console.log(`❌ Função sendWebhook não encontrada no arquivo.`);
  }

  // Salvar o arquivo modificado
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log(`✅ Arquivo server.js atualizado com sucesso!`);
  console.log(`🚀 Endpoint /send universal implementado!`);
  
  console.log(`\n⚠️ IMPORTANTE: Reinicie o servidor para aplicar as alterações:`);
  console.log(`   pm2 restart all`);
  
} catch (error) {
  console.error(`❌ Erro ao atualizar o arquivo:`, error);
  console.log(`🔄 Tentando restaurar o backup...`);
  
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, serverPath);
      console.log(`✅ Backup restaurado com sucesso!`);
    }
  } catch (restoreError) {
    console.error(`❌ Erro ao restaurar o backup:`, restoreError);
  }
} 