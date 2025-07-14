// Script para atualizar o servidor WhatsApp com endpoint universal e adicionar novo webhook
// Este script deve ser executado na VPS para modificar o arquivo server.js

const fs = require('fs');
const path = require('path');
const serverPath = '/root/whatsapp-server/server.js';

// Fazer backup do arquivo original
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `/root/whatsapp-server/server.js.backup-${timestamp}`;

console.log(`🔄 Iniciando atualização do servidor WhatsApp...`);
console.log(`📂 Criando backup do arquivo original...`);

// Criar backup
fs.copyFileSync(serverPath, backupPath);
console.log(`✅ Backup criado em: ${backupPath}`);

// Ler o arquivo do servidor
let serverContent = fs.readFileSync(serverPath, 'utf8');
console.log(`📖 Arquivo do servidor carregado`);

// 1. ADICIONAR NOVO WEBHOOK
console.log(`🔄 Adicionando novo webhook...`);

// Procurar a definição dos webhooks
const webhookRegex = /const\s+SUPABASE_WEBHOOKS\s*=\s*{[^}]*}/;
const webhookMatch = serverContent.match(webhookRegex);

if (webhookMatch) {
  // Verificar se o webhook já existe
  if (!serverContent.includes('https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral')) {
    // Adicionar novo webhook
    const webhookDefinition = webhookMatch[0];
    const newWebhookDefinition = webhookDefinition.replace(
      /(const\s+SUPABASE_WEBHOOKS\s*=\s*{[^}]*)(})/,
      '$1,\n  TICLIN_N8N: "https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral"\n$2'
    );
    
    serverContent = serverContent.replace(webhookRegex, newWebhookDefinition);
    console.log(`✅ Novo webhook adicionado`);
  } else {
    console.log(`⚠️ O webhook já existe no arquivo`);
  }
} else {
  console.log(`❌ Não foi possível encontrar a definição dos webhooks`);
}

// 2. MODIFICAR O ENDPOINT /send PARA SUPORTAR TODOS OS TIPOS DE MÍDIA
console.log(`🔄 Modificando endpoint /send para suportar todos os tipos de mídia...`);

// Encontrar o endpoint /send
const sendEndpointRegex = /app\.post\('\/send',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?const\s*\{\s*instanceId,\s*phone,\s*message\s*\}\s*=\s*req\.body;/;

// Substituir com o novo endpoint que suporta todos os tipos de mídia
const newSendEndpoint = `app.post('/send', async (req, res) => {
  try {
    const { instanceId, phone, message, messageType, mediaUrl, caption, fileName, mimetype, ptt } = req.body;

    if (!instanceId || !phone) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e phone são obrigatórios'
      });
    }

    // Verificar se pelo menos message ou mediaUrl foi fornecido
    if (!message && !mediaUrl) {
      return res.status(400).json({
        success: false,
        error: 'message ou mediaUrl deve ser fornecido'
      });
    }`;

// Substituir a parte inicial do endpoint
serverContent = serverContent.replace(sendEndpointRegex, newSendEndpoint);

// Encontrar a parte onde a mensagem é enviada
const sendMessageRegex = /const chatId = phone\.includes\('@'\) \? phone : `\$\{phone\}@c\.us`;\s*const messageResult = await instance\.socket\.sendMessage\(chatId, \{ text: message \}\);/;

// Substituir com o novo código que suporta múltiplos tipos de mídia
const newSendMessageCode = `const chatId = phone.includes('@') ? phone : \`\${phone}@c.us\`;
      
      let messageContent;
      let messageResult;
      
      // Determinar o tipo de mensagem a ser enviada
      switch (messageType) {
        case 'image':
          if (!mediaUrl) {
            return res.status(400).json({
              success: false,
              error: 'mediaUrl é obrigatório para mensagens do tipo image'
            });
          }
          
          messageContent = {
            image: { url: mediaUrl },
            caption: caption || '',
            mimetype: mimetype || 'image/jpeg'
          };
          break;
          
        case 'video':
          if (!mediaUrl) {
            return res.status(400).json({
              success: false,
              error: 'mediaUrl é obrigatório para mensagens do tipo video'
            });
          }
          
          messageContent = {
            video: { url: mediaUrl },
            caption: caption || '',
            mimetype: mimetype || 'video/mp4'
          };
          break;
          
        case 'audio':
          if (!mediaUrl) {
            return res.status(400).json({
              success: false,
              error: 'mediaUrl é obrigatório para mensagens do tipo audio'
            });
          }
          
          messageContent = {
            audio: { url: mediaUrl },
            mimetype: mimetype || 'audio/mp3',
            ptt: ptt === true // ptt = true para nota de voz, false para áudio normal
          };
          break;
          
        case 'document':
          if (!mediaUrl) {
            return res.status(400).json({
              success: false,
              error: 'mediaUrl é obrigatório para mensagens do tipo document'
            });
          }
          
          messageContent = {
            document: { url: mediaUrl },
            mimetype: mimetype || 'application/pdf',
            fileName: fileName || 'document.pdf',
            caption: caption || ''
          };
          break;
          
        case 'sticker':
          if (!mediaUrl) {
            return res.status(400).json({
              success: false,
              error: 'mediaUrl é obrigatório para mensagens do tipo sticker'
            });
          }
          
          messageContent = {
            sticker: { url: mediaUrl }
          };
          break;
          
        case 'location':
          if (!message || !message.includes(',')) {
            return res.status(400).json({
              success: false,
              error: 'Para mensagens do tipo location, o campo message deve conter latitude,longitude'
            });
          }
          
          const [latitude, longitude] = message.split(',').map(coord => parseFloat(coord.trim()));
          
          messageContent = {
            location: {
              degreesLatitude: latitude,
              degreesLongitude: longitude
            }
          };
          break;
          
        case 'contact':
          try {
            const contactData = JSON.parse(message);
            messageContent = {
              contacts: {
                displayName: contactData.displayName || 'Contact',
                contacts: [contactData]
              }
            };
          } catch (error) {
            return res.status(400).json({
              success: false,
              error: 'Para mensagens do tipo contact, o campo message deve conter um JSON válido'
            });
          }
          break;
          
        case 'text':
        default:
          // Mensagem de texto padrão
          if (!message) {
            return res.status(400).json({
              success: false,
              error: 'message é obrigatório para mensagens do tipo text'
            });
          }
          
          messageContent = { text: message };
          break;
      }
      
      // Enviar a mensagem
      messageResult = await instance.socket.sendMessage(chatId, messageContent);`;

// Substituir o código de envio de mensagem
serverContent = serverContent.replace(sendMessageRegex, newSendMessageCode);

// 3. MODIFICAR O CÓDIGO DE PROCESSAMENTO DE MENSAGENS PARA ENVIAR PARA O NOVO WEBHOOK
console.log(`🔄 Modificando o processamento de mensagens para enviar para o novo webhook...`);

// Procurar o código que envia mensagens para webhooks
const webhookSendRegex = /(async\s+function\s+sendMessageToWebhook\s*\([^)]*\)\s*\{[\s\S]*?)(return\s+response;?\s*\})/;

// Adicionar o código para enviar para o novo webhook
const newWebhookSendCode = `$1
  // Enviar para o webhook do N8N
  try {
    if (SUPABASE_WEBHOOKS.TICLIN_N8N) {
      logger.info(\`📤 Enviando mensagem para webhook N8N: \${SUPABASE_WEBHOOKS.TICLIN_N8N}\`);
      
      const n8nResponse = await fetch(SUPABASE_WEBHOOKS.TICLIN_N8N, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (n8nResponse.ok) {
        logger.info(\`✅ Mensagem enviada com sucesso para webhook N8N\`);
      } else {
        logger.error(\`❌ Erro ao enviar mensagem para webhook N8N: \${n8nResponse.status} \${n8nResponse.statusText}\`);
      }
    }
  } catch (n8nError) {
    logger.error(\`❌ Erro ao enviar mensagem para webhook N8N: \${n8nError.message}\`);
  }
  
  $2`;

// Substituir o código de envio de webhook
serverContent = serverContent.replace(webhookSendRegex, newWebhookSendCode);

// Escrever o arquivo modificado
fs.writeFileSync(serverPath, serverContent);
console.log(`✅ Arquivo server.js atualizado com sucesso!`);

console.log(`\n🔄 Para aplicar as alterações, reinicie o servidor com o comando:`);
console.log(`pm2 restart all\n`); 