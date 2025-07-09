#!/bin/bash

# Script para adicionar um webhook de backup para mensagens
# Adiciona um webhook secundário para garantir que as mensagens sejam entregues

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Adicionando Webhook de Backup para Mensagens ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Adicionar um webhook secundário para backup de mensagens"
echo "2. Modificar o código do servidor para enviar mensagens para ambos webhooks"
echo "3. Configurar retry em caso de falha"
echo ""

# Verificar se é root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 1>&2
   exit 1
fi

# Definir o diretório do servidor WhatsApp
WHATSAPP_DIR="/root/whatsapp-servver"

# Verificar se o diretório existe
if [ ! -d "$WHATSAPP_DIR" ]; then
    echo -e "${RED}O diretório $WHATSAPP_DIR não existe.${NC}"
    read -p "Digite o caminho correto para o diretório do servidor WhatsApp: " WHATSAPP_DIR
    
    if [ ! -d "$WHATSAPP_DIR" ]; then
        echo -e "${RED}Diretório inválido. Saindo.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Usando diretório: $WHATSAPP_DIR${NC}"

# Verificar se o arquivo serverjs-atual existe
SERVER_JS="$WHATSAPP_DIR/serverjs-atual"
if [ ! -f "$SERVER_JS" ]; then
    echo -e "${YELLOW}Arquivo serverjs-atual não encontrado.${NC}"
    read -p "Digite o nome correto do arquivo principal do servidor: " SERVER_FILE
    SERVER_JS="$WHATSAPP_DIR/$SERVER_FILE"
    
    if [ ! -f "$SERVER_JS" ]; then
        echo -e "${RED}Arquivo inválido. Saindo.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Usando arquivo do servidor: $SERVER_JS${NC}"

# Backup do arquivo original
echo -e "${GREEN}Criando backup do arquivo original...${NC}"
cp "$SERVER_JS" "$SERVER_JS.bak.$(date +%Y%m%d%H%M%S)"
echo "Backup criado: $SERVER_JS.bak.$(date +%Y%m%d%H%M%S)"

# Solicitar URL do webhook de backup
echo -e "${YELLOW}Digite a URL do webhook de backup para mensagens:${NC}"
read -p "URL (ex: https://seudominio.com/webhook/backup): " BACKUP_WEBHOOK_URL

if [ -z "$BACKUP_WEBHOOK_URL" ]; then
    echo -e "${RED}URL do webhook não fornecida. Saindo.${NC}"
    exit 1
fi

# Verificar se a URL é válida
if ! [[ "$BACKUP_WEBHOOK_URL" =~ ^https?:// ]]; then
    echo -e "${RED}URL inválida. Deve começar com http:// ou https://. Saindo.${NC}"
    exit 1
fi

# Criar script para modificar o código
echo -e "${GREEN}Modificando o código para adicionar webhook de backup...${NC}"

cat > /tmp/add_backup_webhook.js << EOF
const fs = require('fs');

// Ler o arquivo
const filePath = '$SERVER_JS';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Adicionar a constante BACKUP_WEBHOOK_URL
if (!content.includes('MESSAGE_BACKUP')) {
  // Encontrar o objeto SUPABASE_WEBHOOKS
  const webhooksRegex = /const SUPABASE_WEBHOOKS = {[^}]+}/s;
  if (webhooksRegex.test(content)) {
    content = content.replace(
      webhooksRegex,
      (match) => {
        // Adicionar MESSAGE_BACKUP ao objeto
        if (match.trim().endsWith('}')) {
          return match.replace(
            /}$/,
            ',\n  MESSAGE_BACKUP: \`$BACKUP_WEBHOOK_URL\`\n}'
          );
        } else {
          return match + ',\n  MESSAGE_BACKUP: \`$BACKUP_WEBHOOK_URL\`';
        }
      }
    );
    console.log('Adicionado MESSAGE_BACKUP ao objeto SUPABASE_WEBHOOKS');
  } else {
    console.log('Não foi possível encontrar o objeto SUPABASE_WEBHOOKS');
    process.exit(1);
  }
}

// 2. Modificar a função notifyMessageReceived para enviar para o webhook de backup
const notifyFunctionRegex = /async function notifyMessageReceived\([^)]*\) {[\s\S]*?}/;
if (notifyFunctionRegex.test(content)) {
  content = content.replace(
    notifyFunctionRegex,
    (match) => {
      // Verificar se já tem o webhook de backup
      if (match.includes('MESSAGE_BACKUP')) {
        console.log('A função já tem o webhook de backup');
        return match;
      }

      // Adicionar envio para webhook de backup
      const sendWebhookRegex = /await sendSupabaseWebhook\(SUPABASE_WEBHOOKS\.MESSAGE_RECEIVER, data, ['"]Message['"].*?\);/;
      if (sendWebhookRegex.test(match)) {
        return match.replace(
          sendWebhookRegex,
          (webhookMatch) => {
            return webhookMatch + '\n\n    // Enviar para webhook de backup\n    try {\n      await sendSupabaseWebhook(SUPABASE_WEBHOOKS.MESSAGE_BACKUP, data, \'Backup\');\n    } catch (backupError) {\n      console.error(\'❌ Erro ao enviar para webhook de backup:\', backupError.message);\n      // Tentar novamente após 3 segundos\n      setTimeout(async () => {\n        try {\n          await sendSupabaseWebhook(SUPABASE_WEBHOOKS.MESSAGE_BACKUP, data, \'Backup-Retry\');\n          console.log(\'✅ Retry do webhook de backup bem-sucedido\');\n        } catch (retryError) {\n          console.error(\'❌ Retry do webhook de backup falhou:\', retryError.message);\n        }\n      }, 3000);\n    }';
          }
        );
      } else {
        console.log('Não foi possível encontrar o envio para o webhook principal');
        return match;
      }
    }
  );
}

// 3. Melhorar a função sendSupabaseWebhook para incluir retry
const sendWebhookFunctionRegex = /async function sendSupabaseWebhook\([^)]*\) {[\s\S]*?}/;
if (sendWebhookFunctionRegex.test(content)) {
  content = content.replace(
    sendWebhookFunctionRegex,
    (match) => {
      // Verificar se já tem retry
      if (match.includes('retryCount')) {
        console.log('A função sendSupabaseWebhook já tem retry');
        return match;
      }

      // Adicionar parâmetro retryCount e lógica de retry
      return match.replace(
        /async function sendSupabaseWebhook\(([^)]*)\) {/,
        'async function sendSupabaseWebhook($1, retryCount = 0) {'
      ).replace(
        /console\.error\(\`\[Supabase Webhook \${type}\] ❌ Erro:\`, [^;]*;/,
        'console.error(`[Supabase Webhook ${type}] ❌ Erro:`, error.response?.data || error.message);\n\n    // Tentar novamente se for uma falha de rede (máximo 3 tentativas)\n    if (retryCount < 3 && (error.code === \'ECONNRESET\' || error.code === \'ETIMEDOUT\' || error.code === \'ENOTFOUND\' || error.response?.status >= 500)) {\n      const nextRetry = retryCount + 1;\n      const delay = nextRetry * 2000; // Aumento exponencial: 2s, 4s, 6s\n      console.log(`[Supabase Webhook ${type}] 🔄 Tentativa ${nextRetry}/3 em ${delay/1000}s...`);\n      \n      return new Promise((resolve) => {\n        setTimeout(async () => {\n          try {\n            const retryResult = await sendSupabaseWebhook(url, data, type, nextRetry);\n            resolve(retryResult);\n          } catch (retryError) {\n            console.error(`[Supabase Webhook ${type}] ❌ Tentativa ${nextRetry} falhou:`, retryError.message);\n            resolve(false);\n          }\n        }, delay);\n      });\n    }'
      );
    }
  );
}

// Escrever o arquivo atualizado
fs.writeFileSync(filePath, content);
console.log('Arquivo atualizado com sucesso!');
EOF

# Executar o script
node /tmp/add_backup_webhook.js
rm /tmp/add_backup_webhook.js

# Verificar se a modificação foi bem-sucedida
if grep -q "MESSAGE_BACKUP" "$SERVER_JS"; then
    echo -e "${GREEN}Webhook de backup adicionado com sucesso!${NC}"
else
    echo -e "${RED}Falha ao adicionar webhook de backup. Verifique o arquivo manualmente.${NC}"
    exit 1
fi

# Adicionar URL do webhook de backup ao arquivo .env, se existir
ENV_FILE="$WHATSAPP_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Adicionando URL do webhook de backup ao arquivo .env...${NC}"
    if ! grep -q "BACKUP_WEBHOOK_URL" "$ENV_FILE"; then
        echo -e "\n# URL do webhook de backup\nBACKUP_WEBHOOK_URL=$BACKUP_WEBHOOK_URL" >> "$ENV_FILE"
        echo -e "${GREEN}URL do webhook de backup adicionada ao arquivo .env${NC}"
    else
        # Atualizar URL existente
        sed -i "s|BACKUP_WEBHOOK_URL=.*|BACKUP_WEBHOOK_URL=$BACKUP_WEBHOOK_URL|" "$ENV_FILE"
        echo -e "${GREEN}URL do webhook de backup atualizada no arquivo .env${NC}"
    fi
fi

# Instruções para reiniciar o servidor
echo -e "${GREEN}=== Webhook de Backup Adicionado com Sucesso! ===${NC}"
echo -e "${YELLOW}Para aplicar as alterações, reinicie o servidor com:${NC}"
echo -e "cd $WHATSAPP_DIR"
echo -e "pm2 restart all"
echo -e ""
echo -e "${GREEN}As mensagens agora serão enviadas para:${NC}"
echo -e "1. Webhook principal (MESSAGE_RECEIVER)"
echo -e "2. Webhook de backup: $BACKUP_WEBHOOK_URL"
echo -e ""
echo -e "${YELLOW}Características adicionadas:${NC}"
echo -e "- Envio para webhook de backup"
echo -e "- Retry automático em caso de falha (até 3 tentativas)"
echo -e "- Aumento exponencial do tempo entre retries"
echo -e ""
echo -e "${RED}IMPORTANTE: Certifique-se de que o webhook de backup está configurado para receber as mensagens.${NC}" 