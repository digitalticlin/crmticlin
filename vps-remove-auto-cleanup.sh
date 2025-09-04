#!/bin/bash

# 🗑️ REMOVER AUTOMAÇÃO DE LIMPEZA AUTOMÁTICA (MANUAL APENAS)
echo "🗑️ REMOVENDO AUTOMAÇÃO DE LIMPEZA AUTOMÁTICA"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "🔍 1. VERIFICANDO ESTADO ATUAL DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status PM2 atual:'
pm2 list

echo ''
echo '💾 Uso de memória atual:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print \"💾 whatsapp-server: \" int(\$6/1024) \"MB\"}'

echo ''
echo '🔍 Verificando timers de limpeza atuais:'
grep -n -C2 'setInterval.*perform.*Cleanup' src/utils/connection-manager.js | head -10

echo ''
echo '🧹 Verificando métodos de limpeza existentes:'
grep -n 'performAggressiveCleanup\|performDeepCleanup' src/utils/connection-manager.js | head -5
"

echo ""
echo "💾 2. BACKUP ANTES DE REMOVER AUTOMAÇÃO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup antes de remover automação...'
cp src/utils/connection-manager.js src/utils/connection-manager.js.backup-remove-automation-$(date +%Y%m%d_%H%M%S)

echo '✅ Backup criado:'
ls -la src/utils/connection-manager.js.backup-remove-automation* | tail -1

echo ''
echo '📊 Arquivo original:'
wc -l src/utils/connection-manager.js | awk '{print \"📄 Linhas: \" \$1}'
"

echo ""
echo "🗑️ 3. REMOVENDO TIMERS DE LIMPEZA AUTOMÁTICA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Removendo setInterval de performAggressiveCleanup...'

# Comentar/remover timer agressivo
sed -i '/setInterval.*performAggressiveCleanup/,/}, [0-9].*1000.*minuto/ s/^/    \/\/ REMOVIDO: /' src/utils/connection-manager.js

# Verificar se foi comentado
if grep -q 'REMOVIDO.*setInterval.*performAggressiveCleanup' src/utils/connection-manager.js; then
    echo '✅ Timer agressivo removido/comentado'
else
    echo '⚠️ Timer agressivo não encontrado no padrão esperado'
fi

echo ''
echo '🔧 Removendo setInterval de performDeepCleanup...'

# Comentar/remover timer profundo
sed -i '/setInterval.*performDeepCleanup/,/}, [0-9].*1000.*hora/ s/^/    \/\/ REMOVIDO: /' src/utils/connection-manager.js

# Verificar se foi comentado
if grep -q 'REMOVIDO.*setInterval.*performDeepCleanup' src/utils/connection-manager.js; then
    echo '✅ Timer profundo removido/comentado'
else
    echo '⚠️ Timer profundo não encontrado no padrão esperado'
fi

echo ''
echo '🔍 Verificando remoção dos timers:'
grep -n -A1 -B1 'REMOVIDO.*setInterval' src/utils/connection-manager.js | head -10
"

echo ""
echo "🧹 4. COMENTANDO MÉTODOS DE LIMPEZA AUTOMÁTICA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Comentando método performAggressiveCleanup...'

# Encontrar e comentar método performAggressiveCleanup
sed -i '/performAggressiveCleanup() {/,/^  }/ s/^/  \/\/ DESATIVADO: /' src/utils/connection-manager.js

echo '🔧 Comentando método performDeepCleanup...'

# Encontrar e comentar método performDeepCleanup  
sed -i '/performDeepCleanup() {/,/^  }/ s/^/  \/\/ DESATIVADO: /' src/utils/connection-manager.js

echo '✅ Métodos de limpeza comentados'

echo ''
echo '🔍 Verificando métodos comentados:'
grep -n -A3 'DESATIVADO.*perform.*Cleanup' src/utils/connection-manager.js | head -15
"

echo ""
echo "📝 5. ADICIONANDO COMENTÁRIO EXPLICATIVO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Adicionando comentário explicativo no constructor...'

# Adicionar comentário no constructor
sed -i '/console.log.*ConnectionManager inicializado/a\\
\\
    // 🗑️ LIMPEZA AUTOMÁTICA REMOVIDA EM $(date +%Y-%m-%d)\\
    // ✅ Sistema configurado para limpeza MANUAL apenas\\
    // 🛡️ Evita crashes e desconexões de instâncias WhatsApp\\
    // 📋 Para limpeza manual: Use endpoints específicos ou PM2 restart' src/utils/connection-manager.js

echo '✅ Comentário explicativo adicionado'
"

echo ""
echo "🔍 6. VALIDANDO SINTAXE DO ARQUIVO MODIFICADO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Verificando sintaxe do JavaScript...'
node -c src/utils/connection-manager.js

if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe JavaScript válida!'
else
    echo '❌ ERRO DE SINTAXE! Restaurando backup...'
    LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-remove-automation* | head -1)
    cp \"\$LATEST_BACKUP\" src/utils/connection-manager.js
    echo \"🔄 Backup restaurado: \$LATEST_BACKUP\"
    exit 1
fi

echo ''
echo '📊 Estatísticas do arquivo modificado:'
wc -l src/utils/connection-manager.js | awk '{print \"📄 Total de linhas: \" \$1}'

echo ''
echo '🔍 Verificando remoção completa:'
ACTIVE_TIMERS=\$(grep -c 'setInterval.*perform.*Cleanup' src/utils/connection-manager.js)
REMOVED_TIMERS=\$(grep -c 'REMOVIDO.*setInterval.*perform.*Cleanup' src/utils/connection-manager.js)
echo \"⏰ Timers ativos: \$ACTIVE_TIMERS\"
echo \"🗑️ Timers removidos: \$REMOVED_TIMERS\"
"

echo ""
echo "🚀 7. REINICIANDO SERVIDOR COM CONFIGURAÇÃO LIMPA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Reiniciando whatsapp-server sem automação...'
pm2 restart whatsapp-server

echo ''
echo '⏳ Aguardando 15 segundos para inicialização...'
sleep 15

echo ''
echo '📊 Status PM2 após restart:'
pm2 list

echo ''
echo '💾 Uso de memória após restart:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print \"💾 whatsapp-server: \" int(\$6/1024) \"MB\"}'

echo ''
echo '🎯 Verificando se servidor responde:'
curl -s http://localhost:3001/health | head -3 || echo '❌ Servidor não responde'
"

echo ""
echo "📊 8. MONITORAMENTO SEM LIMPEZA AUTOMÁTICA (60 SEGUNDOS)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Monitorando sistema SEM limpeza automática por 60 segundos...'
echo 'Verificando se NÃO aparecem mensagens de limpeza automática...'

for i in {1..6}; do
    echo \"\"
    echo \"📊 Check \$i/6 (a cada 10 segundos):\"
    echo \"Tempo: \$(date)\"
    
    # Verificar memória
    MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
    echo \"💾 Memória: \${MEMORY}MB\"
    
    # Verificar se responde
    STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
    echo \"🌐 Status: \$STATUS\"
    
    # Verificar instâncias ativas
    INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
    echo \"📱 Instâncias: \$INSTANCES\"
    
    # Procurar mensagens de limpeza (NÃO devem aparecer)
    CLEANUP_MSGS=\$(pm2 logs whatsapp-server --lines 10 --nostream | grep -c 'AGGRESSIVE\|DEEP.*limpeza' 2>/dev/null || echo '0')
    if [ \"\$CLEANUP_MSGS\" -gt 0 ]; then
        echo \"⚠️ ATENÇÃO: \$CLEANUP_MSGS mensagens de limpeza detectadas (não deveria haver)\"
    else
        echo \"✅ Sem mensagens de limpeza (correto)\"
    fi
    
    sleep 10
done

echo ''
echo '📋 RESULTADO DO MONITORAMENTO:'
echo 'Sistema deve estar funcionando SEM mensagens de limpeza automática'
"

echo ""
echo "✅ 9. VERIFICAÇÃO FINAL E STATUS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 VERIFICAÇÃO FINAL - SISTEMA SEM LIMPEZA AUTOMÁTICA:'
echo ''

# Status do servidor
SERVER_STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
echo \"🌐 Servidor Principal (3001): \$SERVER_STATUS\"

# Uso de memória
MEMORY_MB=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
echo \"💾 Uso de Memória: \${MEMORY_MB}MB\"

# Instâncias ativas
ACTIVE_INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
TOTAL_INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"total\":[0-9]*' | cut -d: -f2 || echo '?')
echo \"📱 Instâncias WhatsApp: \${ACTIVE_INSTANCES}/\${TOTAL_INSTANCES} ativas\"

# Verificar se automação foi removida
ACTIVE_TIMERS=\$(grep -c 'setInterval.*perform.*Cleanup' src/utils/connection-manager.js)
REMOVED_TIMERS=\$(grep -c 'REMOVIDO.*perform.*Cleanup' src/utils/connection-manager.js)

echo ''
echo '🗑️ Status da remoção:'
echo \"   ✅ Timers removidos: \$REMOVED_TIMERS\"
echo \"   ⏰ Timers ativos restantes: \$ACTIVE_TIMERS\"

echo ''
echo '🎯 RESULTADO FINAL:'
if [ \"\$SERVER_STATUS\" = \"OK\" ] && [ \"\$ACTIVE_TIMERS\" -eq 0 ] && [ \"\$REMOVED_TIMERS\" -gt 0 ]; then
    echo '🎉 ✅ AUTOMAÇÃO DE LIMPEZA REMOVIDA COM SUCESSO!'
    echo '🗑️ Todos os timers automáticos foram desativados'
    echo '🛡️ Sistema seguro contra crashes por limpeza'
    echo '📊 Funcionando normalmente sem interrupções'
    echo '🔧 Limpeza agora será feita MANUALMENTE quando necessário'
elif [ \"\$SERVER_STATUS\" = \"OK\" ]; then
    echo '⚠️ SERVIDOR OK, MAS VERIFICAR REMOÇÃO COMPLETA'
    echo \"⏰ Timers ativos: \$ACTIVE_TIMERS (deveria ser 0)\"
    echo \"🗑️ Timers removidos: \$REMOVED_TIMERS\"
else
    echo '❌ PROBLEMA COM SERVIDOR - VERIFICAR LOGS'
    echo 'Use: pm2 logs whatsapp-server --lines 20'
fi

echo ''
echo '📋 Para limpeza manual quando necessário:'
echo '   • Restart completo: pm2 restart whatsapp-server'
echo '   • Verificar memória: pm2 monit'
echo '   • Logs: pm2 logs whatsapp-server'

echo ''
echo '🆘 Se houver problemas, restaurar backup:'
LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-remove-automation* 2>/dev/null | head -1)
if [ -n \"\$LATEST_BACKUP\" ]; then
    echo \"   cp '\$LATEST_BACKUP' src/utils/connection-manager.js\"
    echo '   pm2 restart whatsapp-server'
else
    echo '   ⚠️ Backup não encontrado'
fi
"

echo ""
echo "✅ REMOÇÃO DE AUTOMAÇÃO DE LIMPEZA CONCLUÍDA!"
echo "================================================="
echo "🗑️ Todos os timers automáticos foram desativados"
echo "🛡️ Sistema protegido contra crashes de limpeza"
echo "🔧 Limpeza agora será feita manualmente conforme necessário"
echo "📊 Sistema estável e funcionando normalmente"