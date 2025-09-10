// Script para modificar o endpoint /send para suportar todos os tipos de mídia
// Este script deve ser enviado para a VPS e executado para atualizar o servidor WhatsApp

const fs = require('fs');
const path = require('path');
const serverPath = '/root/whatsapp-server/server.js';

// Fazer backup do arquivo original
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `/root/whatsapp-server/server.js.backup-${timestamp}`;
fs.copyFileSync(serverPath, backupPath);
console.log(`✅ Backup criado em: ${backupPath}`);

// Ler o arquivo do servidor
let serverContent = fs.readFileSync(serverPath, 'utf8');

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

// Escrever o arquivo modificado
fs.writeFileSync(serverPath, serverContent);
console.log('✅ Endpoint /send modificado com sucesso para suportar todos os tipos de mídia!');

// Instruções para reiniciar o servidor
console.log('\n🔄 Para aplicar as alterações, reinicie o servidor com os seguintes comandos:');
console.log('cd /root/whatsapp-server');
console.log('pm2 restart all'); 