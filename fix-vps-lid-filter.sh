#!/bin/bash

# 🔧 SCRIPT PARA CORRIGIR FILTRO @lid NA VPS

echo "🚀 Corrigindo filtro @lid na VPS..."

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# Verificar conexão VPS
echo "📡 Verificando conexão com VPS..."
ssh -o ConnectTimeout=10 $VPS_SERVER "echo 'Conexão OK'" || {
    echo "❌ Erro: Não foi possível conectar na VPS"
    exit 1
}

# Fazer backup do servidor atual
echo "💾 Fazendo backup do servidor atual..."
ssh $VPS_SERVER "cd $VPS_PATH && cp server.js server_backup_$(date +%Y%m%d_%H%M%S).js"

# Enviar arquivo corrigido
echo "📤 Enviando arquivo server.js corrigido..."
scp src/utils/server.js $VPS_SERVER:$VPS_PATH/server_new.js
scp src/utils/connection-manager.js $VPS_SERVER:$VPS_PATH/src/utils/connection-manager.js

# Verificar se os arquivos foram enviados
echo "🔍 Verificando arquivos enviados..."
ssh $VPS_SERVER "cd $VPS_PATH && ls -la server_new.js src/utils/connection-manager.js"

# Parar servidor atual
echo "⏹️ Parando servidor atual..."
ssh $VPS_SERVER "cd $VPS_PATH && pm2 stop server || killall node || true"

# Substituir arquivo
echo "🔄 Substituindo arquivo do servidor..."
ssh $VPS_SERVER "cd $VPS_PATH && mv server_new.js server.js"

# Verificar se tem o filtro @lid
echo "✅ Verificando se filtro @lid foi aplicado..."
ssh $VPS_SERVER "cd $VPS_PATH && grep -n '@lid' src/utils/connection-manager.js" || {
    echo "❌ ERRO: Filtro @lid não encontrado no connection-manager!"
    exit 1
}

# Reiniciar servidor
echo "🚀 Reiniciando servidor..."
ssh $VPS_SERVER "cd $VPS_PATH && pm2 start server.js || nohup node server.js > server.log 2>&1 &"

# Aguardar alguns segundos
sleep 5

# Verificar se servidor está rodando
echo "🏥 Verificando saúde do servidor..."
ssh $VPS_SERVER "cd $VPS_PATH && curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo 'Servidor não responde ainda...'"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Aguarde alguns minutos para o servidor inicializar"
echo "2. Teste enviando uma mensagem para verificar se não gera mais @lid"
echo "3. Execute a limpeza dos leads corrompidos no Supabase:"
echo ""
echo "   DELETE FROM leads WHERE phone LIKE '%@lid%';"
echo ""
echo "4. Monitore os logs: ssh $VPS_SERVER 'cd $VPS_PATH && tail -f server.log'"
echo ""

# Executar limpeza dos leads @lid no final
echo "🧹 IMPORTANTE: Execute no Supabase para limpar dados corrompidos:"
echo ""
echo "-- Limpar leads com @lid"
echo "DELETE FROM leads WHERE phone LIKE '%@lid%';"
echo ""
echo "-- Verificar se ainda existem"  
echo "SELECT COUNT(*) FROM leads WHERE phone LIKE '%@lid%';"