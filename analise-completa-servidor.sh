#!/bin/bash

# 🔍 ANÁLISE COMPLETA DO SERVIDOR WHATSAPP
echo "🔍 ANÁLISE COMPLETA DO SERVIDOR WHATSAPP"
echo "Verificação detalhada: Status, Crashes, Memória, Instâncias, Logs"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "📄 1. ANÁLISE DO CÓDIGO SERVER.JS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📄 Estrutura do server.js:'
echo '🔍 Total de linhas:'
wc -l server.js

echo ''
echo '🔍 Endpoints encontrados:'
grep -n 'app\\.get\\|app\\.post\\|app\\.put\\|app\\.delete' server.js

echo ''
echo '🔍 Verificando endpoints /health duplicados:'
grep -n -A2 -B2 '/health' server.js

echo ''
echo '🔍 Verificando inicialização do ConnectionManager:'
grep -n -A3 -B3 'ConnectionManager' server.js

echo ''
echo '🔍 Verificando app.listen:'
grep -n -A3 'app\\.listen' server.js
"

echo ""
echo "📊 2. STATUS ATUAL DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
echo '📊 Status PM2 detalhado:'
pm2 status

echo ''
echo '🔧 Informações detalhadas do whatsapp-server:'
pm2 show whatsapp-server

echo ''
echo '💾 Uso de memória em tempo real:'
pm2 monit --no-daemon | head -20

echo ''
echo '🌐 Portas em uso (3001-3005):'
netstat -tlnp | grep -E ':300[1-5]'

echo ''
echo '📈 Uptime e recursos do sistema:'
uptime
free -h
"

echo ""
echo "🩺 3. TESTE DOS ENDPOINTS HTTP"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🩺 Testando endpoint /health:'
echo 'Comando: curl -s http://localhost:3001/health'
HEALTH_RESPONSE=\$(curl -s http://localhost:3001/health 2>/dev/null)
echo 'Resposta:'
echo \"\$HEALTH_RESPONSE\" | jq . 2>/dev/null || echo \"\$HEALTH_RESPONSE\"

echo ''
echo '🔍 Extraindo dados das instâncias do /health:'
if echo \"\$HEALTH_RESPONSE\" | grep -q '\"instances\"'; then
    echo 'Total:' \$(echo \"\$HEALTH_RESPONSE\" | grep -o '\"total\":[0-9]*' | cut -d: -f2)
    echo 'Ativas:' \$(echo \"\$HEALTH_RESPONSE\" | grep -o '\"active\":[0-9]*' | cut -d: -f2) 
    echo 'Conectando:' \$(echo \"\$HEALTH_RESPONSE\" | grep -o '\"connecting\":[0-9]*' | cut -d: -f2)
    echo 'Com erro:' \$(echo \"\$HEALTH_RESPONSE\" | grep -o '\"error\":[0-9]*' | cut -d: -f2)
else
    echo 'Dados de instâncias não encontrados na resposta'
fi

echo ''
echo '🔍 Testando outros endpoints possíveis:'
echo 'GET /status:'
curl -s http://localhost:3001/status | head -3

echo ''
echo 'GET / (raiz):'
curl -s http://localhost:3001/ | head -3

echo ''
echo 'GET /instances (se existir):'
curl -s -o /dev/null -w 'HTTP Code: %{http_code}' http://localhost:3001/instances
echo ''
"

echo ""
echo "📱 4. ANÁLISE DAS INSTÂNCIAS WHATSAPP"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📱 Verificando pasta auth_info:'
if [ -d auth_info ]; then
    echo '✅ Pasta auth_info existe'
    echo ''
    echo 'Estrutura da pasta:'
    ls -la auth_info/ | head -15
    
    echo ''
    echo 'Total de subpastas (instâncias salvas):'
    ls -la auth_info/ | grep '^d' | grep -v '^d.*\\s\\.$\\|^d.*\\s\\.\\.$' | wc -l
    
    echo ''
    echo 'Instâncias com creds.json:'
    find auth_info -name 'creds.json' -exec dirname {} \\; | sed 's|auth_info/||' | head -10
    
    echo ''
    echo 'Tamanhos dos arquivos creds.json:'
    find auth_info -name 'creds.json' -exec ls -lh {} \\; | head -10
else
    echo '❌ Pasta auth_info não encontrada!'
fi

echo ''
echo '📊 Verificando ConnectionManager em memória:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep
"

echo ""
echo "📋 5. ANÁLISE DETALHADA DOS LOGS"
echo "================================================="
ssh $VPS_SERVER "
echo '📋 Logs do whatsapp-server (últimas 30 linhas):'
pm2 logs whatsapp-server --lines 30 --nostream

echo ''
echo '🔍 Procurando por erros nos logs:'
pm2 logs whatsapp-server --lines 100 --nostream | grep -i -E 'error|erro|fail|exception|crash' | tail -10

echo ''
echo '🔍 Procurando por @lid nos logs:'
pm2 logs whatsapp-server --lines 50 --nostream | grep -i '@lid' | tail -5

echo ''
echo '🔍 Procurando por inicialização de instâncias:'
pm2 logs whatsapp-server --lines 50 --nostream | grep -i -E 'instanc|connection|whatsapp' | tail -10

echo ''
echo '📊 Estatísticas dos logs:'
echo 'Total de linhas no log:'
pm2 logs whatsapp-server --lines 1000 --nostream | wc -l
echo 'Últimos 5 timestamps:'
pm2 logs whatsapp-server --lines 10 --nostream | grep -o '[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}T[0-9]\\{2\\}:[0-9]\\{2\\}:[0-9]\\{2\\}' | tail -5
"

echo ""
echo "💾 6. ANÁLISE DE MEMÓRIA E PERFORMANCE"
echo "================================================="
ssh $VPS_SERVER "
echo '💾 Uso de memória detalhado:'
echo 'Sistema geral:'
free -h

echo ''
echo 'Processos Node.js por memória:'
ps aux | grep node | grep -v grep | sort -k6 -nr

echo ''
echo 'Whatsapp-server específico:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep

echo ''
echo '📊 Limites de memória configurados (PM2):'
pm2 show whatsapp-server | grep -E 'max_memory_restart|memory'

echo ''
echo '📈 Histórico de restarts:'
pm2 show whatsapp-server | grep -E 'restart\\|restarts\\|uptime'

echo ''
echo '⚡ Load average do sistema:'
uptime
cat /proc/loadavg
"

echo ""
echo "🔄 7. VERIFICAÇÃO DE CRASHES E ESTABILIDADE"
echo "================================================="
ssh $VPS_SERVER "
echo '🔄 Verificando histórico de crashes:'
pm2 show whatsapp-server | grep -A5 -B5 'restart'

echo ''
echo '📊 Logs de erro específicos:'
if [ -f /root/.pm2/logs/whatsapp-server-error-*.log ]; then
    echo 'Últimos erros registrados:'
    tail -20 /root/.pm2/logs/whatsapp-server-error-*.log
else
    echo 'Nenhum log de erro encontrado'
fi

echo ''
echo '🔍 Verificando se há loops de restart:'
pm2 logs whatsapp-server --lines 20 --nostream | grep -E 'started\\|stopped\\|restart'

echo ''
echo '📋 Status de saúde geral:'
pm2 ping
"

echo ""
echo "✅ 8. RELATÓRIO FINAL DE ANÁLISE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 RELATÓRIO FINAL:'
echo '================================'

# Status do PM2
SERVER_STATUS=\$(pm2 list | grep whatsapp-server | awk '{print \$10}' | head -1)
echo \"🌐 Status PM2: \$SERVER_STATUS\"

# Memória atual
MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
echo \"💾 Memória atual: \${MEMORY}MB\"

# Uptime
UPTIME=\$(pm2 show whatsapp-server | grep uptime | awk '{print \$3}')
echo \"⏰ Uptime: \$UPTIME\"

# Restarts
RESTARTS=\$(pm2 show whatsapp-server | grep restarts | awk '{print \$3}')
echo \"🔄 Total restarts: \$RESTARTS\"

# Porta ativa
PORT_STATUS=\$(netstat -tlnp | grep :3001 >/dev/null && echo 'ATIVA' || echo 'INATIVA')
echo \"🌐 Porta 3001: \$PORT_STATUS\"

# HTTP funcionando
HTTP_STATUS=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health)
echo \"🩺 HTTP /health: \$HTTP_STATUS\"

# Instâncias
HEALTH_DATA=\$(curl -s http://localhost:3001/health 2>/dev/null)
if echo \"\$HEALTH_DATA\" | grep -q '\"total\"'; then
    TOTAL=\$(echo \"\$HEALTH_DATA\" | grep -o '\"total\":[0-9]*' | cut -d: -f2)
    ACTIVE=\$(echo \"\$HEALTH_DATA\" | grep -o '\"active\":[0-9]*' | cut -d: -f2)
    echo \"📱 Instâncias: \${ACTIVE}/\${TOTAL}\"
else
    echo '📱 Instâncias: Dados não disponíveis'
fi

echo ''
echo '📊 DIAGNÓSTICO GERAL:'
if [ \"\$SERVER_STATUS\" = \"online\" ] && [ \"\$PORT_STATUS\" = \"ATIVA\" ] && [ \"\$HTTP_STATUS\" = \"200\" ]; then
    echo '🎉 ✅ SERVIDOR COMPLETAMENTE FUNCIONAL'
    echo '🚀 Todos os componentes estão operacionais'
    
    if [ \"\$RESTARTS\" -gt 5 ] 2>/dev/null; then
        echo '⚠️ Alto número de restarts - investigar estabilidade'
    else
        echo '✅ Sistema estável (poucos restarts)'
    fi
    
    if [ \"\$MEMORY\" -gt 500 ] 2>/dev/null; then
        echo '⚠️ Alto uso de memória - monitorar'
    else
        echo '✅ Uso de memória normal'
    fi
else
    echo '❌ PROBLEMAS DETECTADOS:'
    [ \"\$SERVER_STATUS\" != \"online\" ] && echo \"   - PM2 Status: \$SERVER_STATUS\"
    [ \"\$PORT_STATUS\" != \"ATIVA\" ] && echo \"   - Porta 3001 inativa\"
    [ \"\$HTTP_STATUS\" != \"200\" ] && echo \"   - HTTP não responde corretamente\"
fi
"

echo ""
echo "🚀 ANÁLISE COMPLETA FINALIZADA!"
echo "================================================="
echo "📊 Todos os aspectos do servidor foram analisados"
echo "🔍 Verifique o relatório final acima para diagnóstico"