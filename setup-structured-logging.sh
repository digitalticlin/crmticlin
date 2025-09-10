#!/bin/bash

# Script para implementar um sistema de logs estruturado para o servidor WhatsApp
# Usa Winston para logs estruturados e rotação de logs

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando Sistema de Logs Estruturado ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Instalar Winston para logs estruturados"
echo "2. Configurar rotação de logs"
echo "3. Implementar níveis de log (error, warn, info, debug)"
echo "4. Modificar o código para usar o novo sistema de logs"
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

# Instalar Winston e dependências
echo -e "${GREEN}Instalando Winston e dependências...${NC}"
cd "$WHATSAPP_DIR"
npm install --save winston winston-daily-rotate-file

# Criar diretório de logs
mkdir -p "$WHATSAPP_DIR/logs"
echo -e "${GREEN}Diretório de logs criado: $WHATSAPP_DIR/logs${NC}"

# Criar arquivo de configuração do logger
echo -e "${GREEN}Criando arquivo de configuração do logger...${NC}"
cat > "$WHATSAPP_DIR/logger.js" << 'EOF'
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de logs existe
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Definir formato dos logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Configurar rotação de logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'whatsapp-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // Manter logs por 14 dias
  maxSize: '20m',  // Tamanho máximo de cada arquivo
  zippedArchive: true,
  level: 'info'
});

// Configurar log de erros separado
const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d', // Manter logs de erro por 30 dias
  maxSize: '20m',
  zippedArchive: true,
  level: 'error'
});

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'whatsapp-server' },
  transports: [
    // Logs de console em desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `[${timestamp}] ${service} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    fileRotateTransport,
    errorRotateTransport
  ],
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true
    })
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Função auxiliar para compatibilidade com console.log
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Substituir funções do console
console.log = function() {
  logger.info.apply(logger, arguments);
  originalConsoleLog.apply(console, arguments);
};

console.error = function() {
  logger.error.apply(logger, arguments);
  originalConsoleError.apply(console, arguments);
};

console.warn = function() {
  logger.warn.apply(logger, arguments);
  originalConsoleWarn.apply(console, arguments);
};

console.info = function() {
  logger.info.apply(logger, arguments);
  originalConsoleInfo.apply(console, arguments);
};

// Exportar logger
module.exports = logger;
EOF

echo -e "${GREEN}Arquivo de configuração do logger criado em $WHATSAPP_DIR/logger.js${NC}"

# Modificar o arquivo do servidor para usar o logger
echo -e "${GREEN}Modificando o código para usar o sistema de logs estruturado...${NC}"

# Criar script temporário para modificar o código
cat > /tmp/update_logging.js << EOF
const fs = require('fs');

// Ler o arquivo
const filePath = '$SERVER_JS';
let content = fs.readFileSync(filePath, 'utf8');

// Adicionar require do logger no início
if (!content.includes('require(\'./logger\')')) {
  // Se já tem require do dotenv, adicionar após ele
  if (content.includes('require(\'dotenv\')')) {
    content = content.replace(
      /require\(['"]dotenv['"]\)\.config\(\);/,
      'require(\'dotenv\').config();\nconst logger = require(\'./logger\');'
    );
  } else {
    // Adicionar no início do arquivo
    content = 'const logger = require(\'./logger\');\n' + content;
  }
}

// Substituir console.log específicos para usar níveis de log apropriados
// Erros
content = content.replace(
  /console\.error\(['"]❌ Erro/g,
  'logger.error('
);

// Avisos
content = content.replace(
  /console\.log\(['"]⚠️/g,
  'logger.warn('
);

// Informações importantes
content = content.replace(
  /console\.log\(['"]🚀/g,
  'logger.info('
);

content = content.replace(
  /console\.log\(['"]✅/g,
  'logger.info('
);

// Escrever o arquivo atualizado
fs.writeFileSync(filePath, content);
console.log('Arquivo atualizado com sucesso para usar o sistema de logs estruturado!');
EOF

# Executar o script
node /tmp/update_logging.js
rm /tmp/update_logging.js

# Adicionar variável de ambiente para nível de log
if [ -f "$WHATSAPP_DIR/.env" ]; then
    echo -e "${GREEN}Adicionando variável de ambiente para nível de log...${NC}"
    if ! grep -q "LOG_LEVEL" "$WHATSAPP_DIR/.env"; then
        echo -e "\n# Nível de log (error, warn, info, debug)\nLOG_LEVEL=info" >> "$WHATSAPP_DIR/.env"
        echo "Variável LOG_LEVEL adicionada ao arquivo .env"
    else
        echo "Variável LOG_LEVEL já existe no arquivo .env"
    fi
else
    echo -e "${YELLOW}Arquivo .env não encontrado. Criando...${NC}"
    echo -e "# Nível de log (error, warn, info, debug)\nLOG_LEVEL=info" > "$WHATSAPP_DIR/.env"
    echo "Arquivo .env criado com variável LOG_LEVEL"
fi

# Instruções para reiniciar o servidor
echo -e "${GREEN}=== Configuração do Sistema de Logs Estruturado Concluída! ===${NC}"
echo -e "${YELLOW}Para aplicar as alterações, reinicie o servidor com:${NC}"
echo -e "cd $WHATSAPP_DIR"
echo -e "pm2 restart all"
echo -e ""
echo -e "${YELLOW}Os logs serão salvos em:${NC}"
echo -e "$WHATSAPP_DIR/logs/"
echo -e ""
echo -e "${YELLOW}Para visualizar os logs:${NC}"
echo -e "pm2 logs"
echo -e "ou"
echo -e "tail -f $WHATSAPP_DIR/logs/whatsapp-YYYY-MM-DD.log"
echo -e ""
echo -e "${RED}IMPORTANTE: Verifique se o sistema de logs está funcionando corretamente.${NC}"
echo -e "${RED}Em caso de problemas, você pode restaurar o backup do arquivo original.${NC}" 