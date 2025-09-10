#!/bin/bash

echo "=== Adicionando função createWhatsAppInstance ao servidor WhatsApp ==="

# Definir diretório do servidor
SERVER_DIR="/root/whatsapp-server"
SERVER_JS="$SERVER_DIR/server.js"

# Criar backup do arquivo atual
BACKUP_FILE="$SERVER_JS.backup.$(date +%Y%m%d_%H%M%S)"
echo "Criando backup em: $BACKUP_FILE"
cp "$SERVER_JS" "$BACKUP_FILE"

# Criar arquivo temporário com a nova implementação das funções
echo "Criando nova implementação das funções..."

cat > /tmp/new_functions.js << 'EOF'

// Função para processar mensagens recebidas
async function processMessage(instanceId, message) {
  try {
    const isOutgoing = message.key?.fromMe || false;
    const remoteJid = message.key?.remoteJid;
    const messageContent = message.message;
    const direction = isOutgoing ? 'ENVIADA PARA' : 'RECEBIDA DE';
    
    if (!remoteJid) return;
    
    // Extrair número de telefone do JID
    const phoneNumber = remoteJid.split('@')[0];
    
    logger.info(`[${instanceId}] 📨 Mensagem ${direction} ${phoneNumber}`);
    
    // Enviar para webhook do backend
    try {
      await axios.post(WEBHOOKS.BACKEND_MESSAGES, {
        instanceId,
        message,
        direction: isOutgoing ? 'outgoing' : 'incoming'
      });
      logger.info(`[${instanceId}] ✅ Webhook BACKEND enviado para ${phoneNumber}`);
    } catch (backendError) {
      logger.error(`[${instanceId}] ❌ Erro no webhook BACKEND: ${backendError.message}`);
    }
    
    // Enviar para webhook do N8N
    try {
      await axios.post(WEBHOOKS.N8N_MESSAGES, {
        instanceId,
        message,
        direction: isOutgoing ? 'outgoing' : 'incoming'
      });
      logger.info(`[${instanceId}] ✅ Webhook N8N enviado para ${phoneNumber}`);
    } catch (n8nError) {
      logger.error(`[${instanceId}] ❌ Erro no webhook N8N: ${n8nError.message}`);
    }
  } catch (error) {
    logger.error(`[${instanceId}] ❌ Erro ao processar mensagem: ${error.message}`);
  }
}

// Função para verificar se é mensagem de grupo
function isGroupMessage(message) {
  return message.key?.remoteJid?.endsWith('@g.us') || false;
}

// Função para notificar QR Code
async function notifyQRCode(instanceId, qrCode) {
  try {
    await axios.post(WEBHOOKS.QR_RECEIVER, {
      instanceId,
      qrCode
    });
    logger.info(`[${instanceId}] ✅ QR Code enviado para webhook`);
  } catch (error) {
    logger.error(`[${instanceId}] ❌ Erro ao enviar QR Code: ${error.message}`);
  }
}

// Função para notificar conexão estabelecida
async function notifyConnectionEstablished(instanceId, phoneNumber, profileName) {
  try {
    await axios.post(WEBHOOKS.CONNECTION_SYNC, {
      instanceId,
      phoneNumber,
      profileName,
      status: 'connected'
    });
    logger.info(`[${instanceId}] ✅ Status de conexão enviado para webhook`);
  } catch (error) {
    logger.error(`[${instanceId}] ❌ Erro ao enviar status de conexão: ${error.message}`);
  }
}

// Função para criar instância do WhatsApp
async function createWhatsAppInstance(instanceId, createdByUserId = null) {
  try {
    logger.info(`🚀 Criando instância: ${instanceId}`);

    if (instances[instanceId]) {
      logger.info(`⚠️ Instância ${instanceId} já existe`);
      return instances[instanceId];
    }

    const authDir = path.join(AUTH_DIR, instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Inicializar a instância antes de criar o socket
    instances[instanceId] = {
      instanceId,
      socket: null,
      status: 'initializing',
      connected: false,
      qrCode: null,
      phone: null,
      profileName: null,
      lastUpdate: new Date().toISOString(),
      attempts: 0,
      createdByUserId
    };

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const socket = makeWASocket({
        auth: state,
        logger: undefined,
        printQRInTerminal: false,
        browser: ['WhatsApp Server', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 60000
      });

      // Atualizar a instância com o socket criado
      instances[instanceId].socket = socket;
      instances[instanceId].status = 'connecting';

      // Configurar handlers de eventos
      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info(`[${instanceId}] 📱 QR Code gerado`);
          const qrCode = await QRCode.toDataURL(qr);
          instances[instanceId].qrCode = qrCode;
          instances[instanceId].status = 'qr';
          await notifyQRCode(instanceId, qrCode);
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          logger.info(`[${instanceId}] 🔌 Conexão fechada devido a ${lastDisconnect?.error?.message || 'Razão desconhecida'}`);

          if (shouldReconnect) {
            instances[instanceId].attempts += 1;
            if (instances[instanceId].attempts < 5) {
              logger.info(`[${instanceId}] 🔄 Tentando reconectar (${instances[instanceId].attempts}/5)...`);
              setTimeout(() => createWhatsAppInstance(instanceId, createdByUserId), 5000);
            } else {
              logger.error(`[${instanceId}] ❌ Máximo de tentativas de reconexão atingido`);
              instances[instanceId].status = 'failed';
            }
          } else {
            delete instances[instanceId];
            logger.info(`[${instanceId}] 🚪 Instância desconectada permanentemente`);
          }
        } else if (connection === 'open') {
          logger.info(`[${instanceId}] ✅ Conectado com sucesso!`);
          instances[instanceId].status = 'ready';
          instances[instanceId].connected = true;
          instances[instanceId].qrCode = null;
          instances[instanceId].attempts = 0;

          const phoneNumber = socket.user?.id?.split('@')[0];
          const profileName = socket.user?.name || socket.user?.verifiedName || 'Usuário';

          instances[instanceId].phone = phoneNumber;
          instances[instanceId].profileName = profileName;

          await notifyConnectionEstablished(instanceId, phoneNumber, profileName);
        }
      });

      // Configurar handler de credenciais
      socket.ev.on('creds.update', saveCreds);

      // Configurar handler de mensagens
      socket.ev.on('messages.upsert', async (messageUpdate) => {
        const messages = messageUpdate.messages;
        if (!messages || !Array.isArray(messages)) return;

        for (const message of messages) {
          if (message && message.message) {
            // Filtro de grupos
            if (isGroupMessage(message)) {
              logger.info(`[${instanceId}] 🚫 Mensagem de grupo ignorada: ${message.key?.remoteJid}`);
              continue;
            }

            // Processar mensagens
            try {
              await processMessage(instanceId, message);
            } catch (err) {
              logger.error(`[${instanceId}] ❌ Erro ao processar mensagem: ${err.message}`);
            }
          }
        }
      });

      return instances[instanceId];
    } catch (socketError) {
      logger.error(`[${instanceId}] ❌ Erro ao criar socket: ${socketError.message}`);
      instances[instanceId].status = 'error';
      throw socketError;
    }
  } catch (error) {
    logger.error(`[${instanceId}] ❌ Erro ao criar instância: ${error.message}`);
    if (instances[instanceId]) {
      instances[instanceId].status = 'error';
    }
    throw error;
  }
}
EOF

# Encontrar um bom lugar para inserir as funções (após a declaração de variáveis e antes das rotas)
echo "Procurando local para inserir as funções..."
INSERT_LINE=$(grep -n "const AUTH_DIR" "$SERVER_JS" | cut -d':' -f1)

if [ -z "$INSERT_LINE" ]; then
  # Se não encontrar AUTH_DIR, tenta encontrar a declaração de instances
  INSERT_LINE=$(grep -n "const instances" "$SERVER_JS" | cut -d':' -f1)
fi

if [ -z "$INSERT_LINE" ]; then
  # Se ainda não encontrar, insere após as configurações iniciais
  INSERT_LINE=100
fi

echo "Inserindo funções na linha $INSERT_LINE..."
sed -i "${INSERT_LINE}r /tmp/new_functions.js" "$SERVER_JS"

echo "Correção aplicada!"
echo "Reiniciando o servidor..."
cd "$SERVER_DIR" && pm2 restart all

echo "Aguardando inicialização do servidor (10s)..."
sleep 10

echo "Verificando status do servidor:"
curl -s http://localhost:3002/health

echo ""
echo "Teste concluído! Agora você pode tentar criar uma nova instância." 