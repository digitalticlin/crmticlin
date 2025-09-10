#!/bin/bash

# Script para adicionar filtro de mensagens de grupos
# Ignora mensagens que vêm de grupos (@g.us)

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Adicionando Filtro para Mensagens de Grupos ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Modificar o código para ignorar mensagens de grupos (@g.us)"
echo "2. Adicionar logs para mensagens ignoradas"
echo "3. Manter apenas mensagens de contatos individuais"
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

# Criar script para modificar o código
echo -e "${GREEN}Modificando o código para adicionar filtro de mensagens de grupos...${NC}"

cat > /tmp/add_group_filter.js << EOF
const fs = require('fs');

// Ler o arquivo
const filePath = '$SERVER_JS';
let content = fs.readFileSync(filePath, 'utf8');

// Adicionar filtro para mensagens de grupos no evento messages.upsert
const messagesUpsertRegex = /socket\.ev\.on\(['"]messages\.upsert['"], async \(messageUpdate\) => {[\s\S]*?for \(const message of messages\) {/;
if (messagesUpsertRegex.test(content)) {
  content = content.replace(
    messagesUpsertRegex,
    (match) => {
      // Verificar se já tem o filtro de grupos
      if (match.includes('@g.us')) {
        console.log('O filtro de grupos já existe');
        return match;
      }

      // Adicionar filtro de grupos
      return match + '\n      // Filtrar mensagens de grupos\n      if (message.key && message.key.remoteJid && message.key.remoteJid.includes(\'@g.us\')) {\n        console.log(`[${instanceId}] 🚫 Mensagem de grupo ignorada: ${message.key.remoteJid}`);\n        continue; // Ignorar mensagens de grupos\n      }\n';
    }
  );
}

// Adicionar filtro para mensagens de grupos no endpoint import-history
const importHistoryRegex = /app\.post\(['"]\/instance\/:instanceId\/import-history['"], async \(req, res\) => {[\s\S]*?if \(chatId && \(chatId\.includes\(['"]@s\.whatsapp\.net['"]\) \|\| chatId\.includes\(['"]@c\.us['"]\)\)/g;
if (importHistoryRegex.test(content)) {
  content = content.replace(
    importHistoryRegex,
    (match) => {
      // Verificar se já tem o filtro explícito de grupos
      if (match.includes('!chatId.includes(\'@g.us\')')) {
        console.log('O filtro de grupos já existe no endpoint import-history');
        return match;
      }

      // Adicionar filtro explícito de grupos
      return match.replace(
        /if \(chatId && \(chatId\.includes\(['"]@s\.whatsapp\.net['"]\) \|\| chatId\.includes\(['"]@c\.us['"]\)\)/,
        'if (chatId && (chatId.includes(\'@s.whatsapp.net\') || chatId.includes(\'@c.us\')) && !chatId.includes(\'@g.us\')'
      );
    }
  );
}

// Adicionar comentário explicativo sobre o filtro de grupos
if (!content.includes('// FILTRO DE GRUPOS')) {
  const serverStartRegex = /app\.listen\(PORT, ['"]0\.0\.0\.0['"], \(\) => {/;
  if (serverStartRegex.test(content)) {
    content = content.replace(
      serverStartRegex,
      '// FILTRO DE GRUPOS: Este servidor ignora mensagens de grupos (@g.us)\n// Apenas mensagens de contatos individuais são processadas\n\n' + serverStartRegex.source
    );
  }
}

// Escrever o arquivo atualizado
fs.writeFileSync(filePath, content);
console.log('Arquivo atualizado com sucesso!');
EOF

# Executar o script
node /tmp/add_group_filter.js
rm /tmp/add_group_filter.js

# Verificar se a modificação foi bem-sucedida
if grep -q "Ignorar mensagens de grupos" "$SERVER_JS"; then
    echo -e "${GREEN}Filtro de mensagens de grupos adicionado com sucesso!${NC}"
else
    echo -e "${RED}Falha ao adicionar filtro de grupos. Verifique o arquivo manualmente.${NC}"
    exit 1
fi

# Adicionar variável de ambiente para controlar o filtro, se o arquivo .env existir
ENV_FILE="$WHATSAPP_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Adicionando variável de ambiente para controlar o filtro de grupos...${NC}"
    if ! grep -q "IGNORE_GROUP_MESSAGES" "$ENV_FILE"; then
        echo -e "\n# Filtro de mensagens de grupos (true/false)\nIGNORE_GROUP_MESSAGES=true" >> "$ENV_FILE"
        echo -e "${GREEN}Variável IGNORE_GROUP_MESSAGES adicionada ao arquivo .env${NC}"
    else
        # Garantir que o filtro está ativado
        sed -i "s/IGNORE_GROUP_MESSAGES=.*/IGNORE_GROUP_MESSAGES=true/" "$ENV_FILE"
        echo -e "${GREEN}Variável IGNORE_GROUP_MESSAGES atualizada no arquivo .env${NC}"
    fi
fi

# Instruções para reiniciar o servidor
echo -e "${GREEN}=== Filtro de Mensagens de Grupos Adicionado com Sucesso! ===${NC}"
echo -e "${YELLOW}Para aplicar as alterações, reinicie o servidor com:${NC}"
echo -e "cd $WHATSAPP_DIR"
echo -e "pm2 restart all"
echo -e ""
echo -e "${GREEN}Comportamento do servidor após a modificação:${NC}"
echo -e "- Mensagens de grupos (@g.us) serão ignoradas"
echo -e "- Apenas mensagens de contatos individuais (@s.whatsapp.net, @c.us) serão processadas"
echo -e "- Mensagens ignoradas serão registradas nos logs"
echo -e ""
echo -e "${RED}IMPORTANTE: Se você precisar processar mensagens de grupos no futuro,${NC}"
echo -e "${RED}edite o arquivo .env e defina IGNORE_GROUP_MESSAGES=false${NC}" 