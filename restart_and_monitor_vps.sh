#!/bin/bash

# 🚀 SCRIPT COMPLETO: Restart + Monitor VPS WhatsApp Server
# Execute na VPS: bash restart_and_monitor_vps.sh

echo "🔄 RESTART E MONITORAMENTO COMPLETO - VPS WhatsApp Server"
echo "=========================================================="

# 1. Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não encontrado! Instalando..."
    npm install -g pm2
fi

# 2. Navegar para diretório do servidor
cd /root/whatsapp-server || {
    echo "❌ Diretório /root/whatsapp-server não encontrado!"
    exit 1
}

echo "📍 Diretório atual: $(pwd)"

# 3. Verificar se .env existe e tem as variáveis necessárias
echo "🔍 Verificando arquivo .env..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    echo "📋 Variáveis configuradas:"
    grep -E "^(PORT|SERVER_HOST|SUPABASE_PROJECT_ID|AUTH_DIR)" .env || echo "⚠️ Algumas variáveis podem estar ausentes"
else
    echo "❌ Arquivo .env não encontrado!"
    echo "Criando .env básico..."
    cat > .env << EOF
PORT=3001
SERVER_HOST=31.97.163.57
SUPABASE_PROJECT_ID=rhjgagzstjzynvrakdyj
AUTH_DIR=/root/whatsapp-server/auth_info
EOF
fi

# 4. Validar sintaxe do server.js
echo "🔍 Validando sintaxe do server.js..."
node -c server.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do server.js OK!"
else
    echo "❌ ERRO de sintaxe no server.js!"
    exit 1
fi

# 5. Parar todas as instâncias PM2
echo "⏹️ Parando todas as instâncias PM2..."
pm2 stop all
pm2 delete all

# 6. Limpar logs antigos
echo "🧹 Limpando logs antigos..."
pm2 flush

# 7. Iniciar servidor com PM2
echo "🚀 Iniciando servidor via PM2..."
pm2 start server.js --name "whatsapp-server" --env production --max-memory-restart 1000M

# 8. Salvar configuração PM2
echo "💾 Salvando configuração PM2..."
pm2 save
pm2 startup

# 9. Aguardar 5 segundos para inicialização
echo "⏳ Aguardando inicialização (5s)..."
sleep 5

# 10. Verificar status detalhado
echo "📊 STATUS DETALHADO DO SERVIDOR:"
echo "================================"
pm2 status
echo ""

# 11. Verificar se porta está aberta
echo "🔌 VERIFICANDO PORTA 3001..."
netstat -tlnp | grep :3001 || echo "⚠️ Porta 3001 não está aberta"

# 12. Teste de conectividade
echo "🌐 TESTE DE CONECTIVIDADE..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3001/health || echo "❌ Endpoint /health não respondeu"

# 13. Verificar logs em tempo real (últimas 20 linhas)
echo "📋 LOGS ATUAIS (últimas 20 linhas):"
echo "==================================="
pm2 logs whatsapp-server --lines 20 --nostream

# 14. Verificar instâncias WhatsApp ativas
echo "📱 VERIFICANDO INSTÂNCIAS WHATSAPP..."
ls -la /root/whatsapp-server/auth_info/ | wc -l
echo "Total de pastas de autenticação: $(ls -la /root/whatsapp-server/auth_info/ | wc -l)"

# 15. Verificar uso de memória e CPU
echo "💻 USO DE RECURSOS:"
echo "=================="
free -h
echo ""
ps aux | grep node | grep -v grep

# 16. Monitoramento contínuo (opcional)
echo ""
echo "🔍 COMANDOS ÚTEIS PARA MONITORAMENTO CONTÍNUO:"
echo "=============================================="
echo "📊 Status:           pm2 status"
echo "📋 Logs live:        pm2 logs whatsapp-server"
echo "🔄 Restart:          pm2 restart whatsapp-server"
echo "⏹️ Parar:            pm2 stop whatsapp-server"
echo "🗑️ Deletar:          pm2 delete whatsapp-server"
echo "📈 Monitor:          pm2 monit"
echo "🔍 Instâncias:       curl http://localhost:3001/instances"
echo ""

# 17. Verificação final de crashes
echo "🚨 VERIFICAÇÃO DE CRASHES (últimos 10 eventos):"
echo "==============================================="
pm2 logs whatsapp-server --lines 10 --nostream | grep -i "error\|crash\|exception\|fatal" || echo "✅ Nenhum crash detectado nos logs recentes"

echo ""
echo "✅ RESTART E VERIFICAÇÃO CONCLUÍDOS!"
echo "🔗 Servidor disponível em: http://31.97.163.57:3001"
echo "📊 Use 'pm2 monit' para monitoramento em tempo real"