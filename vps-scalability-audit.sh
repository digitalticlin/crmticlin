#!/bin/bash

# 🔍 AUDITORIA COMPLETA DE ESCALABILIDADE - VPS WHATSAPP SERVER
# Para suportar: Milhares de usuários + Centenas de milhares de leads/dia

echo "🚀 INICIANDO AUDITORIA DE ESCALABILIDADE VPS..."
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. ANÁLISE DE RECURSOS DO SISTEMA
# ============================================================

echo ""
echo "📊 1. RECURSOS DO SISTEMA"
echo "======================================================"

echo "🖥️ CPU e Memória:"
ssh $VPS_SERVER "
echo '--- CPU Info ---'
lscpu | grep -E 'CPU\(s\)|Model name|Thread|Core'
echo
echo '--- Memory Info ---'
free -h
echo
echo '--- Load Average ---'
uptime
echo
echo '--- Top Processes ---'
ps aux --sort=-%cpu | head -10
"

echo ""
echo "💾 Armazenamento:"
ssh $VPS_SERVER "
echo '--- Disk Usage ---'
df -h
echo
echo '--- Inode Usage ---'
df -i
echo
echo '--- Disk I/O ---'
iostat -x 1 3 2>/dev/null || echo 'iostat not available'
"

# ============================================================
# 2. ANÁLISE DA ARQUITETURA ATUAL
# ============================================================

echo ""
echo "🏗️ 2. ARQUITETURA ATUAL"
echo "======================================================"

echo "📦 Node.js e Dependências:"
ssh $VPS_SERVER "cd $VPS_PATH && 
echo '--- Node Version ---'
node --version
echo
echo '--- NPM Packages ---'
npm list --depth=0 | head -20
echo
echo '--- Package.json ---'
cat package.json | jq -r '.dependencies | keys[]' 2>/dev/null || grep -A 20 '\"dependencies\"' package.json
"

echo ""
echo "⚙️ Gerenciamento de Processos:"
ssh $VPS_SERVER "
echo '--- PM2 Status ---'
pm2 status
echo
echo '--- PM2 Info ---'
pm2 info server 2>/dev/null || echo 'PM2 info not available'
echo
echo '--- PM2 Logs ---'
pm2 logs server --lines 5 --raw 2>/dev/null || echo 'PM2 logs not available'
"

# ============================================================
# 3. ANÁLISE DE CONCORRÊNCIA E FILAS
# ============================================================

echo ""
echo "🔄 3. CONCORRÊNCIA E FILAS"
echo "======================================================"

echo "📋 Estrutura de Filas:"
ssh $VPS_SERVER "cd $VPS_PATH && 
echo '--- Procurar por implementação de filas ---'
grep -r -i 'queue\|bull\|agenda\|redis\|rabbitmq' . --include='*.js' | head -10
echo
echo '--- Procurar por async/await patterns ---'
grep -r 'async.*function\|await' . --include='*.js' | wc -l
echo 'Funções async encontradas'
"

echo ""
echo "🔗 Conexões e Sockets:"
ssh $VPS_SERVER "
echo '--- Network Connections ---'
netstat -tuln | grep -E ':3001|:3002|:3003'
echo
echo '--- Active Connections Count ---'
netstat -an | grep ESTABLISHED | wc -l
echo
echo '--- Socket Limits ---'
ulimit -n
"

# ============================================================
# 4. ANÁLISE DE PERFORMANCE E BOTTLENECKS
# ============================================================

echo ""
echo "⚡ 4. PERFORMANCE E BOTTLENECKS"
echo "======================================================"

echo "📈 Métricas de Performance:"
ssh $VPS_SERVER "cd $VPS_PATH &&
echo '--- Server Response Time ---'
curl -w '@-' -o /dev/null -s http://localhost:3001/health <<< '
     time_namelookup:  %{time_namelookup}s
        time_connect:  %{time_connect}s
     time_appconnect:  %{time_appconnect}s
    time_pretransfer:  %{time_pretransfer}s
       time_redirect:  %{time_redirect}s
  time_starttransfer:  %{time_starttransfer}s
                     ----------
          time_total:  %{time_total}s
'
echo
echo '--- Memory Usage by Process ---'
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | grep node | head -5
"

echo ""
echo "🔍 Análise de Logs:"
ssh $VPS_SERVER "cd $VPS_PATH &&
echo '--- Log File Sizes ---'
ls -lh *.log 2>/dev/null || echo 'No log files found'
echo
echo '--- Recent Error Patterns ---'
tail -1000 server.log 2>/dev/null | grep -i error | tail -5 || echo 'No recent errors'
echo
echo '--- Message Processing Rate ---'
tail -1000 server.log 2>/dev/null | grep 'Nova mensagem' | tail -10 || echo 'No message logs found'
"

# ============================================================
# 5. ANÁLISE DE BANCO DE DADOS E STORAGE
# ============================================================

echo ""
echo "💾 5. BANCO DE DADOS E STORAGE"
echo "======================================================"

echo "🗄️ Conexões de Banco:"
ssh $VPS_SERVER "cd $VPS_PATH &&
echo '--- Database Connection Config ---'
grep -r 'SUPABASE\|DATABASE\|DB_' . --include='*.js' --include='*.env*' | head -10
echo
echo '--- Auth Storage Size ---'
du -sh auth_info/ 2>/dev/null || echo 'No auth_info directory'
echo
echo '--- Temp Files ---'
find /tmp -name '*whatsapp*' -o -name '*baileys*' 2>/dev/null | head -10
"

# ============================================================
# 6. ANÁLISE DE SEGURANÇA E LIMITES
# ============================================================

echo ""
echo "🔒 6. SEGURANÇA E LIMITES"
echo "======================================================"

echo "⚖️ System Limits:"
ssh $VPS_SERVER "
echo '--- File Descriptor Limits ---'
cat /proc/sys/fs/file-max
echo 'Current open files:'
lsof | wc -l
echo
echo '--- Process Limits ---'
cat /proc/sys/kernel/pid_max
echo
echo '--- Network Limits ---'
cat /proc/sys/net/core/somaxconn
echo
echo '--- Memory Overcommit ---'
cat /proc/sys/vm/overcommit_memory
"

# ============================================================
# 7. ANÁLISE DE BAILEYS E WHATSAPP ESPECÍFICO
# ============================================================

echo ""
echo "📱 7. WHATSAPP/BAILEYS ESPECÍFICO"
echo "======================================================"

echo "🔌 Instâncias WhatsApp:"
ssh $VPS_SERVER "cd $VPS_PATH &&
echo '--- Auth Directories (Instâncias) ---'
ls -la auth_info/ 2>/dev/null | wc -l
echo 'Total de instâncias configuradas'
echo
echo '--- Baileys Version ---'
grep baileys package.json
echo
echo '--- WebSocket Connections ---'
netstat -an | grep -i websocket | wc -l || echo '0'
echo 'WebSocket connections'
"

# ============================================================
# 8. RECOMENDAÇÕES AUTOMÁTICAS
# ============================================================

echo ""
echo "🎯 8. ANÁLISE AUTOMÁTICA DE ESCALABILIDADE"
echo "======================================================"

ssh $VPS_SERVER "
CPU_CORES=\$(nproc)
MEMORY_GB=\$(free -g | awk 'NR==2{printf \"%d\", \$2}')
LOAD_AVG=\$(uptime | awk -F'load average:' '{print \$2}' | awk '{print \$1}' | sed 's/,//')

echo \"Sistema atual:\"
echo \"- CPU Cores: \$CPU_CORES\"
echo \"- Memory: \${MEMORY_GB}GB\"
echo \"- Load Average: \$LOAD_AVG\"
echo

echo \"Capacidade estimada atual:\"
if [ \$MEMORY_GB -lt 8 ]; then
    echo \"⚠️ CRÍTICO: Memória insuficiente para alta escala (<8GB)\"
    echo \"   Suporta: ~100-500 usuários simultâneos\"
elif [ \$MEMORY_GB -lt 16 ]; then
    echo \"⚠️ LIMITADO: Memória adequada para escala média (8-16GB)\"
    echo \"   Suporta: ~500-2000 usuários simultâneos\"
else
    echo \"✅ BOM: Memória adequada para alta escala (>16GB)\"
    echo \"   Suporta: ~2000+ usuários simultâneos\"
fi

if [ \$CPU_CORES -lt 4 ]; then
    echo \"⚠️ CRÍTICO: CPU insuficiente para alta escala (<4 cores)\"
elif [ \$CPU_CORES -lt 8 ]; then
    echo \"⚠️ LIMITADO: CPU adequada para escala média (4-8 cores)\"
else
    echo \"✅ BOM: CPU adequada para alta escala (>8 cores)\"
fi
"

echo ""
echo "📋 AUDITORIA CONCLUÍDA!"
echo "======================================================"
echo "Para análise detalhada, revise cada seção acima."
echo "Próximo passo: Executar vps-scalability-recommendations.sh"