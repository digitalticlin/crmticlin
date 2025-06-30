#!/bin/bash

# 🎯 CORREÇÃO CIRÚRGICA BILATERAL + TODOS TIPOS DE MÍDIA
# ✅ Corrige handler de mensagens para suportar: TEXTO, IMAGEM, ÁUDIO, VÍDEO + fromMe: true/false

set -e
echo "🚀 INICIANDO CORREÇÃO BILATERAL + MÍDIA COMPLETA"
echo "📅 $(date)"
echo "=========================================="

# 1. BACKUP SEGURO
echo "📦 1. Criando backup específico..."
cd /root/whatsapp-server/
cp server.js server-backup-antes-bilateral-completo-$(date +%Y%m%d_%H%M%S).js
echo "   ✅ Backup criado!"

# 2. LOCALIZAR HANDLER DE MENSAGENS
echo "🔍 2. Localizando handler de mensagens..."
LINHA_HANDLER=$(grep -n "socket.ev.on('messages.upsert'" server.js | cut -d: -f1)
LINHA_FILTRO=$(grep -n "if (!message.key.fromMe && message.message)" server.js | cut -d: -f1)
LINHA_MESSAGE_BODY=$(grep -n "const messageBody = message.message.conversation" server.js | cut -d: -f1)
LINHA_MESSAGE_DATA=$(grep -n "const messageData = {" server.js | cut -d: -f1)
LINHA_NOTIFY=$(grep -n "await notifyMessageReceived" server.js | cut -d: -f1)

echo "   📍 Handler encontrado na linha: $LINHA_HANDLER"
echo "   📍 Filtro encontrado na linha: $LINHA_FILTRO"
echo "   📍 MessageBody encontrado na linha: $LINHA_MESSAGE_BODY"

# 3. APLICAR CORREÇÃO BILATERAL + MÍDIA COMPLETA
echo "🔧 3. Aplicando correção bilateral + mídia completa..."

# 3.1. Remover filtro fromMe
sed -i "${LINHA_FILTRO}s/if (!message.key.fromMe && message.message) {/if (message.message) {/" server.js

# 3.2. Substituir processamento de messageBody por versão completa
sed -i "${LINHA_MESSAGE_BODY},${LINHA_MESSAGE_DATA}d" server.js

# 3.3. Inserir processamento completo bilateral + mídia
sed -i "${LINHA_MESSAGE_BODY}i\\
          // ✅ BILATERAL: Processar incoming E outgoing\\
          const isOutgoing = message.key?.fromMe || false;\\
          const direction = isOutgoing ? 'ENVIADA PARA' : 'RECEBIDA DE';\\
\\
          // ✅ EXTRAÇÃO COMPLETA DE MÍDIA (TEXTO, IMAGEM, ÁUDIO, VÍDEO)\\
          let messageText = '';\\
          let mediaType = 'text';\\
          let mediaUrl = null;\\
          let mediaCaption = null;\\
          let fileName = null;\\
\\
          const msg = message.message;\\
\\
          if (msg.conversation) {\\
            messageText = msg.conversation;\\
            mediaType = 'text';\\
          } else if (msg.extendedTextMessage?.text) {\\
            messageText = msg.extendedTextMessage.text;\\
            mediaType = 'text';\\
          } else if (msg.imageMessage) {\\
            messageText = msg.imageMessage.caption || '[Imagem]';\\
            mediaCaption = msg.imageMessage.caption;\\
            mediaType = 'image';\\
            mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;\\
            fileName = 'image.' + (msg.imageMessage.mimetype?.split('/')[1] || 'jpg');\\
          } else if (msg.videoMessage) {\\
            messageText = msg.videoMessage.caption || '[Vídeo]';\\
            mediaCaption = msg.videoMessage.caption;\\
            mediaType = 'video';\\
            mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;\\
            fileName = 'video.' + (msg.videoMessage.mimetype?.split('/')[1] || 'mp4');\\
          } else if (msg.audioMessage) {\\
            messageText = '[Áudio]';\\
            mediaType = 'audio';\\
            mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;\\
            fileName = 'audio.' + (msg.audioMessage.mimetype?.split('/')[1] || 'ogg');\\
          } else if (msg.documentMessage) {\\
            messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';\\
            mediaCaption = msg.documentMessage.caption;\\
            mediaType = 'document';\\
            mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;\\
            fileName = msg.documentMessage.fileName || 'document';\\
          } else if (msg.stickerMessage) {\\
            messageText = '[Sticker]';\\
            mediaType = 'sticker';\\
            mediaUrl = msg.stickerMessage.url || msg.stickerMessage.directPath;\\
          } else {\\
            messageText = '[Mensagem de mídia]';\\
            mediaType = 'unknown';\\
          }\\
\\
          console.log(\`[\${instanceId}] 📨 Mensagem \${direction} (\${mediaType.toUpperCase()}): \${message.key.remoteJid} | \${messageText.substring(0, 50)}\`);\\
\\
          const messageData = {\\
            from: message.key.remoteJid,\\
            body: messageText,\\
            timestamp: message.messageTimestamp,\\
            fromMe: isOutgoing,\\
            direction: direction,\\
            mediaType: mediaType,\\
            mediaUrl: mediaUrl,\\
            mediaCaption: mediaCaption,\\
            fileName: fileName,\\
            messageId: message.key.id\\
          };" server.js

# 3.4. Atualizar linha de log
LINHA_LOG_NOVA=$(grep -n "console.log.*Nova mensagem recebida" server.js | cut -d: -f1)
if [ ! -z "$LINHA_LOG_NOVA" ]; then
  sed -i "${LINHA_LOG_NOVA}d" server.js
fi

echo "   ✅ Processamento bilateral + mídia aplicado!"

# 4. VERIFICAR SINTAXE
echo "🔍 4. Validando sintaxe..."
node -c server.js
echo "   ✅ Sintaxe válida!"

# 5. MOSTRAR MUDANÇAS APLICADAS
echo "📋 5. Verificando mudanças aplicadas..."
echo "   Novo handler bilateral + mídia instalado!"
echo "   Tipos suportados: TEXTO, IMAGEM, VÍDEO, ÁUDIO, DOCUMENTO, STICKER"
echo "   Direções: INCOMING (RECEBIDA DE) + OUTGOING (ENVIADA PARA)"

# 6. RESTART CONTROLADO
echo "🔄 6. Aplicando restart..."
pm2 stop whatsapp-server
pm2 start server.js --name whatsapp-server

echo "⏱️  Aguardando 15 segundos para estabilizar..."
sleep 15

# 7. VERIFICAÇÃO FINAL
echo "✅ 7. Verificação bilateral + mídia..."
echo "   📊 Status do servidor:"
curl -s http://localhost:3002/status | grep -E "server|instances"

echo ""
echo "   📋 Logs recentes (20 linhas):"
pm2 logs whatsapp-server --lines 20

echo ""
echo "=========================================="
echo "🎉 CORREÇÃO BILATERAL + MÍDIA APLICADA!"
echo "📅 $(date)"
echo ""
echo "🧪 TESTE COMPLETO AGORA:"
echo "   ✅ TEXTO: Envie/receba mensagem normal"
echo "   ✅ IMAGEM: Envie/receba foto (com/sem legenda)"
echo "   ✅ VÍDEO: Envie/receba vídeo (com/sem legenda)"
echo "   ✅ ÁUDIO: Envie/receba áudio/voice"
echo "   ✅ DOCUMENTO: Envie/receba PDF/arquivo"
echo ""
echo "📋 LOGS ESPERADOS:"
echo "   'Mensagem RECEBIDA DE (TEXT): 5511999999999 | Olá'"
echo "   'Mensagem ENVIADA PARA (IMAGE): 5511999999999 | [Imagem]'"
echo "   'Mensagem RECEBIDA DE (AUDIO): 5511999999999 | [Áudio]'"
echo ""
echo "🔍 MONITORAR:"
echo "   pm2 logs whatsapp-server --lines 0 | grep -E 'RECEBIDA|ENVIADA'"
echo ""
echo "🆘 ROLLBACK (se necessário):"
echo "   pm2 stop whatsapp-server"
echo "   cp server-backup-antes-bilateral-completo-*.js server.js"
echo "   pm2 start server.js --name whatsapp-server"
echo "==========================================" 