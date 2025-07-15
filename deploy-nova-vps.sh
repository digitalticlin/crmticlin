#!/bin/bash

# 🚀 SCRIPT DE DEPLOY COMPLETO - NOVA VPS BAILEYS SERVER
# IP: 31.97.163.57 | Porta: 3001

echo "🎯 DEPLOY COMPLETO NA NOVA VPS"
echo "==============================="
echo "VPS: 31.97.163.57:3001"
echo ""

# 1. Preparação do sistema
echo "🔧 ETAPA 1: PREPARAÇÃO DO SISTEMA"
echo "=================================="

echo "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

echo "Instalando dependências básicas..."
sudo apt install -y curl wget git build-essential software-properties-common ca-certificates

# 2. Instalar Node.js 20.x LTS
echo ""
echo "🌐 ETAPA 2: INSTALANDO NODE.JS 20.x LTS"
echo "========================================"

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Versões instaladas:"
node --version
npm --version

# 3. Instalar PM2
echo ""
echo "⚡ ETAPA 3: INSTALANDO PM2"
echo "=========================="

sudo npm install -g pm2
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 4. Criar diretório do projeto
echo ""
echo "📁 ETAPA 4: CRIANDO ESTRUTURA DO PROJETO"
echo "========================================"

mkdir -p /root/whatsapp-server
cd /root/whatsapp-server

# 5. Criar package.json
echo ""
echo "📦 ETAPA 5: CRIANDO PACKAGE.JSON"
echo "================================"

cat > package.json << 'EOF'
{
  "name": "whatsapp-server",
  "version": "1.0.0",
  "description": "Servidor WhatsApp VPS - Baileys Oficial (Mais Recente)",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop whatsapp-server",
    "pm2:restart": "pm2 restart whatsapp-server",
    "pm2:logs": "pm2 logs whatsapp-server",
    "pm2:monit": "pm2 monit",
    "test": "node test-server.js"
  },
  "keywords": ["whatsapp", "baileys", "api", "server", "vps"],
  "author": "TicLin System",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "dependencies": {
    "baileys": "^6.7.18",
    "express": "^4.21.2",
    "axios": "^1.10.0",
    "cors": "^2.8.5",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0",
    "uuid": "^10.0.0",
    "sharp": "^0.33.5",
    "node-fetch": "^3.3.2",
    "form-data": "^4.0.1",
    "mime-types": "^2.1.35",
    "crypto": "^1.0.1",
    "fs-extra": "^11.2.0",
    "path": "^0.12.7",
    "util": "^0.12.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
EOF

echo "✅ Package.json criado"

# 6. Instalar dependências
echo ""
echo "📥 ETAPA 6: INSTALANDO DEPENDÊNCIAS"
echo "==================================="

npm install

echo "✅ Dependências instaladas"

# 7. Criar ecosystem.config.js para PM2
echo ""
echo "⚙️ ETAPA 7: CONFIGURANDO PM2"
echo "============================="

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

mkdir -p logs
echo "✅ Configuração PM2 criada"

# 8. Instruções finais
echo ""
echo "📋 ETAPA 8: PRÓXIMOS PASSOS"
echo "============================"

echo "🎯 DEPLOY PREPARADO COM SUCESSO!"
echo ""
echo "📂 Estrutura criada em: /root/whatsapp-server"
echo "📦 Dependências instaladas"
echo "⚙️ PM2 configurado"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "   1. Copiar os arquivos do servidor:"
echo "      - server.js"
echo "      - connection-manager.js"
echo "      - webhook-manager.js"
echo "      - diagnostics-manager.js"
echo "      - import-manager-robust.js"
echo ""
echo "   2. Iniciar o servidor:"
echo "      cd /root/whatsapp-server"
echo "      npm run pm2:start"
echo ""
echo "   3. Verificar status:"
echo "      pm2 status"
echo "      pm2 logs whatsapp-server"
echo ""
echo "   4. Testar endpoints:"
echo "      curl http://31.97.163.57:3001/health"
echo ""
echo "✅ DEPLOY PREPARADO!" 