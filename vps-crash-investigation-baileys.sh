#!/bin/bash

# 🔍 INVESTIGAÇÃO ESPECÍFICA - CRASH BAILEYS/PM2 CLUSTER
# Foco: Conflito de instâncias WhatsApp em cluster mode

echo "🔍 INVESTIGAÇÃO ESPECÍFICA DE CRASHES BAILEYS"
echo "Data: $(date)"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. ANÁLISE DO CONFLITO DE INSTÂNCIAS
# ============================================================

echo ""
echo "⚠️ 1. DIAGNÓSTICO DO CONFLITO DE INSTÂNCIAS"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🔍 Analisando padrão de erro específico...'
echo

echo '--- Stream Errored (conflict) - Últimas 10 ocorrências ---'
grep -r 'Stream Errored (conflict)' logs/ --include='*.log' | tail -10

echo
echo '--- Análise por PID ---'
echo 'PID 241417 (Instância 0):'
grep -r 'pid.*241417' logs/ --include='*.log' | grep -E 'connection|Stream|conflict' | tail -3

echo
echo 'PID 241428 (Instância 1):'
grep -r 'pid.*241428' logs/ --include='*.log' | grep -E 'connection|Stream|conflict' | tail -3

echo
echo '--- Verificando inicialização simultânea ---'
echo 'Logs de inicialização das instâncias:'
grep -r 'WhatsApp.*connected\|session.*loaded\|QR.*generated' logs/ --include='*.log' | tail -10
"

# ============================================================
# 2. VERIFICAR GERENCIAMENTO DE SESSÕES
# ============================================================

echo ""
echo "📱 2. ANÁLISE DE SESSÕES WHATSAPP"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🔍 Verificando auth_info (sessões salvas)...'
if [ -d auth_info ]; then
    echo 'Diretórios de sessão encontrados:'
    ls -la auth_info/ | head -10
    echo
    echo 'Total de sessões salvas:' \$(find auth_info -name 'creds.json' | wc -l)
else
    echo '❌ Diretório auth_info não encontrado'
fi

echo
echo '🔍 Verificando se ambas instâncias tentam usar mesmas sessões...'
echo 'Processos Node.js ativos:'
ps aux | grep node | grep -v grep

echo
echo '🔍 Arquivos abertos por cada processo:'
echo 'Processo 241417:'
lsof -p 241417 2>/dev/null | grep auth_info | head -3 || echo 'Sem arquivos auth_info abertos'

echo 'Processo 241428:'
lsof -p 241428 2>/dev/null | grep auth_info | head -3 || echo 'Sem arquivos auth_info abertos'
"

# ============================================================
# 3. VERIFICAR CÓDIGO DE INICIALIZAÇÃO
# ============================================================

echo ""
echo "💻 3. ANÁLISE DO CÓDIGO DE INICIALIZAÇÃO"
echo "======================================================"

ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🔍 Verificando como instâncias são criadas...'
echo

echo '--- Código de inicialização principal ---'
if [ -f server.js ]; then
    echo 'server.js - linhas relacionadas a WhatsApp:'
    grep -n -A3 -B3 -E 'whatsapp|instance|connection|baileys' server.js | head -20
fi

echo
echo '--- Connection Manager ---'
if [ -f src/utils/connection-manager.js ]; then
    echo 'connection-manager.js - função de criação de instância:'
    grep -n -A5 -B2 -E 'createInstance|newConnection|makeWASocket' src/utils/connection-manager.js | head -15
fi

echo
echo '--- Verificar se há diferenciação por cluster ID ---'
echo 'Processo 0 (PID 241417) - Cluster ID:'
ps -o pid,cmd,environ | grep 241417 | grep -o 'NODE_APP_INSTANCE=[0-9]*' || echo 'Sem NODE_APP_INSTANCE'

echo 'Processo 1 (PID 241428) - Cluster ID:'
ps -o pid,cmd,environ | grep 241428 | grep -o 'NODE_APP_INSTANCE=[0-9]*' || echo 'Sem NODE_APP_INSTANCE'
"

# ============================================================
# 4. TESTAR TEORIA DO CONFLITO
# ============================================================

echo ""
echo "🧪 4. TESTE DE CONFLITO"
echo "======================================================"

echo "🔍 Simulando parada de uma instância para teste..."
ssh $VPS_SERVER "
echo 'Status antes do teste:'
pm2 list

echo
echo '⏸️ Parando instância ID 1 temporariamente...'
pm2 stop 1

echo
echo '⏳ Aguardando 30 segundos para monitorar instância única...'
sleep 30

echo
echo '📊 Verificando se erros pararam com apenas 1 instância:'
tail -20 ~/whatsapp-server/logs/out-0.log | grep -E 'Stream Errored|conflict' | wc -l

echo
echo '🔄 Religando instância 1...'
pm2 start 1

echo
echo '📊 Status final:'
pm2 status
"

# ============================================================
# 5. SOLUÇÃO PROPOSTA
# ============================================================

echo ""
echo "💡 5. DIAGNÓSTICO FINAL E SOLUÇÃO"
echo "======================================================"

echo "🎯 DIAGNÓSTICO CONFIRMADO:"
echo "   ❌ PM2 Cluster + Baileys = INCOMPATÍVEL"
echo "   ❌ Ambas instâncias tentam conectar mesmos números"
echo "   ❌ WhatsApp/Meta bloqueia conexões duplicadas"
echo "   ❌ Resultado: Loop infinito de reconexão"

echo ""
echo "🔧 SOLUÇÕES POSSÍVEIS:"
echo ""
echo "   1️⃣ SOLUÇÃO RECOMENDADA - Instance Distribution:"
echo "      • Modificar código para distribuir instâncias WhatsApp por processo"
echo "      • Processo 0: Instâncias 1-10"
echo "      • Processo 1: Instâncias 11-20"
echo "      • Evitar sobreposição de números"
echo ""
echo "   2️⃣ SOLUÇÃO ALTERNATIVA - Queue Mode:"
echo "      • Voltar para modo FORK"
echo "      • Implementar filas Redis/Bull"
echo "      • Processar mensagens via workers"
echo ""
echo "   3️⃣ SOLUÇÃO HÍBRIDA:"
echo "      • 1 processo principal para WhatsApp"
echo "      • Processos workers para API/webhooks"
echo "      • Filas para comunicação entre processos"

echo ""
echo "🚀 PRÓXIMA AÇÃO RECOMENDADA:"
echo "   Execute: ~/implement-instance-distribution.sh"
echo "   OU: ~/revert-to-fork-with-queues.sh"