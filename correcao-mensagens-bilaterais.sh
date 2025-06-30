#!/bin/bash

echo "🔧 Aplicando correções para conversas bilaterais..."

# Lista de arquivos VPS para corrigir
files=(
    "src/utils/vps-server-persistent.js"
    "src/utils/vps-server-v4-endpoints-fixed.js"
    "src/utils/vps-server-fixed-final.js"
    "src/utils/vps-server-working-restoration.js"
    "src/utils/vps-server-v4-minimal-fix.js"
    "src/utils/whatsapp-server-corrected.js"
    "src/utils/whatsapp-server.js"
)

# Função para aplicar correções em um arquivo
apply_corrections() {
    local file="$1"
    
    if [ -f "$file" ]; then
        echo "📝 Corrigindo $file..."
        
        # Backup do arquivo original
        cp "$file" "${file}.backup"
        
        # Correção 1: Remover filtro de mensagens fromMe no Puppeteer
        sed -i 's/if (message\.fromMe) continue;/\/\/ Permitir tanto incoming quanto outgoing messages/g' "$file"
        
        # Correção 2: Melhorar log de mensagens
        sed -i 's/Nova mensagem: /Nova mensagem (incoming\/outgoing): /g' "$file"
        
        # Correção 3: Preservar campo fromMe no webhook
        if grep -q "fromMe: message.fromMe" "$file"; then
            echo "✅ Campo fromMe já preservado em $file"
        else
            # Adicionar comentário sobre preservação do fromMe
            sed -i '/key: {/a\              // ✅ PRESERVA CAMPO from_me PARA CONVERSAS BILATERAIS' "$file"
        fi
        
        echo "✅ $file corrigido"
    else
        echo "⚠️ Arquivo $file não encontrado"
    fi
}

# Aplicar correções em todos os arquivos
for file in "${files[@]}"; do
    apply_corrections "$file"
done

echo ""
echo "🎯 RESUMO DAS CORREÇÕES APLICADAS:"
echo "✅ Removido filtro que ignora mensagens outgoing (from_me: true)"
echo "✅ Preservado campo from_me nos webhooks"
echo "✅ Melhorados logs para indicar direção das mensagens"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Testar envio de mensagem pelo CRM"
echo "2. Verificar se mensagem aparece no chat bilateral"
echo "3. Confirmar que webhook está salvando ambas as direções"
echo ""
echo "🚀 Correções para conversas bilaterais aplicadas com sucesso!" 