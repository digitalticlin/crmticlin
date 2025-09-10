#!/bin/bash

# Script para configurar variáveis de ambiente para o servidor WhatsApp
# Remove credenciais hardcoded do código

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando Variáveis de Ambiente ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Criar arquivo .env para armazenar credenciais"
echo "2. Atualizar o código para usar variáveis de ambiente"
echo "3. Configurar o PM2 para carregar variáveis de ambiente"
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

# Extrair credenciais do arquivo
echo -e "${GREEN}Extraindo credenciais do arquivo...${NC}"
SUPABASE_PROJECT=$(grep -o "SUPABASE_PROJECT = '[^']*'" "$SERVER_JS" | cut -d "'" -f 2)
SUPABASE_SERVICE_KEY=$(grep -o "SUPABASE_SERVICE_KEY = '[^']*'" "$SERVER_JS" | cut -d "'" -f 2)

if [ -z "$SUPABASE_PROJECT" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${YELLOW}Não foi possível extrair automaticamente as credenciais.${NC}"
    read -p "Digite o SUPABASE_PROJECT: " SUPABASE_PROJECT
    read -p "Digite o SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
fi

# Criar arquivo .env
echo -e "${GREEN}Criando arquivo .env...${NC}"
cat > "$WHATSAPP_DIR/.env" << EOF
# Configurações do Supabase
SUPABASE_PROJECT=$SUPABASE_PROJECT
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# Configurações do servidor
PORT=3002
NODE_ENV=production

# Caminhos de arquivos
AUTH_DIR=auth_info
STORE_FILE=store.json
INSTANCES_FILE=instances.json

# Outras configurações
DEBUG=false
MAX_RECONNECT_ATTEMPTS=5
EOF

echo -e "${GREEN}Arquivo .env criado em $WHATSAPP_DIR/.env${NC}"

# Instalar dotenv se não estiver instalado
echo -e "${GREEN}Verificando/instalando dotenv...${NC}"
cd "$WHATSAPP_DIR"
npm list dotenv || npm install --save dotenv

# Modificar o arquivo do servidor para usar variáveis de ambiente
echo -e "${GREEN}Atualizando o código para usar variáveis de ambiente...${NC}"

# Criar script temporário para fazer as substituições
cat > /tmp/update_server.js << EOF
const fs = require('fs');

// Ler o arquivo
const filePath = '$SERVER_JS';
let content = fs.readFileSync(filePath, 'utf8');

// Adicionar require do dotenv no início
if (!content.includes('require(\'dotenv\')')) {
  content = "require('dotenv').config();\n" + content;
}

// Substituir SUPABASE_PROJECT
content = content.replace(
  /const SUPABASE_PROJECT = ['"][^'"]*['"];/,
  "const SUPABASE_PROJECT = process.env.SUPABASE_PROJECT;"
);

// Substituir SUPABASE_SERVICE_KEY
content = content.replace(
  /const SUPABASE_SERVICE_KEY = ['"][^'"]*['"];/,
  "const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;"
);

// Substituir PORT
content = content.replace(
  /const PORT = [0-9]+;/,
  "const PORT = process.env.PORT || 3002;"
);

// Substituir caminhos de arquivos
content = content.replace(
  /const AUTH_DIR = path\.join\(__dirname, ['"]auth_info['"]\);/,
  "const AUTH_DIR = path.join(__dirname, process.env.AUTH_DIR || 'auth_info');"
);

content = content.replace(
  /const STORE_FILE = path\.join\(__dirname, ['"]store\.json['"]\);/,
  "const STORE_FILE = path.join(__dirname, process.env.STORE_FILE || 'store.json');"
);

content = content.replace(
  /const INSTANCES_FILE = path\.join\(__dirname, ['"]instances\.json['"]\);/,
  "const INSTANCES_FILE = path.join(__dirname, process.env.INSTANCES_FILE || 'instances.json');"
);

// Escrever o arquivo atualizado
fs.writeFileSync(filePath, content);
console.log('Arquivo atualizado com sucesso!');
EOF

# Executar o script
node /tmp/update_server.js
rm /tmp/update_server.js

echo -e "${GREEN}Código atualizado para usar variáveis de ambiente.${NC}"

# Configurar PM2 para usar variáveis de ambiente
echo -e "${GREEN}Configurando PM2 para carregar variáveis de ambiente...${NC}"

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 não está instalado. Instalando...${NC}"
    npm install -g pm2
fi

# Criar arquivo de configuração do PM2
cat > "$WHATSAPP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: '$SERVER_JS',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env',
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 10
  }]
};
EOF

echo -e "${GREEN}Arquivo de configuração do PM2 criado em $WHATSAPP_DIR/ecosystem.config.js${NC}"

# Instruções para reiniciar o servidor
echo -e "${GREEN}=== Configuração de Variáveis de Ambiente Concluída! ===${NC}"
echo -e "${YELLOW}Para aplicar as alterações, reinicie o servidor com os seguintes comandos:${NC}"
echo -e "cd $WHATSAPP_DIR"
echo -e "pm2 stop all"
echo -e "pm2 delete all"
echo -e "pm2 start ecosystem.config.js"
echo -e ""
echo -e "${RED}IMPORTANTE: Verifique se o arquivo .env está correto antes de reiniciar o servidor.${NC}"
echo -e "${RED}Backup do arquivo original foi criado em caso de problemas.${NC}" 