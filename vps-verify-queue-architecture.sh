#!/bin/bash

# 🔍 VERIFICAÇÃO DA ARQUITETURA FORK + QUEUES
echo "🔍 VERIFICAÇÃO DA ARQUITETURA FORK + QUEUES"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📊 1. STATUS DO PM2 E ARQUITETURA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Status PM2:'
pm2 status

echo ''
echo '🔍 Verificando modo FORK:'
pm2 list | grep -i fork && echo '✅ FORK mode ativo' || echo '❌ FORK mode não encontrado'

echo ''
echo '📊 Detalhes dos processos:'
pm2 show whatsapp-server 2>/dev/null | grep -E 'mode|exec_mode|instances' || echo 'ℹ️ Detalhes não disponíveis'
"

echo ""
echo "🏗️ 2. VERIFICAÇÃO DE REDIS E QUEUES"
echo "================================================="
ssh $VPS_SERVER "
echo '🔍 Verificando Redis:'
redis-cli ping 2>/dev/null && echo '✅ Redis funcionando' || echo '❌ Redis não está rodando'

echo ''
echo '📦 Verificando instalação do Redis:'
which redis-server && echo '✅ Redis server instalado' || echo '❌ Redis server não instalado'

echo ''
echo '🔧 Status do serviço Redis:'
systemctl is-active redis-server 2>/dev/null && echo '✅ Redis service ativo' || echo 'ℹ️ Redis service status indisponível'
"

echo ""
echo "📋 3. VERIFICAÇÃO DOS ENDPOINTS DE QUEUE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Testando endpoint de queue status:'
curl -s http://localhost:3001/queue-status | head -10 2>/dev/null || echo '❌ Endpoint /queue-status não responde'

echo ''
echo '🧪 Testando health check:'
curl -s http://localhost:3001/health | grep -E 'queue|redis|worker' || echo 'ℹ️ Sem informações de queue no health check'

echo ''
echo '📊 Testando status geral:'
curl -s http://localhost:3001/status | grep -E 'queue|redis|worker' || echo 'ℹ️ Sem informações de queue no status'
"

echo ""
echo "📂 4. ESTRUTURA DE ARQUIVOS DO PROJETO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📁 Estrutura de arquivos:'
ls -la

echo ''
echo '🔍 Verificando arquivos de configuração:'
echo '  package.json:' \$([ -f package.json ] && echo '✅' || echo '❌')
echo '  ecosystem.config.js:' \$([ -f ecosystem.config.js ] && echo '✅' || echo '❌')
echo '  server.js:' \$([ -f server.js ] && echo '✅' || echo '❌')

echo ''
echo '📦 Verificando dependências de queue:'
if [ -f package.json ]; then
    echo '🔍 Dependências relacionadas a queues:'
    grep -E '\"bull\"|\"redis\"|\"queue\"' package.json || echo 'ℹ️ Nenhuma dependência de queue encontrada'
else
    echo '❌ package.json não encontrado'
fi
"

echo ""
echo "🔧 5. VERIFICAÇÃO DOS WORKERS NO CÓDIGO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando conteúdo do server.js:'
if [ -f server.js ]; then
    echo '📋 Procurando por implementações de queue:'
    grep -n -E 'queue|Queue|redis|Redis|bull|Bull|worker|Worker' server.js | head -10 || echo 'ℹ️ Nenhuma referência de queue encontrada no server.js'
else
    echo '❌ server.js não encontrado'
fi

echo ''
echo '🔍 Verificando diretórios de workers:'
ls -la src/ 2>/dev/null || echo 'ℹ️ Diretório src/ não encontrado'
find . -name '*worker*' -o -name '*queue*' 2>/dev/null || echo 'ℹ️ Nenhum arquivo de worker/queue encontrado'
"

echo ""
echo "⚡ 6. TESTE DE FUNCIONALIDADE DAS QUEUES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Testando criação de instância (deve usar queues):'
curl -s -X POST http://localhost:3001/instance/create -H 'Content-Type: application/json' -d '{\"instanceId\":\"test-queue\"}' | head -5 || echo '❌ Falha no teste de instância'

echo ''
echo '📊 Verificando se há logs de queue nos últimos logs:'
pm2 logs whatsapp-server --lines 20 --nostream | grep -i -E 'queue|redis|worker|bull' | tail -5 || echo 'ℹ️ Nenhum log de queue recente'
"

echo ""
echo "📊 7. RELATÓRIO DA ARQUITETURA ATUAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 RESUMO DA VERIFICAÇÃO:'
echo ''

# Verificar se é FORK
PM2_MODE=\$(pm2 list | grep whatsapp-server | awk '{print \$4}' | head -1)
echo \"🔧 Modo PM2: \$PM2_MODE\"

# Verificar Redis
REDIS_STATUS=\$(redis-cli ping 2>/dev/null && echo 'OK' || echo 'FALHA')
echo \"📦 Redis: \$REDIS_STATUS\"

# Verificar endpoints
HEALTH_STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
echo \"🌐 Servidor: \$HEALTH_STATUS\"

# Verificar queues no código
QUEUE_CODE=\$(grep -q -E 'queue|Queue|redis|Redis|bull|Bull' server.js 2>/dev/null && echo 'ENCONTRADO' || echo 'NÃO ENCONTRADO')
echo \"💻 Código de Queue: \$QUEUE_CODE\"

echo ''
echo '🎯 STATUS DA ARQUITETURA:'
if [ \"\$PM2_MODE\" = \"fork\" ] && [ \"\$REDIS_STATUS\" = \"OK\" ] && [ \"\$QUEUE_CODE\" = \"ENCONTRADO\" ]; then
    echo '✅ ARQUITETURA FORK + QUEUES IMPLEMENTADA!'
elif [ \"\$PM2_MODE\" = \"fork\" ] && [ \"\$HEALTH_STATUS\" = \"OK\" ]; then
    echo '⚠️ FORK MODE OK, MAS QUEUES PRECISAM SER IMPLEMENTADAS'
else
    echo '❌ ARQUITETURA PRECISA SER CORRIGIDA'
fi
"

echo ""
echo "✅ VERIFICAÇÃO CONCLUÍDA!"
echo "================================================="
echo "🔍 Analise o relatório acima"
echo "📊 Se queues não estiverem implementadas, posso criar a estrutura"