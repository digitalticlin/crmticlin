#!/bin/bash

# 🔧 APLICAR CORREÇÃO DE NÚMEROS CORROMPIDOS NA VPS
# Sistema inteligente para detectar e corrigir números corrompidos automaticamente

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"
VPS_PATH="/root/whatsapp-server"

echo "🔧 APLICANDO CORREÇÃO DE NÚMEROS CORROMPIDOS"
echo "============================================"
echo ""

echo "📱 CORREÇÕES QUE SERÃO APLICADAS:"
echo "   ✅ Detecção automática de números corrompidos"
echo "   ✅ Mapeamento direto: 107223925702810 → 556281242215"
echo "   ✅ Extração de padrão brasileiro (55XXYYYYYY)"
echo "   ✅ Detecção de DDD válido + adição de código 55"
echo "   ✅ Logs detalhados do processo de correção"
echo ""

echo "📊 1. BACKUP DO CONNECTION-MANAGER ATUAL"
echo "======================================="
ssh $VPS_SERVER "cd $VPS_PATH/src/utils && cp connection-manager.js connection-manager.js.backup.corruption.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup de correção criado"

echo ""
echo "📊 2. UPLOAD DA CORREÇÃO"
echo "======================="
# Copiar o arquivo local corrigido para a VPS
scp src/utils/connection-manager.js $VPS_SERVER:$VPS_PATH/src/utils/connection-manager.js
echo "✅ Correção enviada para VPS"

echo ""
echo "📊 3. VERIFICAR IMPLEMENTAÇÃO"
echo "============================"
ssh $VPS_SERVER "cd $VPS_PATH/src/utils && 
echo '🔍 Verificando funções de correção implementadas:'
echo ''
echo '1. Função isCorruptedNumber:'
grep -n 'isCorruptedNumber' connection-manager.js | head -2
echo ''
echo '2. Função fixCorruptedNumber:'
grep -n 'fixCorruptedNumber' connection-manager.js | head -2
echo ''
echo '3. Mapeamento conhecido:'
grep -n '107223925702810.*556281242215' connection-manager.js | head -1
echo ''
echo '4. Estratégias de correção:'
grep -n 'Estratégia [1-4]:' connection-manager.js
"

echo ""
echo "📊 4. REINICIAR SERVIDOR COM CORREÇÃO"
echo "==================================="
ssh $VPS_SERVER "
echo '🔄 Reiniciando whatsapp-server com correção de números...'
pm2 restart whatsapp-server
echo '✅ Servidor reiniciado com correção aplicada'
"

echo ""
echo "📊 5. TESTE DA CORREÇÃO"
echo "======================"
ssh $VPS_SERVER "
echo '📋 Status do servidor:'
pm2 status | grep whatsapp-server

echo ''
echo '📊 Aguardando inicialização (10 segundos)...'
sleep 10

echo ''
echo '🔍 Logs recentes - procurando correções:'
pm2 logs whatsapp-server --lines 20 --nostream | grep -E 'FIX|ALERT|Número corrigido' | tail -5
"

echo ""
echo "📊 6. MONITORAMENTO DE CORREÇÕES"
echo "==============================="
echo "🔍 Para monitorar correções em tempo real:"
echo "   ssh $VPS_SERVER"
echo "   pm2 logs whatsapp-server --lines 0 | grep -E 'FIX|ALERT|Número corrigido'"
echo ""
echo "🎯 O que procurar nos logs:"
echo "   ✅ '[FIX] Mapeamento direto encontrado' - correção por mapeamento"
echo "   ✅ '[FIX] Padrão brasileiro extraído' - correção por regex"
echo "   ✅ '[FIX] DDD extraído e 55 adicionado' - correção de DDD"
echo "   ⚠️ '[FIX] Não foi possível corrigir automaticamente' - falha na correção"
echo ""

echo "✅ CORREÇÃO DE NÚMEROS CORROMPIDOS APLICADA!"
echo "=========================================="
echo "🚀 Sistema agora detecta e corrige automaticamente:"
echo "   📱 Números que começam com '107'"
echo "   📱 Números com mais de 15 dígitos"
echo "   📱 Números com padrões conhecidos de corrupção"
echo ""
echo "🔧 Estratégias de correção ativas:"
echo "   1. Mapeamento direto de números conhecidos"
echo "   2. Extração de padrão brasileiro válido"
echo "   3. Detecção de DDD + adição do código 55"
echo "   4. Log para análise futura se não conseguir corrigir"
echo ""
echo "📋 PRÓXIMO PASSO: Teste enviando uma mensagem e observe os logs!"
echo ""