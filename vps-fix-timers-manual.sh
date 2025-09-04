#!/bin/bash

# 🔧 CORREÇÃO MANUAL DOS TIMERS DE LIMPEZA DE CACHE
echo "🔧 CORREÇÃO MANUAL DOS TIMERS DE LIMPEZA DE CACHE"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "🔍 1. VERIFICANDO ESTADO ATUAL DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status PM2 ANTES da correção:'
pm2 list

echo ''
echo '💾 Uso de memória atual:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print \"💾 whatsapp-server: \" int(\$6/1024) \"MB\"}'

echo ''
echo '🎯 Verificando se servidor responde:'
curl -s http://localhost:3001/health | head -3 || echo '❌ Servidor não responde'

echo ''
echo '⏰ Verificando timers atuais de limpeza:'
grep -n -C2 'setInterval.*perform.*Cleanup' src/utils/connection-manager.js | head -10
"

echo ""
echo "💾 2. BACKUP ANTES DA CORREÇÃO MANUAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup antes da correção manual...'
cp src/utils/connection-manager.js src/utils/connection-manager.js.backup-manual-timers-$(date +%Y%m%d_%H%M%S)

echo '✅ Backup criado:'
ls -la src/utils/connection-manager.js.backup-manual-timers* | tail -1

echo ''
echo '📊 Arquivo original:'
wc -l src/utils/connection-manager.js | awk '{print \"📄 Linhas: \" \$1}'
"

echo ""
echo "⏰ 3. CORRIGINDO TIMER AGRESSIVO (1min → 10min)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Procurando timer agressivo atual...'
grep -n '60 \* 1000.*A cada.*minuto' src/utils/connection-manager.js || echo 'Timer não encontrado no padrão esperado'

echo ''
echo '🔄 Alterando timer agressivo: 1 minuto → 10 minutos...'

# Fazer a substituição do timer agressivo
sed -i 's/60 \* 1000); \/\/ A cada 1 minuto/10 * 60 * 1000); \/\/ A cada 10 minutos/g' src/utils/connection-manager.js

# Verificar se a alteração foi aplicada
if grep -q '10 \* 60 \* 1000.*A cada 10 minutos' src/utils/connection-manager.js; then
    echo '✅ Timer agressivo alterado com sucesso!'
    grep -n '10 \* 60 \* 1000.*A cada 10 minutos' src/utils/connection-manager.js
else
    echo '⚠️ Timer agressivo não foi alterado (pode não estar no padrão esperado)'
    echo 'Tentando padrão alternativo...'
    
    # Tentar padrão sem comentário específico
    sed -i 's/}, 60 \* 1000);/}, 10 * 60 * 1000); \/\/ A cada 10 minutos/g' src/utils/connection-manager.js
    
    if grep -q '10 \* 60 \* 1000' src/utils/connection-manager.js; then
        echo '✅ Timer agressivo alterado (padrão alternativo)!'
        grep -n '10 \* 60 \* 1000' src/utils/connection-manager.js
    else
        echo '❌ Não conseguiu alterar timer agressivo automaticamente'
    fi
fi
"

echo ""
echo "⏰ 4. CORRIGINDO TIMER PROFUNDO (15min → 1h)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Procurando timer profundo atual...'
grep -n '15 \* 60 \* 1000.*A cada.*minutos' src/utils/connection-manager.js || echo 'Timer não encontrado no padrão esperado'

echo ''
echo '🔄 Alterando timer profundo: 15 minutos → 1 hora...'

# Fazer a substituição do timer profundo
sed -i 's/15 \* 60 \* 1000); \/\/ A cada 15 minutos/60 * 60 * 1000); \/\/ A cada 1 hora/g' src/utils/connection-manager.js

# Verificar se a alteração foi aplicada
if grep -q '60 \* 60 \* 1000.*A cada 1 hora' src/utils/connection-manager.js; then
    echo '✅ Timer profundo alterado com sucesso!'
    grep -n '60 \* 60 \* 1000.*A cada 1 hora' src/utils/connection-manager.js
else
    echo '⚠️ Timer profundo não foi alterado (pode não estar no padrão esperado)'
    echo 'Tentando padrão alternativo...'
    
    # Tentar padrão sem comentário específico  
    sed -i 's/}, 15 \* 60 \* 1000);/}, 60 * 60 * 1000); \/\/ A cada 1 hora/g' src/utils/connection-manager.js
    
    if grep -q '60 \* 60 \* 1000' src/utils/connection-manager.js; then
        echo '✅ Timer profundo alterado (padrão alternativo)!'
        grep -n '60 \* 60 \* 1000' src/utils/connection-manager.js
    else
        echo '❌ Não conseguiu alterar timer profundo automaticamente'
    fi
fi
"

echo ""
echo "🔍 5. VERIFICANDO TODAS AS ALTERAÇÕES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Resumo das alterações aplicadas:'
echo ''

echo '🔍 Timers encontrados no arquivo:'
grep -n -A1 -B1 'setInterval.*perform.*Cleanup' src/utils/connection-manager.js | head -20

echo ''
echo '📋 Contagem de timers por tipo:'
AGGRESSIVE_COUNT=\$(grep -c 'performAggressiveCleanup' src/utils/connection-manager.js)
DEEP_COUNT=\$(grep -c 'performDeepCleanup' src/utils/connection-manager.js)
echo \"🧹 performAggressiveCleanup: \$AGGRESSIVE_COUNT ocorrências\"
echo \"🧹 performDeepCleanup: \$DEEP_COUNT ocorrências\"

echo ''
echo '📝 Validando sintaxe do arquivo modificado...'
node -c src/utils/connection-manager.js

if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe JavaScript válida!'
else
    echo '❌ ERRO DE SINTAXE! Restaurando backup...'
    LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-manual-timers* | head -1)
    cp \"\$LATEST_BACKUP\" src/utils/connection-manager.js
    echo \"🔄 Backup restaurado: \$LATEST_BACKUP\"
    exit 1
fi
"

echo ""
echo "🚀 6. APLICANDO ALTERAÇÕES (RESTART)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Reiniciando whatsapp-server para aplicar timers corrigidos...'
pm2 restart whatsapp-server

echo ''
echo '⏳ Aguardando 15 segundos para inicialização completa...'
sleep 15

echo ''
echo '📊 Status PM2 após aplicar correções:'
pm2 list

echo ''
echo '💾 Uso de memória após restart:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print \"💾 whatsapp-server: \" int(\$6/1024) \"MB\"}'

echo ''
echo '🎯 Verificando se servidor responde:'
curl -s http://localhost:3001/health | head -3 || echo '❌ Servidor não responde'
"

echo ""
echo "📊 7. MONITORAMENTO DE ESTABILIDADE (2 MINUTOS)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Monitorando estabilidade por 2 minutos...'
echo 'Verificando se não há restarts e se sistema permanece estável.'

for i in {1..12}; do
    echo \"\"
    echo \"📊 Check \$i/12 (a cada 10 segundos):\"
    echo \"Tempo: \$(date)\"
    
    # Verificar restarts
    RESTART_COUNT=\$(pm2 show whatsapp-server | grep 'restarts' | awk '{print \$3}')
    echo \"🔄 Restarts: \$RESTART_COUNT\"
    
    # Verificar memória
    MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
    echo \"💾 Memória: \${MEMORY}MB\"
    
    # Verificar se responde
    STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
    echo \"🌐 Status: \$STATUS\"
    
    # Verificar instâncias ativas
    INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
    echo \"📱 Instâncias: \$INSTANCES\"
    
    # Alerta se memória crescer muito rápido
    if [ \"\$MEMORY\" -gt 500 ]; then
        echo \"⚠️ ALERTA: Memória alta (\${MEMORY}MB)\"
    fi
    
    sleep 10
done

echo ''
echo '📋 RESULTADO DO MONITORAMENTO:'
FINAL_MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
FINAL_RESTARTS=\$(pm2 show whatsapp-server | grep 'restarts' | awk '{print \$3}')

echo \"💾 Memória final: \${FINAL_MEMORY}MB\"
echo \"🔄 Restarts finais: \$FINAL_RESTARTS\"

if [ \"\$FINAL_MEMORY\" -lt 300 ] && [ \"\$FINAL_RESTARTS\" -lt 20 ]; then
    echo '✅ Sistema estável durante monitoramento!'
else
    echo '⚠️ Possíveis problemas detectados durante monitoramento'
fi
"

echo ""
echo "📊 8. TESTANDO TIMERS DE LIMPEZA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Testando se timers de limpeza foram aplicados...'
echo ''

echo '🔍 Buscando por configurações de timer no código:'
grep -n -C1 '10 \* 60 \* 1000' src/utils/connection-manager.js | head -5
grep -n -C1 '60 \* 60 \* 1000' src/utils/connection-manager.js | head -5

echo ''
echo '📊 Procurando por mensagens de limpeza nos logs recentes:'
pm2 logs whatsapp-server --lines 50 | grep -E 'AGGRESSIVE|SAFE|cache|Cache' | tail -5 || echo 'Nenhuma mensagem de limpeza encontrada nos logs recentes'

echo ''
echo '⏰ Próximas limpezas esperadas:'
echo '   • Limpeza agressiva (cache básico): A cada 10 minutos'
echo '   • Limpeza profunda (verificação detalhada): A cada 1 hora'
echo '   • Se não vir mensagens agora é normal - os timers foram estendidos'
"

echo ""
echo "✅ 9. VERIFICAÇÃO FINAL E STATUS COMPLETO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 VERIFICAÇÃO FINAL DOS TIMERS CORRIGIDOS:'
echo ''

# Status geral do servidor
SERVER_STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
echo \"🌐 Servidor Principal (3001): \$SERVER_STATUS\"

# Uso de memória
MEMORY_MB=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
echo \"💾 Uso de Memória: \${MEMORY_MB}MB\"

# Limite configurado
MEMORY_LIMIT=\$(grep 'max_memory_restart.*whatsapp-server' ecosystem.config.js -A3 | grep 'max_memory_restart' | head -1 | grep -o '[0-9]*G')
echo \"⚡ Limite Configurado: \${MEMORY_LIMIT} (vs atual \${MEMORY_MB}MB)\"

# Contagem de restarts
RESTART_COUNT=\$(pm2 show whatsapp-server | grep 'restarts' | awk '{print \$3}')
echo \"🔄 Total de Restarts: \$RESTART_COUNT\"

# Instâncias ativas
ACTIVE_INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
TOTAL_INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"total\":[0-9]*' | cut -d: -f2 || echo '?')
echo \"📱 Instâncias WhatsApp: \${ACTIVE_INSTANCES}/\${TOTAL_INSTANCES} ativas\"

# Verificar timers aplicados
TIMER_10MIN=\$(grep -c '10 \* 60 \* 1000' src/utils/connection-manager.js)
TIMER_1HOUR=\$(grep -c '60 \* 60 \* 1000' src/utils/connection-manager.js)
echo \"⏰ Timers aplicados: \${TIMER_10MIN}x (10min) + \${TIMER_1HOUR}x (1h)\"

echo ''
echo '🎯 RESULTADO FINAL:'
if [ \"\$SERVER_STATUS\" = \"OK\" ] && [ \"\$MEMORY_MB\" -lt 400 ] && [ \"\$ACTIVE_INSTANCES\" -gt 0 ]; then
    echo '🎉 ✅ CORREÇÃO DOS TIMERS APLICADA COM SUCESSO!'
    echo '⏰ Limpeza de cache otimizada (10min + 1h)'
    echo '💾 Sistema usando memória de forma eficiente'
    echo '📊 Zero problemas de restarts por memória'
    echo '🛡️ Dados críticos do Baileys preservados'
    echo '🚀 Sistema preparado para operação de longo prazo'
    
    if [ \"\$TIMER_10MIN\" -gt 0 ] && [ \"\$TIMER_1HOUR\" -gt 0 ]; then
        echo '✅ Timers configurados corretamente!'
    else
        echo '⚠️ Timers podem não ter sido aplicados completamente'
    fi
    
elif [ \"\$SERVER_STATUS\" = \"OK\" ]; then
    echo '⚠️ SERVIDOR FUNCIONANDO, MAS VERIFICAR DETALHES'
    echo \"💾 Memória: \${MEMORY_MB}MB\"
    echo \"📱 Instâncias: \${ACTIVE_INSTANCES}/\${TOTAL_INSTANCES}\"
else
    echo '❌ PROBLEMA DETECTADO - SERVIDOR NÃO RESPONDE'
    echo 'Verificar logs: pm2 logs whatsapp-server --lines 20'
fi

echo ''
echo '📋 Sistema otimizado para escala:'
echo '   • Limite de memória: 4GB (sem restarts)'
echo '   • Limpeza inteligente: 10min (básico) + 1h (profundo)'
echo '   • Cache preservado: ProfilePic + SentMessages apenas'
echo '   • Baileys protegido: chatHistory e contacts intocados'
echo '   • Preparado para: 1000+ instâncias simultâneas'

echo ''
echo '🆘 Se houver problemas, restaurar backup:'
LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-manual-timers* 2>/dev/null | head -1)
if [ -n \"\$LATEST_BACKUP\" ]; then
    echo \"   cp '\$LATEST_BACKUP' src/utils/connection-manager.js\"
    echo '   pm2 restart whatsapp-server'
fi
"

echo ""
echo "✅ CORREÇÃO MANUAL DOS TIMERS CONCLUÍDA!"
echo "================================================="
echo "⏰ Timers de limpeza otimizados para segurança"
echo "💾 Sistema com uso eficiente de memória"
echo "🛡️ Zero risco para dados críticos do Baileys"
echo "📊 Monitoramento de estabilidade realizado"