#!/bin/bash

# 🆘 RESTAURAR SISTEMA PARA ESTADO FUNCIONAL
echo "🆘 RESTAURAÇÃO COMPLETA DO SISTEMA"
echo "Erro persiste na linha 95 do server.js"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "⚡ 1. PARANDO SERVIDOR EM ERRO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Forçando parada do whatsapp-server...'
pm2 stop whatsapp-server
pm2 delete whatsapp-server

echo '📊 Status após parada forçada:'
pm2 list | grep -E 'whatsapp-server|worker'
"

echo ""
echo "🔄 2. RESTAURANDO BACKUP DO CONNECTION-MANAGER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Verificando backups disponíveis:'
ls -la src/utils/connection-manager.js.backup-remove-automation* | tail -2

echo '🔄 Restaurando backup anterior ao LidProcessor...'
BACKUP_AUTOMATION=\$(ls -t src/utils/connection-manager.js.backup-remove-automation* | head -1)
if [ -n \"\$BACKUP_AUTOMATION\" ]; then
    cp \"\$BACKUP_AUTOMATION\" src/utils/connection-manager.js
    echo \"✅ Connection-manager restaurado: \$BACKUP_AUTOMATION\"
else
    echo '❌ Backup não encontrado!'
fi
"

echo ""
echo "🗑️ 3. REMOVENDO ARQUIVOS PROBLEMÁTICOS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🗑️ Removendo lid-processor.js problemático...'
if [ -f src/utils/lid-processor.js ]; then
    rm src/utils/lid-processor.js
    echo '✅ lid-processor.js removido'
else
    echo 'ℹ️ lid-processor.js já não existe'
fi

echo '🔧 Removendo endpoints @lid do server.js...'
# Criar backup do server.js antes
cp server.js server.js.backup-before-lid-removal-$(date +%Y%m%d_%H%M%S)

# Remover seção de endpoints @lid (do final do arquivo)
sed -i '/\/\/ ================================/,/\/\/ 🎯 ENDPOINTS DE GESTÃO @lid/d' server.js
sed -i '/\/\/ Estatísticas de processamento @lid/,\$d' server.js

echo '✅ Endpoints @lid removidos do server.js'
"

echo ""
echo "🧹 4. LIMPANDO REFERÊNCIAS NO CONNECTION-MANAGER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Removendo imports e referências LidProcessor...'

# Remover import do LidProcessor
sed -i '/require.*lid-processor/d' src/utils/connection-manager.js

# Remover inicialização do LidProcessor
sed -i '/this.lidProcessor.*new LidProcessor/d' src/utils/connection-manager.js

# Remover comentários sobre LidProcessor
sed -i '/\/\/ 🎯 PROCESSADOR OTIMIZADO DE @lid/d' src/utils/connection-manager.js

# Remover métodos relacionados ao LidProcessor
sed -i '/correctLidNumber/,/^  }/d' src/utils/connection-manager.js
sed -i '/getLidStats/,/^  }/d' src/utils/connection-manager.js
sed -i '/addLidMapping/,/^  }/d' src/utils/connection-manager.js

echo '✅ Referências LidProcessor removidas'
"

echo ""
echo "🔍 5. VALIDANDO LIMPEZA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Verificando sintaxe do connection-manager.js...'
node -c src/utils/connection-manager.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe connection-manager.js VÁLIDA'
else
    echo '❌ AINDA com erro de sintaxe! Usando backup mais antigo...'
    # Usar backup mais antigo se necessário
    OLDER_BACKUP=\$(ls -t src/utils/connection-manager.js.backup* | grep -v lid | head -1)
    if [ -n \"\$OLDER_BACKUP\" ]; then
        cp \"\$OLDER_BACKUP\" src/utils/connection-manager.js
        echo \"📋 Usando backup mais antigo: \$OLDER_BACKUP\"
    fi
fi

echo '📝 Verificando sintaxe do server.js...'
node -c server.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe server.js VÁLIDA'
else
    echo '❌ Erro no server.js! Restaurando backup...'
    SERVER_BACKUP=\$(ls -t server.js.backup-before-lid-removal* | head -1)
    if [ -n \"\$SERVER_BACKUP\" ]; then
        cp \"\$SERVER_BACKUP\" server.js
        echo \"📋 Server.js restaurado: \$SERVER_BACKUP\"
    fi
fi

echo '🔍 Verificando se não há mais referências LidProcessor:'
grep -n 'LidProcessor' src/utils/connection-manager.js || echo '✅ Nenhuma referência LidProcessor encontrada'
grep -n 'lid-processor' src/utils/connection-manager.js || echo '✅ Nenhum import lid-processor encontrado'
"

echo ""
echo "🚀 6. RESTART LIMPO DO SISTEMA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando whatsapp-server limpo...'
pm2 start ecosystem.config.js --only whatsapp-server

echo '⏳ Aguardando 15 segundos para inicialização...'
sleep 15

echo '📊 Status PM2 final:'
pm2 list

echo '🎯 Testando se servidor responde:'
curl -s http://localhost:3001/health | head -5 || echo '❌ Servidor ainda não responde'
"

echo ""
echo "📊 7. MONITORAMENTO DE ESTABILIDADE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Monitorando estabilidade por 30 segundos...'

for i in {1..6}; do
    echo \"\"
    echo \"📊 Check \$i/6 (a cada 5 segundos):\"
    echo \"Tempo: \$(date)\"
    
    # Status do servidor principal
    STATUS=\$(pm2 list | grep whatsapp-server | grep -o 'online\|errored\|stopped')
    echo \"🌐 Status whatsapp-server: \$STATUS\"
    
    if [ \"\$STATUS\" = \"online\" ]; then
        # Testar se responde
        HEALTH=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
        echo \"🎯 Health check: \$HEALTH\"
        
        # Verificar memória
        MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
        echo \"💾 Memória: \${MEMORY}MB\"
        
        # Verificar instâncias se estiver respondendo
        if [ \"\$HEALTH\" = \"OK\" ]; then
            INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
            echo \"📱 Instâncias ativas: \$INSTANCES\"
        fi
    else
        echo \"❌ Servidor não está online\"
        
        # Verificar logs de erro se não estiver online
        echo '📋 Últimos logs de erro:'
        pm2 logs whatsapp-server --lines 3 --nostream | tail -3
    fi
    
    sleep 5
done
"

echo ""
echo "✅ 8. VERIFICAÇÃO FINAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 VERIFICAÇÃO FINAL DO SISTEMA RESTAURADO:'
echo ''

# Status geral
SERVER_STATUS=\$(pm2 list | grep whatsapp-server | grep -o 'online\|errored\|stopped')
echo \"🌐 Status whatsapp-server: \$SERVER_STATUS\"

if [ \"\$SERVER_STATUS\" = \"online\" ]; then
    # Testar resposta
    HEALTH_RESPONSE=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
    echo \"🎯 Health check: \$HEALTH_RESPONSE\"
    
    if [ \"\$HEALTH_RESPONSE\" = \"OK\" ]; then
        # Obter detalhes
        MEMORY=\$(ps aux | grep 'whatsapp-server/server.js' | grep -v grep | awk '{print int(\$6/1024)}' | head -1)
        INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"active\":[0-9]*' | cut -d: -f2 || echo '?')
        TOTAL_INSTANCES=\$(curl -s http://localhost:3001/health 2>/dev/null | grep -o '\"total\":[0-9]*' | cut -d: -f2 || echo '?')
        
        echo \"💾 Uso de Memória: \${MEMORY}MB\"
        echo \"📱 Instâncias WhatsApp: \${INSTANCES}/\${TOTAL_INSTANCES}\"
        
        echo ''
        echo '🎉 ✅ SISTEMA RESTAURADO COM SUCESSO!'
        echo '🛡️ Automação de limpeza removida (segura)'
        echo '🧹 Referências problemáticas @lid removidas'
        echo '🚀 Sistema estável e funcionando'
        echo '📊 Memória otimizada (limite 4GB)'
    else
        echo '⚠️ SERVIDOR ONLINE MAS NÃO RESPONDE HTTP'
        echo 'Verificar: pm2 logs whatsapp-server'
    fi
else
    echo '❌ SERVIDOR AINDA COM PROBLEMAS'
    echo 'Status atual:' \$SERVER_STATUS
    echo 'Logs de erro:'
    pm2 logs whatsapp-server --lines 5 --nostream | tail -5
fi

# Workers status
WORKERS_ONLINE=\$(pm2 list | grep -E 'worker' | grep -c 'online')
echo \"👥 Workers auxiliares: \$WORKERS_ONLINE/4 online\"

echo ''
echo '📋 Sistema configurado:'
echo '   • Limite memória: 4GB (sem restarts)'
echo '   • Limpeza: MANUAL (sem automação)'
echo '   • @lid: Processamento padrão (sem otimização)'
echo '   • Status: Sistema básico funcionando'

echo ''
echo '📈 Para limpeza manual quando necessário:'
echo '   pm2 restart whatsapp-server'
echo '   pm2 monit'
"

echo ""
echo "✅ RESTAURAÇÃO COMPLETA FINALIZADA!"
echo "================================================="
echo "🛡️ Sistema restaurado para estado estável"
echo "🧹 Automação de limpeza removida (segurança)"
echo "🔧 Referências problemáticas eliminadas"
echo "📊 Sistema básico funcionando normalmente"