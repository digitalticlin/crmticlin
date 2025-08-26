#!/bin/bash

# 🧹 SCRIPT DE LIMPEZA: Instâncias problemáticas na VPS
# Execute na VPS: bash cleanup_instances_vps.sh

echo "🧹 LIMPEZA DE INSTÂNCIAS PROBLEMÁTICAS - VPS WhatsApp"
echo "===================================================="

# 1. Definir instâncias para limpeza
WAITING_QR_INSTANCES=(
    "admgeuniformes1"
    "admgeuniformes2" 
    "digitalticlin1"
    "marketing1"
    "marketing1755188478427l9qlcv"
)

LOGGED_OUT_INSTANCES=(
    "contatoluizantoniooliveira"
    "mauroticlin"
)

# 2. Função para deletar instância via API
delete_instance_api() {
    local instance_id=$1
    echo "🗑️ Deletando instância via API: $instance_id"
    
    curl -s -X POST "http://localhost:3001/instance/$instance_id/logout" \
         -H "Content-Type: application/json" || echo "   ⚠️ API logout falhou"
    
    sleep 1
    
    curl -s -X DELETE "http://localhost:3001/instance/$instance_id/delete" \
         -H "Content-Type: application/json" || echo "   ⚠️ API delete falhou"
}

# 3. Função para limpar pasta de autenticação
clean_auth_folder() {
    local instance_id=$1
    local auth_path="/root/whatsapp-server/auth_info/$instance_id"
    
    if [ -d "$auth_path" ]; then
        echo "📁 Removendo pasta de autenticação: $auth_path"
        rm -rf "$auth_path"
        echo "   ✅ Pasta removida"
    else
        echo "   ℹ️ Pasta não existe: $auth_path"
    fi
}

# 4. Limpar instâncias aguardando QR
echo ""
echo "🔄 LIMPANDO INSTÂNCIAS AGUARDANDO QR (evitar polling):"
echo "====================================================="

for instance in "${WAITING_QR_INSTANCES[@]}"; do
    echo ""
    echo "🧹 Processando: $instance"
    delete_instance_api "$instance"
    clean_auth_folder "$instance"
done

# 5. Limpar instâncias deslogadas
echo ""
echo "🔓 LIMPANDO INSTÂNCIAS DESLOGADAS:"
echo "=================================="

for instance in "${LOGGED_OUT_INSTANCES[@]}"; do
    echo ""
    echo "🧹 Processando: $instance"
    delete_instance_api "$instance"
    clean_auth_folder "$instance"
done

# 6. Verificar resultado da limpeza
echo ""
echo "📊 VERIFICAÇÃO PÓS-LIMPEZA:"
echo "==========================="

echo "📁 Pastas restantes em auth_info:"
ls -1 /root/whatsapp-server/auth_info/ | grep -v "^\.$" | grep -v "^\..$" | wc -l
echo "Total: $(ls -1 /root/whatsapp-server/auth_info/ | grep -v "^\.$" | grep -v "^\..$" | wc -l) pastas"

echo ""
echo "📋 Instâncias ainda ativas via API:"
curl -s "http://localhost:3001/health" | grep -o '"total":[0-9]*' || echo "API não respondeu"

# 7. Reiniciar PM2 para aplicar mudanças
echo ""
echo "🔄 REINICIANDO PM2 PARA APLICAR MUDANÇAS:"
echo "========================================"
pm2 restart whatsapp-server

# 8. Aguardar reinicialização
echo "⏳ Aguardando reinicialização (10s)..."
sleep 10

# 9. Status final
echo ""
echo "📊 STATUS FINAL APÓS LIMPEZA:"
echo "============================"
curl -s "http://localhost:3001/health" | head -20

echo ""
echo "✅ LIMPEZA CONCLUÍDA!"
echo ""
echo "🔍 Para verificar resultado completo:"
echo "bash monitor_instances_vps.sh"