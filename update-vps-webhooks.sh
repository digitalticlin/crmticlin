#!/bin/bash

# Script para atualizar webhooks no servidor VPS
# Baseado no arquivo server-corrigido-final.js

VPS_IP="31.97.163.57"
SERVER_PATH="/root/whatsapp-server/server.js"
BACKUP_PATH="/root/whatsapp-server/server.js.backup"

echo "🔧 Atualizando webhooks no servidor VPS..."

# Fazer backup do arquivo atual
ssh root@$VPS_IP "cp $SERVER_PATH $BACKUP_PATH"
echo "✅ Backup criado em $BACKUP_PATH"

# Aplicar as correções de webhook
ssh root@$VPS_IP "sed -i '
/const WEBHOOKS = {/,/};/c\
const WEBHOOKS = {\
    QR_RECEIVER: process.env.QR_RECEIVER_WEBHOOK || '\''https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver'\'',\
    CONNECTION_SYNC: process.env.CONNECTION_SYNC_WEBHOOK || '\''https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/auto_whatsapp_sync'\'',\
    BACKEND_MESSAGES: process.env.BACKEND_MESSAGES_WEBHOOK || '\''https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web'\'',\
    N8N_MESSAGES: process.env.N8N_MESSAGES_WEBHOOK || '\''https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral'\''\
};
' $SERVER_PATH"

echo "✅ Webhooks atualizados!"

# Verificar as mudanças
echo "🔍 Verificando configurações atualizadas:"
ssh root@$VPS_IP "grep -A 6 'const WEBHOOKS' $SERVER_PATH"

# Reiniciar o servidor PM2
echo "🔄 Reiniciando servidor PM2..."
ssh root@$VPS_IP "cd /root/whatsapp-server && pm2 restart whatsapp-server"

echo "✅ Servidor reiniciado com novos webhooks!"

# Verificar status
ssh root@$VPS_IP "pm2 status whatsapp-server"

echo "🎉 Atualização de webhooks concluída!"
echo "📝 Backup salvo em: $BACKUP_PATH" 