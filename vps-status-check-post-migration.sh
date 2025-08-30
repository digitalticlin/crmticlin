#!/bin/bash

# 🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO - Status e Diagnóstico
# Análise completa após migração CLUSTER → FORK

echo "🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO - STATUS E DIAGNÓSTICO"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. STATUS GERAL DO SISTEMA
# ============================================================

echo ""
echo "📊 1. STATUS GERAL DO SISTEMA"
echo "======================================================"

ssh $VPS_SERVER "
echo '🎯 Status PM2:'
pm2 status

echo ''
echo '🔍 Detalhes da instância whatsapp-server:'
pm2 info whatsapp-server

echo ''
echo '💻 Processos Node.js ativos:'
ps aux | grep -E '(whatsapp|node)' | grep -v grep

echo ''
echo '🌐 Portas em uso:'
netstat -tuln | grep -E ':(3001|6379)'

echo ''
echo '📊 Uso de recursos:'
echo 'CPU Load:' \$(uptime | awk -F'load average:' '{print \$2}')
echo 'Memória:' \$(free -h | grep Mem | awk '{print \"Total:\" \$2 \" | Usado:\" \$3 \" | Livre:\" \$7}')
echo 'Disco:' \$(df -h / | tail -1 | awk '{print \"Total:\" \$2 \" | Usado:\" \$3 \" | Livre:\" \$4}')
"

# ============================================================
# 2. VERIFICAÇÃO DE CONECTIVIDADE E SAÚDE
# ============================================================

echo ""
echo "🩺 2. VERIFICAÇÃO DE CONECTIVIDADE E SAÚDE"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔗 Testando conectividade Redis:'
redis-cli ping

echo ''
echo '🌐 Testando Health Check (porta 3001):'
for i in {1..3}; do
  echo \"Tentativa \$i/3:\"
  curl -s -m 10 http://localhost:3001/health 2>/dev/null || echo 'Falhou - Servidor não responde'
  echo ''
done

echo '🌐 Testando conectividade HTTP básica:'
curl -s -I http://localhost:3001 2>/dev/null | head -1 || echo 'Porta 3001 não responde'

echo ''
echo '📡 Verificando se o servidor está escutando na porta 3001:'
netstat -tuln | grep ':3001' || echo 'Nenhum processo escutando na porta 3001'
"

# ============================================================
# 3. ANÁLISE DE LOGS - CRASHES E ERROS
# ============================================================

echo ""
echo "📋 3. ANÁLISE DE LOGS - CRASHES E ERROS"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Logs PM2 (últimos 20 lines):'
pm2 logs whatsapp-server --lines 20 --nostream 2>/dev/null || echo 'Logs PM2 não disponíveis'

echo ''
echo '❌ Erros críticos nos logs (últimos 10 minutos):'
find logs -name '*.log' -newermt '10 minutes ago' -exec grep -i 'error\|crash\|exception\|fatal' {} + 2>/dev/null | tail -10 || echo 'Nenhum erro encontrado ou diretório logs não existe'

echo ''
echo '🔍 Conflitos Baileys (últimos 10 minutos):'
CONFLICTS=\$(find logs -name '*.log' -newermt '10 minutes ago' -exec grep -c 'Stream Errored (conflict)' {} + 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)
echo \"Conflitos encontrados: \$CONFLICTS\"

echo ''
echo '🔌 Desconexões WhatsApp (últimos 10 minutos):'
DISCONNECTS=\$(find logs -name '*.log' -newermt '10 minutes ago' -exec grep -c 'connection closed\|disconnected' {} + 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)
echo \"Desconexões encontradas: \$DISCONNECTS\"
"

# ============================================================
# 4. STATUS DAS INSTÂNCIAS WHATSAPP
# ============================================================

echo ""
echo "📱 4. STATUS DAS INSTÂNCIAS WHATSAPP"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Sessões WhatsApp salvas:'
if [ -d auth_info ]; then
  SESSIONS=\$(find auth_info -name 'creds.json' | wc -l)
  echo \"Total de sessões: \$SESSIONS\"
  echo ''
  echo 'Instâncias com sessões ativas:'
  find auth_info -name 'creds.json' -exec dirname {} \\; | sed 's|auth_info/||' | head -10
  echo '...'
else
  echo '❌ Diretório auth_info não encontrado'
fi

echo ''
echo '🔍 Testando endpoints das instâncias (se servidor estiver funcionando):'
# Tentar algumas rotas básicas
for endpoint in /health /instances /queue-status; do
  echo \"Testando \$endpoint:\"
  curl -s -m 5 http://localhost:3001\$endpoint 2>/dev/null && echo ' ✅ OK' || echo ' ❌ Falha'
done
"

# ============================================================
# 5. VERIFICAÇÃO DO SISTEMA DE FILAS
# ============================================================

echo ""
echo "📊 5. VERIFICAÇÃO DO SISTEMA DE FILAS REDIS"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔧 Status do Redis:'
systemctl status redis-server --no-pager | head -10

echo ''
echo '📊 Informações do Redis:'
redis-cli info server | grep -E 'redis_version|uptime_in_seconds|connected_clients'

echo ''
echo '🔍 Filas Redis (se existirem):'
redis-cli keys '*queue*' 2>/dev/null || echo 'Nenhuma fila encontrada'

echo ''
echo '💾 Uso de memória Redis:'
redis-cli info memory | grep -E 'used_memory_human|maxmemory_human'
"

# ============================================================
# 6. DIAGNÓSTICO DE PROBLEMAS COMUNS
# ============================================================

echo ""
echo "🔍 6. DIAGNÓSTICO DE PROBLEMAS COMUNS"
echo "======================================================"

ssh $VPS_SERVER "
echo '🔍 Verificando problemas comuns:'

echo ''
echo '1. Porta 3001 em uso por outro processo:'
lsof -i :3001 2>/dev/null || echo 'Porta 3001 livre ou lsof não disponível'

echo ''
echo '2. Arquivos de configuração existem:'
cd $VPS_PATH
[ -f server.js ] && echo '✅ server.js existe' || echo '❌ server.js não encontrado'
[ -f ecosystem.fork.config.js ] && echo '✅ ecosystem.fork.config.js existe' || echo '❌ ecosystem.fork.config.js não encontrado'
[ -f package.json ] && echo '✅ package.json existe' || echo '❌ package.json não encontrado'

echo ''
echo '3. Dependências instaladas:'
[ -d node_modules ] && echo '✅ node_modules existe' || echo '❌ node_modules não encontrado'
[ -f node_modules/bull/package.json ] && echo '✅ Bull instalado' || echo '❌ Bull não encontrado'
[ -f node_modules/redis/package.json ] && echo '✅ Redis cliente instalado' || echo '❌ Redis cliente não encontrado'

echo ''
echo '4. Permissões de arquivos:'
ls -la server.js ecosystem.fork.config.js 2>/dev/null | head -2

echo ''
echo '5. Espaço em disco suficiente:'
df -h $VPS_PATH | tail -1 | awk '{print \"Uso: \" \$5 \" - Disponível: \" \$4}'
"

# ============================================================
# 7. RECOMENDAÇÕES BASEADAS NO DIAGNÓSTICO
# ============================================================

echo ""
echo "💡 7. RECOMENDAÇÕES E PRÓXIMOS PASSOS"
echo "======================================================"

# Coletar informações para análise
PM2_STATUS=$(ssh $VPS_SERVER "pm2 jlist 2>/dev/null | jq -r '.[0].pm2_env.status' 2>/dev/null")
HEALTH_STATUS=$(ssh $VPS_SERVER "curl -s -m 5 http://localhost:3001/health 2>/dev/null")
REDIS_STATUS=$(ssh $VPS_SERVER "redis-cli ping 2>/dev/null")
PORT_LISTENING=$(ssh $VPS_SERVER "netstat -tuln | grep ':3001' | wc -l")

echo "🔍 Análise automática:"
echo ""

if [ "$PM2_STATUS" = "online" ]; then
    echo "✅ PM2: Processo online"
else
    echo "❌ PM2: Processo não está online ($PM2_STATUS)"
    echo "   🔧 Ação: Execute 'pm2 restart whatsapp-server'"
fi

if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "✅ Redis: Funcionando"
else
    echo "❌ Redis: Não responde"
    echo "   🔧 Ação: Execute 'systemctl restart redis-server'"
fi

if [ "$PORT_LISTENING" -gt 0 ]; then
    echo "✅ Porta 3001: Processo escutando"
else
    echo "❌ Porta 3001: Nenhum processo escutando"
    echo "   🔧 Possível causa: Servidor não inicializou completamente"
fi

if [ -n "$HEALTH_STATUS" ]; then
    echo "✅ Health Check: Servidor responde"
else
    echo "❌ Health Check: Servidor não responde"
    echo "   🔧 Ações recomendadas:"
    echo "      1. Verificar logs: pm2 logs whatsapp-server"
    echo "      2. Verificar se server.js tem erros de sintaxe"
    echo "      3. Verificar se todas as dependências estão instaladas"
fi

echo ""
echo "🚀 PRÓXIMAS AÇÕES RECOMENDADAS:"
echo ""
echo "Se o servidor não está respondendo:"
echo "  1️⃣ pm2 restart whatsapp-server"
echo "  2️⃣ pm2 logs whatsapp-server --lines 50"
echo "  3️⃣ Verificar se o código server.js foi atualizado corretamente"
echo ""
echo "Se há conflitos Baileys:"
echo "  1️⃣ Verificar se apenas 1 processo está rodando (modo FORK)"
echo "  2️⃣ Limpar sessões corrompidas se necessário"
echo ""
echo "Para testar instâncias WhatsApp:"
echo "  1️⃣ Acessar http://IP:3001/health"
echo "  2️⃣ Criar nova instância via API: /create-instance"
echo "  3️⃣ Verificar QR codes via: /qr/INSTANCE_ID"

echo ""
echo "📊 RELATÓRIO COMPLETO GERADO!"
echo "======================================================"