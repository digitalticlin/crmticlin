
#!/bin/bash

# APLICAR RESTAURAÇÃO COM ROLLBACK AUTOMÁTICO
echo "🔧 APLICANDO RESTAURAÇÃO FUNCIONAL COM ROLLBACK AUTOMÁTICO"
echo "=========================================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Restaurar funcionalidade básica + adicionar GET QR endpoint"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "🛡️ FASE 1: BACKUP DE SEGURANÇA"
echo "=============================="

echo "📋 Criando backup do arquivo atual..."
if [ -f "vps-server-persistent.js" ]; then
    cp vps-server-persistent.js "vps-server-backup-restoration-$(date +%Y%m%d_%H%M%S).js"
    echo "✅ Backup criado"
else
    echo "⚠️ Arquivo atual não encontrado"
fi

echo ""
echo "📁 FASE 2: APLICAR RESTAURAÇÃO"
echo "============================="

echo "📋 Copiando arquivo de restauração..."
if [ -f "vps-server-working-restoration.js" ]; then
    cp vps-server-working-restoration.js vps-server-persistent.js
    echo "✅ Arquivo restaurado"
else
    echo "❌ Arquivo de restauração não encontrado!"
    echo "Você precisa criar o arquivo vps-server-working-restoration.js primeiro"
    exit 1
fi

echo ""
echo "🔄 FASE 3: REINICIAR SERVIDOR"
echo "============================"

echo "📋 Reiniciando PM2..."
pm2 restart whatsapp-main-3002

echo "⏳ Aguardando 5s para inicialização..."
sleep 5

echo ""
echo "🧪 FASE 4: TESTE DE FUNCIONALIDADE BÁSICA"
echo "========================================"

# Função para teste rápido
function test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 Testando $name... "
    
    response=$(timeout 5s curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" == "200" ]]; then
            echo "✅ SUCESSO ($http_code)"
            return 0
        else
            echo "❌ FALHA ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT/ERRO"
        return 1
    fi
}

# Testar endpoints básicos
echo "📊 Testando funcionalidade básica..."

test_endpoint "Health" "http://$VPS_IP:$PORTA/health"
health_result=$?

test_endpoint "Status" "http://$VPS_IP:$PORTA/status" 
status_result=$?

test_endpoint "Instances" "http://$VPS_IP:$PORTA/instances"
instances_result=$?

echo ""
echo "📊 RESULTADO DOS TESTES BÁSICOS:"
echo "================================"

if [[ $health_result -eq 0 && $status_result -eq 0 && $instances_result -eq 0 ]]; then
    echo "✅ TODOS OS TESTES BÁSICOS PASSARAM!"
    echo "✅ Health: SUCCESS"
    echo "✅ Status: SUCCESS" 
    echo "✅ Instances: SUCCESS"
    echo ""
    echo "🎯 Funcionalidade básica RESTAURADA com sucesso!"
    echo "📱 Endpoint GET QR adicionado: GET /instance/:instanceId/qr"
    echo ""
    echo "🧪 Para testar a jornada completa, execute:"
    echo "   ./teste-jornada-cliente-minimal.sh"
    
else
    echo "❌ FALHA NOS TESTES BÁSICOS!"
    echo "Health: $([ $health_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "Status: $([ $status_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "Instances: $([ $instances_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo ""
    echo "🔄 INICIANDO ROLLBACK AUTOMÁTICO..."
    
    # Verificar se existe backup mais recente
    latest_backup=$(ls -t vps-server-backup-restoration-*.js 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        echo "📋 Restaurando backup: $latest_backup"
        cp "$latest_backup" vps-server-persistent.js
        pm2 restart whatsapp-main-3002
        echo "✅ Rollback realizado"
    else
        echo "⚠️ Nenhum backup encontrado para rollback"
    fi
    
    echo "❌ RESTAURAÇÃO FALHOU - Sistema em estado anterior"
    exit 1
fi

echo ""
echo "✅ RESTAURAÇÃO COMPLETA COM SUCESSO!"
echo "===================================="
