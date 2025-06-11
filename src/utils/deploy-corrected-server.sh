
#!/bin/bash

# Script de Deploy do Servidor WhatsApp CORRIGIDO
echo "🚀 Iniciando deploy do servidor WhatsApp CORRIGIDO..."

# Definir variáveis
SERVER_DIR="/root/whatsapp-server"
BACKUP_DIR="/root/whatsapp-server-backup-$(date +%Y%m%d_%H%M%S)"

# Parar PM2 atual
echo "🛑 Parando PM2 atual..."
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Fazer backup se existir
if [ -d "$SERVER_DIR" ]; then
    echo "📦 Fazendo backup do servidor atual..."
    mv "$SERVER_DIR" "$BACKUP_DIR"
    echo "✅ Backup salvo em: $BACKUP_DIR"
fi

# Criar diretório
echo "📂 Criando diretório do servidor..."
mkdir -p "$SERVER_DIR"
cd "$SERVER_DIR"

# Copiar arquivos corrigidos
echo "📋 Copiando arquivos corrigidos..."
cp /path/to/whatsapp-server-corrected.js ./server.js
cp /path/to/pm2-ecosystem-corrected.config.js ./ecosystem.config.js
cp /path/to/package-whatsapp-corrected.json ./package.json

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p logs
mkdir -p .wwebjs_auth

# Definir permissões
echo "🔐 Configurando permissões..."
chown -R root:root "$SERVER_DIR"
chmod +x server.js

# Instalar dependências do sistema se necessário
echo "🔧 Verificando dependências do sistema..."
apt-get update -y
apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0t64 \
    libdrm2 \
    libxkbcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2t64

# Testar servidor
echo "🧪 Testando servidor..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Servidor iniciou corretamente"
    kill $SERVER_PID
else
    echo "❌ Erro ao iniciar servidor"
    exit 1
fi

# Iniciar com PM2
echo "🚀 Iniciando com PM2..."
pm2 start ecosystem.config.js

# Verificar status
echo "📊 Verificando status..."
sleep 5
pm2 status

# Testar endpoints
echo "🧪 Testando endpoints..."
curl -s http://localhost:3002/health | jq . || echo "❌ Endpoint health falhou"

echo "✅ Deploy do servidor WhatsApp CORRIGIDO concluído!"
echo "🎯 Para monitorar: pm2 monit"
echo "📝 Para logs: pm2 logs whatsapp-server"
echo "🔄 Para restart: pm2 restart whatsapp-server"
