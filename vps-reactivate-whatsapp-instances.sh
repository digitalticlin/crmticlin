#!/bin/bash

# 📱 REATIVAÇÃO DE INSTÂNCIAS WHATSAPP
# Reconectar todas as 9 instâncias salvas

echo "📱 REATIVAÇÃO DE INSTÂNCIAS WHATSAPP"
echo "Data: $(date)"
echo "======================================================"
echo "🎯 Objetivo: Reconectar as 9 instâncias WhatsApp salvas"
echo "✅ Sistema corrigido e funcionando"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"

# Lista das instâncias encontradas no diagnóstico anterior
INSTANCES=(
    "digitalticlin"
    "admcasaoficial"
    "imperioesportegyn"
    "paulamarisaames"
    "alinyvalerias" 
    "contatoluizantoniooliveira"
    "eneas"
    "marketing"
    "admgeuniformes"
)

# ============================================================
# 1. VERIFICAR SESSÕES DISPONÍVEIS
# ============================================================

echo ""
echo "📂 1. VERIFICANDO SESSÕES WHATSAPP DISPONÍVEIS"
echo "======================================================"

ssh $VPS_SERVER "
cd ~/whatsapp-server

echo '📂 Sessões WhatsApp disponíveis:'
if [ -d auth_info ]; then
    echo 'Diretórios encontrados:'
    ls -la auth_info/ | grep '^d' | awk '{print \$9}' | grep -v '^\\.$' | grep -v '^\\.\\.$'
    echo ''
    echo 'Total de sessões com credenciais:'
    find auth_info -name 'creds.json' | wc -l
    echo ''
    echo 'Sessões com creds.json:'
    find auth_info -name 'creds.json' -exec dirname {} \\; | sed 's|auth_info/||'
else
    echo '❌ Diretório auth_info não encontrado'
fi
"

# ============================================================
# 2. REATIVAR INSTÂNCIAS UMA POR UMA
# ============================================================

echo ""
echo "🚀 2. REATIVANDO INSTÂNCIAS WHATSAPP"
echo "======================================================"

ACTIVATED_COUNT=0
FAILED_COUNT=0

for instance in "${INSTANCES[@]}"; do
    echo ""
    echo "📱 Reativando instância: $instance"
    echo "----------------------------------------"
    
    # Verificar se a sessão existe
    SESSION_EXISTS=$(ssh $VPS_SERVER "[ -f ~/whatsapp-server/auth_info/$instance/creds.json ] && echo 'true' || echo 'false'")
    
    if [ "$SESSION_EXISTS" = "true" ]; then
        echo "✅ Sessão encontrada para $instance"
        
        # Criar instância via API
        RESPONSE=$(ssh $VPS_SERVER "curl -s -X POST http://localhost:3001/create-instance -H 'Content-Type: application/json' -d '{\"instanceId\": \"$instance\"}' | jq -r '.success' 2>/dev/null || echo 'error'")
        
        if [ "$RESPONSE" = "true" ]; then
            echo "✅ Instância $instance reativada com sucesso"
            ACTIVATED_COUNT=$((ACTIVATED_COUNT + 1))
            
            # Aguardar um pouco antes da próxima
            echo "⏳ Aguardando 5 segundos antes da próxima instância..."
            sleep 5
        else
            echo "❌ Falha ao reativar $instance"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            
            # Tentar obter mais detalhes do erro
            ERROR_DETAIL=$(ssh $VPS_SERVER "curl -s -X POST http://localhost:3001/create-instance -H 'Content-Type: application/json' -d '{\"instanceId\": \"$instance\"}' | jq -r '.error' 2>/dev/null || echo 'Erro desconhecido'")
            echo "   Erro: $ERROR_DETAIL"
        fi
    else
        echo "⚠️ Sessão não encontrada para $instance (sem creds.json)"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

# ============================================================
# 3. VERIFICAR STATUS FINAL DAS INSTÂNCIAS
# ============================================================

echo ""
echo "📊 3. STATUS FINAL DAS INSTÂNCIAS"
echo "======================================================"

ssh $VPS_SERVER "
echo '📱 Instâncias ativas no servidor:'
curl -s http://localhost:3001/instances | jq . || curl -s http://localhost:3001/instances

echo ''
echo '🩺 Health check do sistema:'
curl -s http://localhost:3001/health | jq -r '.instances, .connected' || echo 'Erro no health check'

echo ''
echo '📊 Status das filas:'
curl -s http://localhost:3001/queue-status | jq -r '.stats.total' || echo 'Erro no queue status'
"

# ============================================================
# 4. VERIFICAR QR CODES DISPONÍVEIS
# ============================================================

echo ""
echo "📱 4. VERIFICANDO QR CODES DISPONÍVEIS"
echo "======================================================"

echo "🔍 Verificando quais instâncias precisam de QR code..."

for instance in "${INSTANCES[@]}"; do
    QR_AVAILABLE=$(ssh $VPS_SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/qr/$instance")
    
    if [ "$QR_AVAILABLE" = "200" ]; then
        echo "📱 $instance: QR Code disponível -> http://IP:3001/qr/$instance"
    elif [ "$QR_AVAILABLE" = "404" ]; then
        echo "⚪ $instance: Sem QR (pode estar conectada ou inativa)"
    else
        echo "❓ $instance: Status desconhecido ($QR_AVAILABLE)"
    fi
done

# ============================================================
# 5. LOGS E MONITORAMENTO
# ============================================================

echo ""
echo "📋 5. LOGS E MONITORAMENTO"
echo "======================================================"

ssh $VPS_SERVER "
echo '📋 Logs recentes das conexões:'
pm2 logs whatsapp-server --lines 20 --nostream | grep -E '(Inicializando|conectada|QR|connected)' | tail -10

echo ''
echo '💻 Status do sistema:'
pm2 status
"

# ============================================================
# 6. RELATÓRIO FINAL
# ============================================================

echo ""
echo "📊 6. RELATÓRIO FINAL DE REATIVAÇÃO"
echo "======================================================"

echo "🎯 RESULTADOS DA REATIVAÇÃO:"
echo "   ✅ Instâncias reativadas: $ACTIVATED_COUNT"
echo "   ❌ Falhas: $FAILED_COUNT"
echo "   📱 Total de instâncias: ${#INSTANCES[@]}"

if [ $ACTIVATED_COUNT -gt 0 ]; then
    echo ""
    echo "✅ REATIVAÇÃO PARCIAL/COMPLETA!"
    echo "======================================================"
    echo "🚀 Próximos passos:"
    echo "   1. Verificar QR codes: http://IP:3001/qr/INSTANCE_ID"
    echo "   2. Escanear QR codes necessários"
    echo "   3. Monitorar conexões: curl http://localhost:3001/instances"
    echo "   4. Testar envios: POST /send-message"
else
    echo ""
    echo "⚠️ NENHUMA INSTÂNCIA REATIVADA"
    echo "======================================================"
    echo "🔧 Possíveis causas:"
    echo "   • Sessões corrompidas"
    echo "   • Servidor não está totalmente inicializado"
    echo "   • Problemas de conectividade"
    echo ""
    echo "🔍 Investigar:"
    echo "   • pm2 logs whatsapp-server"
    echo "   • curl http://localhost:3001/health"
fi

echo ""
echo "📱 Para verificar instâncias ativas:"
echo "   curl http://localhost:3001/instances | jq"
echo ""
echo "📱 Para obter QR de uma instância:"
echo "   curl http://localhost:3001/qr/INSTANCE_ID > qr.png"
echo ""
echo "🚀 REATIVAÇÃO CONCLUÍDA!"
echo "======================================================"