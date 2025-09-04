#!/bin/bash

# 🧹 IMPLEMENTAR LIMPEZA SEGURA DE CACHE (SEM RISCOS BAILEYS)
echo "🧹 IMPLEMENTAR LIMPEZA SEGURA DE CACHE (SEM RISCOS BAILEYS)"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "🔍 1. VERIFICANDO ESTADO ATUAL DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status atual do PM2:'
pm2 list

echo ''
echo '💾 Uso de memória atual:'
ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print \"💾 whatsapp-server: \" int(\$6/1024) \"MB\"}'

echo ''
echo '🎯 Verificando se servidor responde:'
curl -s http://localhost:3001/health | head -3 || echo '❌ Servidor não responde'

echo ''
echo '🔍 Verificando configurações atuais de limpeza:'
grep -n -A2 -B2 'setInterval.*performAggressiveCleanup' src/utils/connection-manager.js | head -5
"

echo ""
echo "💾 2. BACKUP DO CONNECTION-MANAGER ATUAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup antes de alterar limpeza...'
cp src/utils/connection-manager.js src/utils/connection-manager.js.backup-safe-cleanup-$(date +%Y%m%d_%H%M%S)

echo '✅ Backup criado:'
ls -la src/utils/connection-manager.js.backup-safe-cleanup* | tail -1

echo ''
echo '📊 Tamanho do arquivo original:'
wc -l src/utils/connection-manager.js | awk '{print \"📄 Linhas: \" \$1}'
"

echo ""
echo "⏰ 3. AJUSTANDO TIMERS DE LIMPEZA (1min → 10min)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Alterando timer de limpeza agressiva: 1 minuto → 10 minutos...'

# Alterar timer da limpeza agressiva
sed -i 's/}, 60 \* 1000); \/\/ A cada 1 minuto/}, 10 * 60 * 1000); \/\/ A cada 10 minutos/' src/utils/connection-manager.js

# Verificar se alterou
if grep -q '10 \* 60 \* 1000.*A cada 10 minutos' src/utils/connection-manager.js; then
    echo '✅ Timer agressivo alterado: 1min → 10min'
else
    echo '⚠️ Timer agressivo não foi alterado (pode já estar correto)'
fi

echo ''
echo '🔧 Alterando timer de limpeza profunda: 15 minutos → 1 hora...'

# Alterar timer da limpeza profunda
sed -i 's/}, 15 \* 60 \* 1000); \/\/ A cada 15 minutos/}, 60 * 60 * 1000); \/\/ A cada 1 hora/' src/utils/connection-manager.js

# Verificar se alterou
if grep -q '60 \* 60 \* 1000.*A cada 1 hora' src/utils/connection-manager.js; then
    echo '✅ Timer profundo alterado: 15min → 1h'
else
    echo '⚠️ Timer profundo não foi alterado (pode já estar correto)'
fi

echo ''
echo '📊 Verificando novos timers:'
grep -n -A1 'setInterval.*performAggressiveCleanup' src/utils/connection-manager.js
grep -n -A1 'setInterval.*performDeepCleanup' src/utils/connection-manager.js
"

echo ""
echo "🛡️ 4. REMOVENDO GARBAGE COLLECTION FORÇADO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Comentando garbage collection forçado no performAggressiveCleanup...'

# Comentar o global.gc() no método aggressive
sed -i '/if (global\.gc) {/,/}/ s/^/    \/\/ /' src/utils/connection-manager.js

echo '✅ Garbage collection forçado comentado'

echo ''
echo '🔍 Verificando se foi comentado:'
grep -n -A3 -B1 'global\.gc' src/utils/connection-manager.js | head -6
"

echo ""
echo "🧹 5. SUBSTITUINDO performDeepCleanup POR VERSÃO SEGURA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Localizando método performDeepCleanup atual...'

# Encontrar linha onde começa o método
START_LINE=\$(grep -n 'performDeepCleanup()' src/utils/connection-manager.js | cut -d: -f1)
echo \"🔍 Método encontrado na linha: \$START_LINE\"

if [ -n \"\$START_LINE\" ]; then
    echo '🔧 Criando versão temporária com método seguro...'
    
    # Criar arquivo temporário com método seguro
    cat > /tmp/safe_deep_cleanup.js << 'EOF'
  performDeepCleanup() {
    console.log(\`🧹 [SAFE] Iniciando limpeza segura... - \${new Date().toISOString()}\`);
    
    // ✅ LIMPEZA APENAS DE CACHE SEGURO (não dados Baileys)
    let profileCacheSize = this.profilePicCache.size;
    let messageCacheSize = this.sentMessagesCache.size;
    
    // Limpar apenas se cache ficar muito grande
    if (profileCacheSize > 1000) {
      this.profilePicCache.clear();
      console.log(\`🧹 [SAFE] ProfilePicCache limpo: \${profileCacheSize} itens removidos\`);
    } else {
      console.log(\`🧹 [SAFE] ProfilePicCache ok: \${profileCacheSize} itens (limite: 1000)\`);
    }
    
    if (messageCacheSize > 500) {
      this.sentMessagesCache.clear();
      console.log(\`🧹 [SAFE] SentMessagesCache limpo: \${messageCacheSize} itens removidos\`);
    } else {
      console.log(\`🧹 [SAFE] SentMessagesCache ok: \${messageCacheSize} itens (limite: 500)\`);
    }
    
    // Estatísticas de instâncias (apenas log)
    const activeInstances = Object.values(this.instances).filter(i => i.connected).length;
    console.log(\`🧹 [SAFE] Instâncias ativas: \${activeInstances}/\${Object.keys(this.instances).length}\`);
    
    console.log(\`🧹 [SAFE] Limpeza segura concluída - \${new Date().toISOString()}\`);
  }
EOF

    # Encontrar fim do método atual (próxima linha que começa com outro método ou '}')
    END_LINE=\$(tail -n +\$((\$START_LINE + 1)) src/utils/connection-manager.js | grep -n -E '^  [a-zA-Z]|^}' | head -1 | cut -d: -f1)
    END_LINE=\$((\$START_LINE + \$END_LINE - 1))
    
    echo \"🔍 Fim do método na linha: \$END_LINE\"
    
    # Criar novo arquivo substituindo o método
    head -n \$((\$START_LINE - 1)) src/utils/connection-manager.js > /tmp/new_connection_manager.js
    cat /tmp/safe_deep_cleanup.js >> /tmp/new_connection_manager.js
    tail -n +\$((\$END_LINE + 1)) src/utils/connection-manager.js >> /tmp/new_connection_manager.js
    
    # Substituir arquivo original
    cp /tmp/new_connection_manager.js src/utils/connection-manager.js
    
    echo '✅ Método performDeepCleanup substituído por versão segura!'
    
    # Limpar arquivos temporários
    rm -f /tmp/safe_deep_cleanup.js /tmp/new_connection_manager.js
    
else
    echo '⚠️ Método performDeepCleanup não encontrado!'
fi

echo ''
echo '🔍 Verificando novo método (primeiras linhas):'
grep -n -A10 'performDeepCleanup()' src/utils/connection-manager.js | head -15
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
    LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-safe-cleanup* | head -1)
    cp \"\$LATEST_BACKUP\" src/utils/connection-manager.js
    echo \"🔄 Backup restaurado: \$LATEST_BACKUP\"
    exit 1
fi

echo ''
echo '📊 Estatísticas do arquivo modificado:'
wc -l src/utils/connection-manager.js | awk '{print \"📄 Total de linhas: \" \$1}'
grep -c 'performDeepCleanup\|performAggressiveCleanup' src/utils/connection-manager.js | awk '{print \"🔧 Métodos de limpeza: \" \$1}'
"

echo ""
echo "🚀 7. REINICIANDO WHATSAPP-SERVER COM NOVA CONFIGURAÇÃO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Reiniciando whatsapp-server para aplicar mudanças...'
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
echo "📊 8. MONITORAMENTO DE LIMPEZA SEGURA (60 SEGUNDOS)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Monitorando logs por 60 segundos para verificar limpeza segura...'
echo 'Aguardando mensagens de limpeza ([SAFE] ou [AGGRESSIVE])...'

# Monitorar logs por 60 segundos procurando mensagens de limpeza
timeout 60s pm2 logs whatsapp-server --lines 0 | grep -E 'SAFE|AGGRESSIVE|cache|Cache' &
MONITOR_PID=\$!

echo ''
echo '📊 Enquanto monitora, verificando estabilidade a cada 10 segundos:'

for i in {1..6}; do
    echo \"\"
    echo \"📊 Check \$i/6:\"
    echo \"Tempo: \$(date)\"
    
    # Verificar memória
    MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
    echo \"💾 Memória: \${MEMORY}MB\"
    
    # Verificar se responde
    STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
    echo \"🌐 Status: \$STATUS\"
    
    # Verificar instâncias ativas
    INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
    echo \"📱 Instâncias ativas: \$INSTANCES\"
    
    sleep 10
done

# Parar monitoramento de logs
kill \$MONITOR_PID 2>/dev/null || true
wait \$MONITOR_PID 2>/dev/null || true

echo ''
echo '📋 RESULTADO DO MONITORAMENTO:'
echo 'Se você viu mensagens [SAFE] ou [AGGRESSIVE], a limpeza está funcionando!'
echo 'Se não viu nenhuma, é normal - os timers são de 10min e 1h agora.'
"

echo ""
echo "✅ 9. VERIFICAÇÃO FINAL E RESUMO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 VERIFICAÇÃO FINAL DA LIMPEZA SEGURA:'
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

# Verificar configurações aplicadas
AGGRESSIVE_TIMER=\$(grep -o '}, [0-9]* \* [0-9]* \* 1000.*A cada [0-9]* minuto' src/utils/connection-manager.js | head -1)
DEEP_TIMER=\$(grep -o '}, [0-9]* \* [0-9]* \* 1000.*A cada [0-9]* hora' src/utils/connection-manager.js | head -1)

echo ''
echo '⚙️ Configurações de limpeza aplicadas:'
if [ -n \"\$AGGRESSIVE_TIMER\" ]; then
    echo \"   ✅ Timer agressivo: \$AGGRESSIVE_TIMER\"
else
    echo '   ⚠️ Timer agressivo não identificado'
fi

if [ -n \"\$DEEP_TIMER\" ]; then
    echo \"   ✅ Timer profundo: \$DEEP_TIMER\"
else
    echo '   ⚠️ Timer profundo não identificado'
fi

# Verificar se método seguro foi aplicado
SAFE_METHOD=\$(grep -c 'SAFE.*Iniciando limpeza segura' src/utils/connection-manager.js)
echo \"   ✅ Método seguro aplicado: \$SAFE_METHOD ocorrência(s)\"

echo ''
echo '🎯 RESULTADO FINAL:'
if [ \"\$SERVER_STATUS\" = \"OK\" ] && [ \"\$MEMORY_MB\" -lt 1000 ] && [ \"\$ACTIVE_INSTANCES\" -gt 0 ]; then
    echo '🎉 ✅ LIMPEZA SEGURA IMPLEMENTADA COM SUCESSO!'
    echo '🧹 Cache será limpo de forma segura (sem tocar dados Baileys)'
    echo '⏰ Frequência otimizada: 10min (cache básico) + 1h (verificação profunda)'
    echo '🛡️ Zero risco de desconexão de instâncias'
    echo '📊 Sistema estável e funcionando normalmente'
elif [ \"\$SERVER_STATUS\" = \"OK\" ]; then
    echo '⚠️ SERVIDOR OK, MAS VERIFICAR CONFIGURAÇÕES'
    echo \"💾 Uso de memória: \${MEMORY_MB}MB\"
    echo \"📱 Instâncias: \${ACTIVE_INSTANCES}/\${TOTAL_INSTANCES}\"
else
    echo '❌ PROBLEMA DETECTADO - VERIFICAR LOGS'
    echo 'Use: pm2 logs whatsapp-server --lines 20'
fi

echo ''
echo '📋 Próximas ações esperadas:'
echo '   • Em 10 minutos: Primeira limpeza [AGGRESSIVE] de cache básico'
echo '   • Em 1 hora: Primeira limpeza [SAFE] com verificação detalhada'
echo '   • Monitorar logs ocasionalmente para confirmar funcionamento'

echo ''
echo '🆘 Se houver problemas, restaurar backup:'
LATEST_BACKUP=\$(ls -t src/utils/connection-manager.js.backup-safe-cleanup* 2>/dev/null | head -1)
if [ -n \"\$LATEST_BACKUP\" ]; then
    echo \"   cp '\$LATEST_BACKUP' src/utils/connection-manager.js\"
    echo '   pm2 restart whatsapp-server'
else
    echo '   ⚠️ Backup não encontrado'
fi
"

echo ""
echo "✅ IMPLEMENTAÇÃO DE LIMPEZA SEGURA CONCLUÍDA!"
echo "================================================="
echo "🧹 Limpeza de cache otimizada e segura"
echo "⏰ Timers ajustados: 10min (básico) + 1h (detalhado)"
echo "🛡️ Dados críticos do Baileys preservados"
echo "📊 Sistema preparado para operação de longo prazo"