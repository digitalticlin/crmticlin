#!/bin/bash

# 🔍 VERIFICAÇÃO DE ESTABILIDADE E CRASHES - PM2 CLUSTER
# Análise de logs, restarts e instabilidade das instâncias

echo "🔍 VERIFICAÇÃO DE ESTABILIDADE DO CLUSTER"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. STATUS ATUAL DETALHADO
# ============================================================

echo ""
echo "📊 1. STATUS ATUAL DO CLUSTER"
echo "======================================================"

ssh $VPS_SERVER "
echo '⚙️ PM2 Status Detalhado:'
pm2 status
echo

echo '📈 PM2 Monit (Snapshot):'
pm2 monit --lines 5 | head -20 || pm2 list

echo

echo '🔄 Restart Count por Instância:'
pm2 jlist | jq -r '.[] | \"ID: \" + (.pm_id|tostring) + \" | Restarts: \" + (.pm2_env.restart_time|tostring) + \" | Status: \" + .pm2_env.status'
"

# ============================================================
# 2. ANÁLISE DE LOGS DE ERRO
# ============================================================

echo ""
echo "🚨 2. ANÁLISE DE LOGS DE ERRO"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '📋 Logs de Erro Recentes (Últimas 50 linhas):'
echo

echo '--- Instância 0 (Erros) ---'
if [ -f logs/err-0.log ]; then
    tail -20 logs/err-0.log | grep -E 'Error|ERROR|error|crash|CRASH|fatal|FATAL|exception|Exception' || echo 'Sem erros críticos'
else
    echo 'Arquivo de erro não encontrado'
fi

echo
echo '--- Instância 1 (Erros) ---'
if [ -f logs/err-1.log ]; then
    tail -20 logs/err-1.log | grep -E 'Error|ERROR|error|crash|CRASH|fatal|FATAL|exception|Exception' || echo 'Sem erros críticos'
else
    echo 'Arquivo de erro não encontrado'
fi
"

# ============================================================
# 3. ANÁLISE DE RESTARTS E INSTABILIDADE
# ============================================================

echo ""
echo "🔄 3. ANÁLISE DE RESTARTS E INSTABILIDADE"
echo "======================================================"

ssh $VPS_SERVER "
echo '📊 Histórico de Restarts:'
pm2 list | grep -E 'restart|↺'

echo
echo '⏰ Uptime das Instâncias:'
pm2 jlist | jq -r '.[] | \"Instância \" + (.pm_id|tostring) + \": \" + (.pm2_env.pm_uptime|tostring) + \" (\" + .pm2_env.status + \")\"'

echo
echo '💾 Uso de Memória (Verificar Memory Leaks):'
pm2 jlist | jq -r '.[] | \"ID \" + (.pm_id|tostring) + \": \" + (.monit.memory/1024/1024|floor|tostring) + \"MB\"'

echo
echo '🔧 Configurações de Restart:'
pm2 jlist | jq -r '.[] | \"ID \" + (.pm_id|tostring) + \" - Max Memory: \" + (.pm2_env.max_memory_restart//\"N/A\"|tostring) + \" | Max Restarts: \" + (.pm2_env.max_restarts//\"N/A\"|tostring)'
"

# ============================================================
# 4. VERIFICAÇÃO DE INSTÂNCIAS WHATSAPP
# ============================================================

echo ""
echo "📱 4. ESTABILIDADE DAS INSTÂNCIAS WHATSAPP"
echo "======================================================"

echo "🔍 Testando conectividade e estabilidade..."
for i in {1..3}; do
    echo "📊 Teste $i/3 ($(date +%H:%M:%S)):"
    
    ssh $VPS_SERVER "
    echo '  Health Check:'
    HEALTH=\$(curl -s http://localhost:3001/health 2>/dev/null)
    if echo \"\$HEALTH\" | grep -q '\"status\":\"ok\"'; then
        ACTIVE=\$(echo \"\$HEALTH\" | jq -r '.instances.active' 2>/dev/null)
        TOTAL=\$(echo \"\$HEALTH\" | jq -r '.instances.total' 2>/dev/null)
        ERROR=\$(echo \"\$HEALTH\" | jq -r '.instances.error' 2>/dev/null)
        echo \"  ✅ OK - Ativas: \$ACTIVE/\$TOTAL | Erros: \$ERROR\"
    else
        echo '  ❌ Health check falhou'
    fi
    "
    
    if [ $i -lt 3 ]; then
        sleep 10
    fi
done

# ============================================================
# 5. ANÁLISE DE PERFORMANCE E BOTTLENECKS
# ============================================================

echo ""
echo "⚡ 5. ANÁLISE DE PERFORMANCE"
echo "======================================================"

ssh $VPS_SERVER "
echo '📊 Sistema Geral:'
echo 'CPU Load:' \$(uptime | awk -F'load average:' '{print \$2}')
echo 'Memória:' \$(free -h | grep Mem | awk '{print \"Usada: \" \$3 \"/\" \$2 \" (\" \$7 \" livre)\"}')

echo
echo '🔥 Top Processos por CPU:'
ps aux --sort=-%cpu | head -5

echo
echo '💾 Top Processos por Memória:'
ps aux --sort=-%mem | head -5

echo
echo '🌐 Conexões de Rede:'
echo 'Total conexões:' \$(netstat -an | grep ESTABLISHED | wc -l)
echo 'Conexões porta 3001:' \$(netstat -an | grep :3001 | wc -l)
"

# ============================================================
# 6. LOGS ESPECÍFICOS DE CRASHES
# ============================================================

echo ""
echo "💥 6. DETECÇÃO DE CRASHES ESPECÍFICOS"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🔍 Procurando padrões de crash...'

echo
echo '--- Crashes de WhatsApp/Baileys ---'
grep -r 'Stream Errored\\|connection errored\\|WebSocket.*error\\|ECONNRESET\\|ENOTFOUND' logs/ --include='*.log' 2>/dev/null | tail -5 || echo 'Sem crashes de conexão WhatsApp'

echo
echo '--- Memory Issues ---'
grep -r 'out of memory\\|heap\\|ENOMEM\\|memory.*error' logs/ --include='*.log' 2>/dev/null | tail -3 || echo 'Sem problemas de memória'

echo
echo '--- PM2 Restarts ---'
grep -r 'Process.*restarted\\|Application.*restarted\\|stopped\\|errored' ~/.pm2/logs/ 2>/dev/null | tail -5 || echo 'Sem restarts recentes detectados'
"

# ============================================================
# 7. VERIFICAÇÃO DE ARQUIVOS CORE DUMPS
# ============================================================

echo ""
echo "🧠 7. VERIFICAÇÃO DE CORE DUMPS"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔍 Procurando core dumps:'
find /tmp /var/tmp . -name 'core.*' -o -name '*.core' 2>/dev/null | head -5 || echo 'Sem core dumps encontrados'

echo
echo '📁 Arquivos de crash/debug:'
find . -name '*.dmp' -o -name 'crash-*' -o -name 'debug-*' 2>/dev/null | head -5 || echo 'Sem arquivos de debug'
"

# ============================================================
# 8. RECOMENDAÇÕES DE ESTABILIDADE
# ============================================================

echo ""
echo "💡 8. ANÁLISE E RECOMENDAÇÕES"
echo "======================================================"

ssh $VPS_SERVER "
RESTART_COUNT=\$(pm2 jlist | jq '[.[] | .pm2_env.restart_time] | add')
MEMORY_USAGE=\$(pm2 jlist | jq '[.[] | .monit.memory] | max')
UPTIME=\$(pm2 jlist | jq '[.[] | .pm2_env.pm_uptime] | min')

echo \"📊 Métricas de Estabilidade:\"
echo \"- Total de Restarts: \$RESTART_COUNT\"
echo \"- Maior uso de memória: \$((MEMORY_USAGE/1024/1024))MB\"
echo \"- Menor uptime: \$((UPTIME/1000)) segundos\"

echo
if [ \$RESTART_COUNT -gt 5 ]; then
    echo '⚠️ PROBLEMA: Muitos restarts detectados!'
    echo '   Recomendação: Investigar logs de erro'
elif [ \$MEMORY_USAGE -gt 838860800 ]; then  # >800MB
    echo '⚠️ AVISO: Uso alto de memória!'
    echo '   Recomendação: Monitorar memory leaks'
elif [ \$UPTIME -lt 300000 ]; then  # <5min
    echo '⚠️ AVISO: Instâncias reiniciando frequentemente!'
    echo '   Recomendação: Verificar configuração'
else
    echo '✅ ESTABILIDADE: Sistema estável'
    echo '   Status: Cluster funcionando normalmente'
fi
"

echo ""
echo "🎯 VERIFICAÇÃO CONCLUÍDA!"
echo "======================================================"
echo "📊 Se houver problemas, execute:"
echo "   - pm2 logs para ver logs em tempo real"  
echo "   - pm2 restart all se necessário"
echo "   - ~/restore_emergency_[DATA].sh em caso crítico"
echo ""
echo "🚀 Se estável, prossiga para Fase 3:"
echo "   - Execute: ~/vps-implementation-phase3-queues.sh"