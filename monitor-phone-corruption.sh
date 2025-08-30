#!/bin/bash

# 🔍 MONITOR TEMPO REAL DE CORRUPÇÃO DE NÚMEROS
# Ferramenta para acompanhar logs e detectar números corrompidos

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"

echo "🔍 MONITOR DE CORRUPÇÃO DE NÚMEROS - TEMPO REAL"
echo "==============================================="
echo ""
echo "📱 Monitorando instâncias WhatsApp para detectar números corrompidos..."
echo "🚨 Procurando por: números com '107', '23925702810', ou length > 15"
echo "⭐ Logs úteis: JID original, telefone limpo, alertas de corrupção"
echo ""
echo "📋 LEGENDA DOS LOGS:"
echo "   🔍 [DEBUG] - Logs de depuração normais"  
echo "   🚨 [ALERT] - Alerta de número corrompido detectado"
echo "   📨 Nova mensagem - Mensagem recebida"
echo "   🔧 Limpeza de telefone - Processo de limpeza do JID"
echo ""
echo "⚡ CTRL+C para parar o monitoramento"
echo ""
echo "======================================================"

# Conectar na VPS e monitorar logs em tempo real
ssh $VPS_SERVER "
echo '🚀 Iniciando monitoramento em tempo real...'
echo '📡 Conectado à VPS - aguardando mensagens...'
echo ''

# Monitorar logs do whatsapp-server filtrando informações relevantes
pm2 logs whatsapp-server --lines 0 | grep --line-buffered -E 'DEBUG.*JID|ALERT.*CORROMPIDO|Nova mensagem|Limpeza de telefone|Telefone limpo' | while read line; do
  # Adicionar timestamp para facilitar análise
  echo \"\$(date '+%H:%M:%S') | \$line\"
done
"

echo ""
echo "📊 MONITORAMENTO FINALIZADO"
echo "========================="
echo "🔍 Se detectou algum número corrompido, os logs mostraram:"
echo "   1. O JID original que chegou da mensagem"
echo "   2. O número após a limpeza"
echo "   3. Alertas específicos de corrupção"
echo ""
echo "📋 Próximos passos se houver corrupção:"
echo "   1. Identificar se o JID já vem corrompido do Baileys"
echo "   2. Verificar se a corrupção acontece durante a limpeza"
echo "   3. Aplicar correção específica no local identificado"
echo ""