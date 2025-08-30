#!/bin/bash

# 🔍 ATUALIZAR CONNECTION-MANAGER COM LOGS DE DEBUG
# Aplicar logs detalhados para identificar corrupção de números

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"
VPS_PATH="/root/whatsapp-server"

echo "🔍 APLICANDO LOGS DE DEBUG NO CONNECTION-MANAGER"
echo "==============================================="
echo ""

echo "📊 1. BACKUP DO CONNECTION-MANAGER ATUAL"
echo "======================================="
ssh $VPS_SERVER "cd $VPS_PATH/src/utils && cp connection-manager.js connection-manager.js.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"

echo ""
echo "📊 2. UPLOAD DO NOVO CONNECTION-MANAGER"
echo "======================================"
# Copiar o arquivo local para a VPS
scp src/utils/connection-manager.js $VPS_SERVER:$VPS_PATH/src/utils/connection-manager.js
echo "✅ Arquivo enviado para VPS"

echo ""
echo "📊 3. VERIFICAR DIFERENÇAS"
echo "========================="
ssh $VPS_SERVER "cd $VPS_PATH/src/utils && 
echo '🔍 Verificando se logs de debug foram adicionados:'
grep -n 'DEBUG.*JID' connection-manager.js | head -5
echo ''
echo '🔍 Verificando se alert de corrupção foi adicionado:'
grep -n 'NÚMERO CORROMPIDO DETECTADO' connection-manager.js | head -2
"

echo ""
echo "📊 4. REINICIAR WHATSAPP-SERVER"
echo "==============================="
ssh $VPS_SERVER "
echo '🔄 Reiniciando whatsapp-server para aplicar mudanças...'
pm2 restart whatsapp-server
echo '✅ Servidor reiniciado'
"

echo ""
echo "📊 5. VERIFICAR STATUS"
echo "======================"
ssh $VPS_SERVER "
echo '📋 Status PM2:'
pm2 status | grep whatsapp-server

echo ''
echo '📊 Aguardando 5 segundos para inicialização...'
sleep 5

echo ''
echo '📊 Logs recentes (últimas 10 linhas):'
pm2 logs whatsapp-server --lines 10 --nostream | grep -E 'DEBUG|ALERT|Nova mensagem'
"

echo ""
echo "📊 6. INSTRUÇÕES DE MONITORAMENTO"
echo "================================="
echo "🔍 Para monitorar em tempo real:"
echo "   ssh $VPS_SERVER"
echo "   pm2 logs whatsapp-server --lines 0 | grep -E 'DEBUG|ALERT|Nova mensagem'"
echo ""
echo "🎯 O que procurar nos logs:"
echo "   1. 'JID original: ...' - mostra o JID antes da limpeza"
echo "   2. 'Telefone limpo: ...' - mostra o número após limpeza"
echo "   3. 'NÚMERO CORROMPIDO DETECTADO' - alerta de corrupção"
echo ""
echo "📱 Para testar:"
echo "   1. Envie uma mensagem de WhatsApp para a instância"
echo "   2. Observe os logs em tempo real"
echo "   3. Verifique se aparece algum número corrompido"
echo ""

echo "✅ LOGS DE DEBUG APLICADOS!"
echo "=========================="
echo "🚀 O sistema agora irá mostrar logs detalhados de todos os números"
echo "🔍 Monitore os logs para identificar a fonte da corrupção"
echo ""