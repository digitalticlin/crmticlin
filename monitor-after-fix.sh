#!/bin/bash

# ============================================================================
# SCRIPT DE MONITORAMENTO PÓS-CORREÇÃO @LID
# ============================================================================
# Execute este script APÓS aplicar a correção para monitorar funcionamento

echo "🔍 MONITORAMENTO PÓS-CORREÇÃO @LID"
echo "=================================="
echo ""

echo "📊 1. STATUS DAS INSTÂNCIAS:"
pm2 list | grep whatsapp-server
echo ""

echo "📊 2. MEMÓRIA E CPU:"
pm2 monit whatsapp-server --lines 5 | head -10
echo ""

echo "📊 3. ÚLTIMOS LOGS GERAIS:"
echo "Últimas 20 linhas (sem spam de webhooks):"
pm2 logs whatsapp-server --lines 50 | grep -v "Webhook LeadUpdate\|Webhook Backend\|Webhook N8N" | tail -20
echo ""

echo "🔍 4. LOGS ESPECÍFICOS DA CORREÇÃO @LID:"
echo "Procurando por logs [REAL_LID]..."
pm2 logs whatsapp-server --lines 100 | grep "REAL_LID" | tail -10

if [ $? -eq 0 ]; then
    echo "✅ Sistema de correção @LID está ativo e funcionando"
else
    echo "⚠️ Nenhum log [REAL_LID] encontrado ainda - aguardando mensagens @lid"
fi
echo ""

echo "🔍 5. VERIFICANDO MENSAGENS @LID PROBLEMÁTICAS:"
echo "Procurando por logs antigos de @lid..."
pm2 logs whatsapp-server --lines 200 | grep -i "@lid" | tail -5

if [ $? -eq 0 ]; then
    echo ""
    echo "📋 Encontrados logs @lid - compare com os novos logs [REAL_LID]"
else
    echo "ℹ️ Nenhum log @lid antigo encontrado nos logs recentes"
fi
echo ""

echo "🔍 6. MONITORAMENTO CONTÍNUO:"
echo "Para monitorar em tempo real a correção @LID, execute:"
echo "pm2 logs whatsapp-server | grep -i --line-buffered 'REAL_LID\\|@lid'"
echo ""
echo "Para verificar apenas sucessos da correção:"
echo "pm2 logs whatsapp-server | grep --line-buffered 'REAL_LID.*SUCESSO'"
echo ""
echo "Para ver instâncias conectadas:"
echo "pm2 logs whatsapp-server | grep --line-buffered 'Conectado com sucesso'"
echo ""

echo "✅ MONITORAMENTO CONCLUÍDO"
echo ""
echo "🚨 SINAIS DE PROBLEMA:"
echo "- Se pm2 list mostrar 'errored' ou 'stopped'"
echo "- Se logs mostrarem erros de sintaxe"
echo "- Se instâncias não reconectarem em 2-3 minutos"
echo ""
echo "🔧 EM CASO DE PROBLEMA:"
echo "1. cd /root/whatsapp-server/src/utils"
echo "2. cp connection-manager.js.backup-lid-fix-* connection-manager.js"
echo "3. cd /root/whatsapp-server && pm2 restart whatsapp-server"