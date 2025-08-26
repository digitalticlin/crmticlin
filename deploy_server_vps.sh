#!/bin/bash

# 🚀 Script para deploy do server.js na VPS
# Execute na VPS: bash deploy_server_vps.sh

echo "🔄 DEPLOY SERVER.JS - VPS WhatsApp"
echo "================================="

# 1. Backup do servidor atual
echo "📦 Fazendo backup do server.js atual..."
cp /root/whatsapp-server/server.js /root/whatsapp-server/server.js.backup-$(date +%Y%m%d_%H%M%S)

# 2. Parar PM2 (sem erro se não estiver rodando)
echo "⏹️ Parando instâncias PM2..."
pm2 stop whatsapp-server 2>/dev/null || echo "PM2 não estava rodando"

# 3. Aplicar novo server.js (cole o conteúdo via nano)
echo "📝 AGORA cole o novo server.js via nano:"
echo "nano /root/whatsapp-server/server.js"
echo ""
echo "⚠️ LEMBRE-SE: Verificar se .env tem todas as variáveis:"
echo "   PORT=3001"
echo "   SERVER_HOST=31.97.163.57" 
echo "   SUPABASE_PROJECT_ID=rhjgagzstjzynvrakdyj"
echo "   AUTH_DIR=/root/whatsapp-server/auth_info"
echo ""

# 4. Validar sintaxe
echo "🔍 Validando sintaxe do Node.js..."
node -c /root/whatsapp-server/server.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe OK!"
else
    echo "❌ ERRO de sintaxe! Restaurando backup..."
    cp /root/whatsapp-server/server.js.backup-* /root/whatsapp-server/server.js
    exit 1
fi

# 5. Reiniciar PM2
echo "🚀 Reiniciando servidor via PM2..."
cd /root/whatsapp-server
pm2 start ecosystem.config.js --env production

# 6. Verificar status
echo "📊 Status final:"
pm2 status
pm2 logs whatsapp-server --lines 20

echo "✅ Deploy concluído!"
echo "🔗 Servidor disponível em: http://31.97.163.57:3001"