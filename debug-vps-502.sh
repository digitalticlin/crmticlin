#!/bin/bash

# 🔍 DIAGNÓSTICO VPS - ERRO 502 BAD GATEWAY
# Execute este script na VPS para diagnosticar o problema

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"
VPS_PATH="/var/www"

echo "🚨 DIAGNÓSTICO VPS - ERRO 502 BAD GATEWAY"
echo "=========================================="
echo ""

echo "📊 1. VERIFICANDO STATUS DOS PROCESSOS"
echo "======================================"
ssh $VPS_SERVER "
echo '🔍 Processos PM2:'
pm2 status

echo ''
echo '🔍 Processos Node.js rodando:'
ps aux | grep node | grep -v grep

echo ''
echo '🔍 Portas em uso:'
netstat -tulpn | grep :3001
"

echo ""
echo "📊 2. VERIFICANDO LOGS DE ERRO"
echo "=============================="
ssh $VPS_SERVER "
echo '🔍 Logs PM2 whatsapp-server:'
pm2 logs whatsapp-server --lines 20 --nostream

echo ''
echo '🔍 Logs do sistema:'
tail -20 /var/log/syslog | grep -i error || echo 'Sem erros no syslog'
"

echo ""
echo "📊 3. TESTANDO CONECTIVIDADE LOCAL"
echo "=================================="
ssh $VPS_SERVER "
echo '🌐 Teste curl local - Health:'
curl -s http://localhost:3001/health | head -10 || echo '❌ Falha no health check'

echo ''
echo '🌐 Teste curl local - Queue Status:'
curl -s http://localhost:3001/queue-status | head -5 || echo '❌ Falha no queue status'

echo ''
echo '🌐 Teste netcat porta 3001:'
nc -zv localhost 3001 && echo '✅ Porta 3001 acessível' || echo '❌ Porta 3001 inacessível'
"

echo ""
echo "📊 4. VERIFICANDO ARQUIVOS E CONFIGURAÇÕES"
echo "==========================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📁 Estrutura de arquivos:'
ls -la src/utils/ | grep -E 'server\.js|connection-manager\.js'

echo ''
echo '🔍 Último servidor iniciado:'
pm2 describe whatsapp-server | grep -E 'status|restart|uptime|memory'

echo ''
echo '🔧 Versão Node.js:'
node --version

echo ''
echo '💾 Uso de memória:'
free -h

echo ''
echo '💽 Uso de disco:'
df -h | head -5
"

echo ""
echo "📊 5. TESTE DE ENDPOINT ESPECÍFICO"
echo "=================================="
ssh $VPS_SERVER "
echo '🎯 Testando endpoint queue/add-message (sem auth):'
curl -s -X POST http://localhost:3001/queue/add-message \
  -H 'Content-Type: application/json' \
  -d '{\"test\": \"true\"}' | head -10 || echo '❌ Endpoint não responde'

echo ''
echo '🔒 Testando com autorização (se VPS_API_TOKEN estiver definido):'
if [ ! -z \"\$VPS_API_TOKEN\" ]; then
  curl -s -X POST http://localhost:3001/queue/add-message \
    -H 'Content-Type: application/json' \
    -H \"Authorization: Bearer \$VPS_API_TOKEN\" \
    -d '{\"instanceId\": \"test\", \"phone\": \"5562999999999\", \"message\": \"test\"}' | head -10
else
  echo 'VPS_API_TOKEN não definido - pulando teste com auth'
fi
"

echo ""
echo "📋 6. DIAGNÓSTICO CONCLUÍDO"
echo "============================"
echo "✅ Execute este script e analise os resultados"
echo "🔧 Ações comuns para resolver 502:"
echo "   1. pm2 restart whatsapp-server"
echo "   2. pm2 reload whatsapp-server" 
echo "   3. Verificar logs para erros específicos"
echo "   4. Reiniciar nginx se estiver usando proxy"
echo ""