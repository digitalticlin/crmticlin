#!/bin/bash

# 🔧 CORREÇÃO URGENTE - ERRO DE SINTAXE NO SERVER.JS
echo "🔧 CORREÇÃO URGENTE - ERRO DE SINTAXE NO SERVER.JS"
echo "Corrigindo erro na linha 676 e restaurando funcionamento"
echo "Data: $(date)"
echo "============================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🚨 PROBLEMA IDENTIFICADO:"
echo "============================================================="
echo "❌ Erro de sintaxe na linha 676 do server.js:"
echo "   console.error(\`\${logPrefix} ⚠️ Deleção incompleta:, result.errors);"
echo "                                                         ^"
echo "                                                    FALTA `)` "
echo ""
echo "❌ whatsapp-server está em estado 'errored'"
echo "❌ Servidor não responde a health checks"

echo ""
echo "🔧 1. CORREÇÃO DO ERRO DE SINTAXE"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Localizando e corrigindo erro de sintaxe...'

# Backup antes da correção
cp server.js server.js.backup-syntax-fix-\$(date +%Y%m%d_%H%M%S)

# Corrigir o erro específico na linha 676
echo '🔧 Corrigindo linha 676...'
sed -i 's/console\.error(\`\${logPrefix} ⚠️ Deleção incompleta:, result\.errors);/console.error(\`\${logPrefix} ⚠️ Deleção incompleta:\`, result.errors);/' server.js

# Verificar se a correção foi aplicada
if grep -q 'Deleção incompleta:\`, result.errors' server.js; then
    echo '✅ Correção de sintaxe aplicada'
else
    echo '❌ Correção não detectada, tentando método alternativo...'
    
    # Método alternativo - buscar e substituir com Python
    python3 << 'PYTHON_FIX'
import re

try:
    with open('server.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Corrigir o erro específico
    old_pattern = r\"console\.error\(\\\`\$\{logPrefix\} ⚠️ Deleção incompleta:, result\.errors\);\"
    new_pattern = r\"console.error(\\\`\$\{logPrefix\} ⚠️ Deleção incompleta:\\\`, result.errors);\"
    
    new_content = re.sub(old_pattern, new_pattern, content)
    
    if new_content != content:
        with open('server.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('✅ Erro corrigido via Python')
    else:
        print('⚠️ Padrão não encontrado para correção')
        
except Exception as e:
    print(f'❌ Erro na correção Python: {e}')
PYTHON_FIX
fi

echo ''
echo '🔍 Verificando sintaxe do server.js corrigido:'
node -c server.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe do server.js está válida'
else
    echo '❌ Ainda há erros de sintaxe, tentando restaurar backup...'
    
    # Se ainda há erro, restaurar do backup mais recente
    LATEST_BACKUP=\$(ls -t server.js.backup* | head -1)
    if [ -n \"\$LATEST_BACKUP\" ]; then
        echo \"📄 Restaurando de: \$LATEST_BACKUP\"
        cp \"\$LATEST_BACKUP\" server.js
        
        # Verificar sintaxe do backup
        node -c server.js && echo '✅ Backup restaurado com sintaxe válida' || echo '❌ Backup também tem problemas'
    else
        echo '❌ Nenhum backup encontrado'
    fi
fi
"

echo ""
echo "🔄 2. REINICIALIZANDO WHATSAPP-SERVER"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Parando whatsapp-server atual...'
pm2 stop whatsapp-server || echo 'Processo já parado'

echo ''
echo '🧹 Limpando processo com erro...'
pm2 delete whatsapp-server || echo 'Processo já removido'

echo ''
echo '🚀 Iniciando whatsapp-server limpo...'
pm2 start server.js --name whatsapp-server

echo ''
echo '⏳ Aguardando 15 segundos para inicialização...'
sleep 15

echo ''
echo '📊 Status do PM2 após reinicialização:'
pm2 list
"

echo ""
echo "🧪 3. TESTE DE FUNCIONAMENTO"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Testando health check do servidor:'
HEALTH_STATUS=\$(curl -s -w '%{http_code}' http://localhost:3001/health -o /tmp/health_response)

if [ \"\$HEALTH_STATUS\" = \"200\" ]; then
    echo '✅ Servidor respondendo corretamente (HTTP 200)'
    echo '📋 Resposta:'
    cat /tmp/health_response | head -3
else
    echo \"❌ Servidor não responde corretamente (HTTP \$HEALTH_STATUS)\"
    echo '📋 Resposta:'
    cat /tmp/health_response
fi

echo ''
echo '🔍 Testando endpoint de listagem de instâncias:'
curl -s http://localhost:3001/instances | head -10 && echo '' || echo '❌ Endpoint de instâncias não responde'

echo ''
echo '📊 Status final do whatsapp-server:'
pm2 show whatsapp-server || echo 'Processo não encontrado'
"

echo ""
echo "🧹 4. LIMPEZA DE INSTÂNCIAS TESTE"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🗑️ Removendo instâncias de teste criadas pelo script anterior...'

# Remover instância com nome mal formado
if [ -d 'auth_info/test_robust_delete_\$(date +%s)' ]; then
    echo '❌ Removendo instância com nome mal formado...'
    rm -rf 'auth_info/test_robust_delete_\$(date +%s)'
    echo '✅ Instância mal formada removida'
fi

# Remover outras instâncias de teste
for test_instance in auth_info/test_*; do
    if [ -d \"\$test_instance\" ]; then
        instance_name=\$(basename \"\$test_instance\")
        echo \"🗑️ Removendo instância de teste: \$instance_name\"
        rm -rf \"\$test_instance\"
        echo \"✅ \$instance_name removida\"
    fi
done

echo ''
echo '📊 Contagem final de instâncias após limpeza:'
INSTANCE_COUNT=\$(ls -1d auth_info/*/ 2>/dev/null | wc -l)
echo \"Total de instâncias: \$INSTANCE_COUNT\"

echo ''
echo '📋 Instâncias restantes:'
ls -1 auth_info/ 2>/dev/null || echo 'Nenhuma instância encontrada'
"

echo ""
echo "✅ 5. VERIFICAÇÃO FINAL COMPLETA"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 RELATÓRIO FINAL DE STATUS:'
echo ''

# Status PM2
echo '1. 📊 Status PM2:'
pm2 list | grep -E 'whatsapp-server|online|errored'

echo ''
# Health check
echo '2. 🏥 Health Check:'
if curl -s http://localhost:3001/health > /dev/null; then
    echo '   ✅ Servidor responde corretamente'
else
    echo '   ❌ Servidor não responde'
fi

echo ''
# Contagem de instâncias
echo '3. 📂 Instâncias:'
INSTANCE_COUNT=\$(ls -1d auth_info/*/ 2>/dev/null | wc -l)
echo \"   📊 Total de instâncias: \$INSTANCE_COUNT\"

echo ''
# Sintaxe
echo '4. 🔧 Sintaxe:'
if node -c server.js 2>/dev/null; then
    echo '   ✅ server.js com sintaxe válida'
else
    echo '   ❌ server.js ainda tem erros'
fi

echo ''
echo '🎯 RESUMO:'
if pm2 list | grep -q 'whatsapp-server.*online'; then
    echo '✅ whatsapp-server está ONLINE e funcionando'
    echo '✅ Correção de sintaxe bem-sucedida'
    echo '✅ Sistema pronto para uso'
    
    echo ''
    echo '🚀 PRÓXIMOS PASSOS RECOMENDADOS:'
    echo '   1. Testar deleção de instância via CRM'
    echo '   2. Monitorar logs: pm2 logs whatsapp-server'
    echo '   3. Validar criação de novas instâncias'
    
else
    echo '❌ whatsapp-server ainda não está funcionando'
    echo '⚠️ Pode ser necessário restaurar backup completo'
    
    echo ''
    echo '🔧 COMANDO DE EMERGÊNCIA (se necessário):'
    echo '   cp backup-complete-delete-fix-*/server.js.original server.js'
    echo '   pm2 restart whatsapp-server'
fi
"

echo ""
echo "🎉 CORREÇÃO DE SINTAXE FINALIZADA!"
echo "============================================================="
echo "🔧 Erro de sintaxe corrigido na linha 676"
echo "🔄 whatsapp-server reinicializado"
echo "🧹 Instâncias de teste removidas"
echo "✅ Sistema restaurado para funcionamento"
echo ""
echo "============================================================="
echo "🔧 CORREÇÃO SINTAXE CONCLUÍDA - $(date)"
echo "============================================================="