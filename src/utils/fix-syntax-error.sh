
#!/bin/bash

# Script para corrigir erro de sintaxe nos template literals
echo "🔧 CORREÇÃO RÁPIDA - Erro de Sintaxe"
echo "===================================="

echo "🛠️ Corrigindo template literals no arquivo..."

# Substituir template literals problemáticos por concatenação normal
sed -i 's/`✅ QR Code salvo no Supabase: ${instanceId}`/"✅ QR Code salvo no Supabase: " + instanceId/g' vps-server-persistent.js
sed -i 's/`❌ DEFINITIVO: Inicializando ${instance.instanceId} (${retryCount + 1}\/${maxRetries + 1})`/"🚀 DEFINITIVO: Inicializando " + instance.instanceId + " (" + (retryCount + 1) + "\/" + (maxRetries + 1) + ")"/g' vps-server-persistent.js
sed -i 's/`⏰ TIMEOUT: ${instance.instanceId} após 60s`/"⏰ TIMEOUT: " + instance.instanceId + " após 60s"/g' vps-server-persistent.js
sed -i 's/`📱 QR DEFINITIVO gerado: ${instance.instanceId}`/"📱 QR DEFINITIVO gerado: " + instance.instanceId/g' vps-server-persistent.js
sed -i 's/`✅ DEFINITIVO: Cliente pronto: ${instance.instanceId}`/"✅ DEFINITIVO: Cliente pronto: " + instance.instanceId/g' vps-server-persistent.js
sed -i 's/`🔐 DEFINITIVO: Autenticado: ${instance.instanceId}`/"🔐 DEFINITIVO: Autenticado: " + instance.instanceId/g' vps-server-persistent.js
sed -i 's/`❌ DEFINITIVO: Falha auth: ${instance.instanceId}`/"❌ DEFINITIVO: Falha auth: " + instance.instanceId/g' vps-server-persistent.js
sed -i 's/`🔌 DEFINITIVO: Desconectado: ${instance.instanceId} - ${reason}`/"🔌 DEFINITIVO: Desconectado: " + instance.instanceId + " - " + reason/g' vps-server-persistent.js
sed -i 's/`❌ DEFINITIVO: Erro init: ${instance.instanceId}`/"❌ DEFINITIVO: Erro init: " + instance.instanceId/g' vps-server-persistent.js
sed -i 's/`🔄 DEFINITIVO: Retry ${retryCount + 1}\/${maxRetries} em 20s...`/"🔄 DEFINITIVO: Retry " + (retryCount + 1) + "\/" + maxRetries + " em 20s..."/g' vps-server-persistent.js

# Corrigir user-data-dir também
sed -i 's/`--user-data-dir=\/tmp\/chrome-user-data-${instance.instanceId}-${Date.now()}`/"--user-data-dir=\/tmp\/chrome-user-data-" + instance.instanceId + "-" + Date.now()/g' vps-server-persistent.js
sed -i 's/`\/tmp\/chrome-user-data-${instance.instanceId}-${Date.now()}`/"\/tmp\/chrome-user-data-" + instance.instanceId + "-" + Date.now()/g' vps-server-persistent.js

echo "🔍 Verificando sintaxe após correção..."
if node -c vps-server-persistent.js; then
    echo "✅ Sintaxe corrigida com sucesso!"
    
    echo "🚀 Reiniciando servidor..."
    PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002 --time
    
    echo "⏳ Aguardando 10s..."
    sleep 10
    
    echo "🧪 Executando testes..."
    ./teste-pos-correcoes.sh
    
else
    echo "❌ Ainda há erros de sintaxe"
    echo "📋 Detalhes do erro:"
    node -c vps-server-persistent.js
fi
