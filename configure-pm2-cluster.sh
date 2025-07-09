#!/bin/bash

# Script para configurar o PM2 em modo cluster para o servidor WhatsApp
# Aproveita múltiplos cores da CPU para melhor performance

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando PM2 em Modo Cluster ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Verificar/instalar PM2"
echo "2. Configurar PM2 em modo cluster"
echo "3. Configurar monitoramento básico"
echo "4. Configurar reinício automático"
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

# Verificar/instalar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}Instalando PM2...${NC}"
    npm install -g pm2
else
    echo -e "${YELLOW}PM2 já está instalado. Verificando versão...${NC}"
    pm2 --version
fi

# Determinar número de instâncias baseado nos cores da CPU
NUM_CORES=$(nproc)
if [ $NUM_CORES -gt 1 ]; then
    # Usar N-1 cores para deixar um livre para o sistema
    NUM_INSTANCES=$((NUM_CORES - 1))
else
    NUM_INSTANCES=1
fi

echo -e "${GREEN}Detectados $NUM_CORES cores. Configurando para usar $NUM_INSTANCES instâncias.${NC}"

# Criar arquivo de configuração do PM2 em modo cluster
echo -e "${GREEN}Criando configuração do PM2 em modo cluster...${NC}"

# Verificar se já existe um arquivo .env
ENV_FILE="$WHATSAPP_DIR/.env"
USE_ENV_FILE=false

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Arquivo .env encontrado. Será usado para variáveis de ambiente.${NC}"
    USE_ENV_FILE=true
fi

# Criar arquivo de configuração do PM2
cat > "$WHATSAPP_DIR/ecosystem.cluster.js" << EOF
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: '$(basename $SERVER_JS)',
    instances: $NUM_INSTANCES,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    $(if [ "$USE_ENV_FILE" = true ]; then echo "env_file: '.env',"; fi)
    env: {
      NODE_ENV: 'production',
    },
    exp_backoff_restart_delay: 100,
    restart_delay: 3000,
    max_restarts: 10,
    kill_timeout: 5000,
    listen_timeout: 8000,
    wait_ready: true,
    autorestart: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    time: true
  }]
};
EOF

echo -e "${GREEN}Arquivo de configuração do PM2 criado em $WHATSAPP_DIR/ecosystem.cluster.js${NC}"

# Criar diretório de logs
mkdir -p "$WHATSAPP_DIR/logs"
echo -e "${GREEN}Diretório de logs criado: $WHATSAPP_DIR/logs${NC}"

# Verificar se é necessário modificar o código para suportar cluster mode
echo -e "${YELLOW}Verificando se o código precisa ser modificado para suportar cluster mode...${NC}"

# Criar script para verificar e modificar o código
cat > /tmp/check_cluster_support.js << EOF
const fs = require('fs');
const filePath = '$SERVER_JS';
const content = fs.readFileSync(filePath, 'utf8');

// Verificar se já tem suporte a cluster
if (content.includes('process.send') && content.includes('ready')) {
  console.log('O código já tem suporte a cluster mode.');
  process.exit(0);
}

// Adicionar suporte a cluster mode
let modifiedContent = content;

// Adicionar signal ready para PM2
if (!modifiedContent.includes('process.send')) {
  const serverListenRegex = /app\.listen\(PORT,\s*['"]?0\.0\.0\.0['"]?,\s*\(\)\s*=>\s*{/;
  if (serverListenRegex.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(
      serverListenRegex,
      'app.listen(PORT, \'0.0.0.0\', () => {\n  // Sinalizar para o PM2 que o servidor está pronto\n  if (process.send) {\n    process.send(\'ready\');\n  }\n'
    );
    console.log('Adicionado suporte a cluster mode.');
    fs.writeFileSync(filePath, modifiedContent);
  } else {
    console.log('Não foi possível encontrar o ponto para adicionar suporte a cluster mode.');
    console.log('Você precisará modificar o código manualmente.');
  }
} else {
  console.log('O código já tem algum tipo de suporte a IPC.');
}
EOF

# Executar o script
node /tmp/check_cluster_support.js
rm /tmp/check_cluster_support.js

# Instruções para iniciar o PM2 em modo cluster
echo -e "${GREEN}=== Configuração do PM2 em Modo Cluster Concluída! ===${NC}"
echo -e "${YELLOW}Para iniciar o servidor em modo cluster, execute:${NC}"
echo -e "cd $WHATSAPP_DIR"
echo -e "pm2 stop all"
echo -e "pm2 delete all"
echo -e "pm2 start ecosystem.cluster.js"
echo -e ""
echo -e "${YELLOW}Para verificar o status:${NC}"
echo -e "pm2 status"
echo -e "pm2 logs"
echo -e ""
echo -e "${RED}IMPORTANTE: Teste cuidadosamente após a migração para modo cluster.${NC}"
echo -e "${RED}Em caso de problemas, você pode voltar ao modo fork com:${NC}"
echo -e "pm2 stop all && pm2 delete all && pm2 start $SERVER_JS" 