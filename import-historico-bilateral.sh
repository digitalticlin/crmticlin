#!/bin/bash

# 🎯 IMPORTAÇÃO DE HISTÓRICO BILATERAL + MÍDIA COMPLETA
# ✅ Importa histórico completo: INCOMING + OUTGOING + TODOS TIPOS DE MÍDIA

INSTANCE_ID="contatoluizantoniooliveira"
SERVER_URL="http://localhost:3002"

echo "🚀 INICIANDO IMPORTAÇÃO BILATERAL DO HISTÓRICO"
echo "📱 Instância: $INSTANCE_ID"
echo "📅 $(date)"
echo "============================================="

# 1. VERIFICAR SE INSTÂNCIA EXISTE E ESTÁ CONECTADA
echo "🔍 1. Verificando instância..."
INSTANCE_STATUS=$(curl -s "$SERVER_URL/instance/$INSTANCE_ID" | jq -r '.connected // false')

if [ "$INSTANCE_STATUS" != "true" ]; then
    echo "❌ Instância não conectada ou não encontrada!"
    echo "💡 Conecte a instância primeiro em: $SERVER_URL/instance/$INSTANCE_ID/qr"
    exit 1
fi

echo "✅ Instância conectada!"

# 2. EXECUTAR IMPORTAÇÃO BILATERAL
echo ""
echo "🔄 2. Iniciando importação bilateral + mídia..."

curl -X POST "$SERVER_URL/instance/$INSTANCE_ID/import-history" \
  -H "Content-Type: application/json" \
  -d '{
    "importBilateral": true,
    "includeOutgoing": true,
    "includeIncoming": true,
    "mediaTypes": ["text", "image", "video", "audio", "document", "sticker"],
    "processAllChats": true,
    "sendToWebhook": true,
    "checkDuplicates": true,
    "createdByUserId": "import-bilateral-'$(date +%Y%m%d)'"
  }' | jq '.'

echo ""
echo "⏱️  Aguardando processamento..."
sleep 5

# 3. MONITORAR PROGRESSO DA IMPORTAÇÃO
echo ""
echo "📊 3. Monitorando progresso..."

for i in {1..12}; do
    echo "   🔍 Verificação $i/12..."
    
    # Verificar logs de importação
    IMPORT_LOGS=$(pm2 logs whatsapp-server --lines 20 | grep -E "import|IMPORTAÇÃO|BILATERAL|ENVIADA|RECEBIDA" | tail -5)
    
    if [ ! -z "$IMPORT_LOGS" ]; then
        echo "   📋 Logs recentes da importação:"
        echo "$IMPORT_LOGS"
    fi
    
    echo "   ⏳ Aguardando 10 segundos..."
    sleep 10
done

# 4. RELATÓRIO FINAL
echo ""
echo "📊 4. Relatório final da importação..."

# Verificar últimas mensagens processadas
echo "   📱 Últimas mensagens bilaterais processadas:"
pm2 logs whatsapp-server --lines 50 | grep -E "ENVIADA PARA|RECEBIDA DE" | tail -10

echo ""
echo "   🔗 Verificar logs completos:"
echo "   pm2 logs whatsapp-server --lines 100 | grep -i import"

echo ""
echo "   🎯 Filtrar por tipos de mídia:"
echo "   pm2 logs whatsapp-server --lines 100 | grep -E 'TEXT|IMAGE|AUDIO|VIDEO'"

echo ""
echo "============================================="
echo "🎉 IMPORTAÇÃO BILATERAL CONCLUÍDA!"
echo "📅 $(date)"
echo ""
echo "📋 VERIFICAÇÕES RECOMENDADAS:"
echo "   1. Conferir logs: pm2 logs whatsapp-server --lines 50"
echo "   2. Verificar no CRM se aparecem mensagens incoming/outgoing"
echo "   3. Testar busca por diferentes tipos de mídia"
echo "   4. Confirmar timestamps corretos"
echo ""
echo "🔍 COMANDOS ÚTEIS:"
echo "   # Ver todas mensagens importadas:"
echo "   pm2 logs whatsapp-server | grep '$INSTANCE_ID.*📨'"
echo ""
echo "   # Ver por tipo de mídia:"
echo "   pm2 logs whatsapp-server | grep -E 'TEXT|IMAGE|AUDIO|VIDEO'"
echo ""
echo "   # Ver direções:"
echo "   pm2 logs whatsapp-server | grep -E 'ENVIADA PARA|RECEBIDA DE'"
echo "=============================================" 