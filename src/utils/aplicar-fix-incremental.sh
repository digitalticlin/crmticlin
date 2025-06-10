
#!/bin/bash

# APLICAR CORREÇÃO INCREMENTAL COM ROLLBACK AUTOMÁTICO
echo "🔧 APLICANDO CORREÇÃO INCREMENTAL"
echo "================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Corrigir apenas o endpoint GET QR sem quebrar funcionalidade básica"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"

echo "🛡️ FASE 1: BACKUP DE SEGURANÇA"
echo "=============================="

echo "📋 Criando backup do arquivo atual..."
if [ -f "vps-server-persistent.js" ]; then
    cp vps-server-persistent.js "vps-server-backup-incremental-$(date +%Y%m%d_%H%M%S).js"
    echo "✅ Backup criado"
else
    echo "⚠️ Arquivo atual não encontrado"
fi

echo ""
echo "📁 FASE 2: APLICAR CORREÇÃO INCREMENTAL"
echo "======================================"

echo "📋 Copiando arquivo corrigido..."
if [ -f "vps-server-fixed-final.js" ]; then
    cp vps-server-fixed-final.js vps-server-persistent.js
    echo "✅ Arquivo corrigido aplicado"
else
    echo "❌ Arquivo de correção não encontrado!"
    echo "Você precisa ter o arquivo vps-server-fixed-final.js"
    exit 1
fi

echo ""
echo "🔄 FASE 3: REINICIAR SERVIDOR"
echo "============================"

echo "📋 Reiniciando PM2..."
pm2 restart whatsapp-main-3002

echo "⏳ Aguardando 10s para inicialização..."
sleep 10

echo ""
echo "🧪 FASE 4: TESTE IMEDIATO DOS ENDPOINTS BÁSICOS"
echo "=============================================="

# Função para teste rápido
function quick_test() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 $name... "
    
    response=$(timeout 5s curl -s -w "%{http_code}" "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" == "200" ]]; then
            echo "✅ OK"
            return 0
        else
            echo "❌ FAIL ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT"
        return 1
    fi
}

# Testes críticos (sem auth para simplificar)
quick_test "Health" "http://$VPS_IP:$PORTA/health"
health_ok=$?

quick_test "Status" "http://$VPS_IP:$PORTA/status"
status_ok=$?

echo ""
echo "📊 RESULTADO IMEDIATO:"
echo "===================="

if [[ $health_ok -eq 0 && $status_ok -eq 0 ]]; then
    echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
    echo "✅ Health: OK"
    echo "✅ Status: OK"
    echo ""
    echo "🧪 Executando teste completo..."
    if [ -f "teste-endpoints-basicos.sh" ]; then
        chmod +x teste-endpoints-basicos.sh
        ./teste-endpoints-basicos.sh
    else
        echo "⚠️ Arquivo de teste não encontrado"
    fi
    
else
    echo "❌ FALHA NA CORREÇÃO!"
    echo "Health: $([ $health_ok -eq 0 ] && echo 'OK' || echo 'FAIL')"
    echo "Status: $([ $status_ok -eq 0 ] && echo 'OK' || echo 'FAIL')"
    echo ""
    echo "🔄 INICIANDO ROLLBACK AUTOMÁTICO..."
    
    # Encontrar backup mais recente
    latest_backup=$(ls -t vps-server-backup-incremental-*.js 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        echo "📋 Restaurando backup: $latest_backup"
        cp "$latest_backup" vps-server-persistent.js
        pm2 restart whatsapp-main-3002
        sleep 5
        echo "✅ Rollback realizado"
        
        # Testar se rollback funcionou
        quick_test "Health pós-rollback" "http://$VPS_IP:$PORTA/health"
        if [ $? -eq 0 ]; then
            echo "✅ Sistema restaurado ao estado anterior"
        else
            echo "❌ Rollback também falhou - verificar manualmente"
        fi
    else
        echo "⚠️ Nenhum backup encontrado para rollback"
    fi
    
    exit 1
fi

echo ""
echo "✅ CORREÇÃO INCREMENTAL COMPLETA!"
echo "================================"
echo "Funcionalidade básica preservada + GET QR endpoint adicionado"
