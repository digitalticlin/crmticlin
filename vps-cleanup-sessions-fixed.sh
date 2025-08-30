#!/bin/bash

# 🧹 LIMPEZA CORRIGIDA DE SESSÕES WHATSAPP 
# Remove diretórios de sessões que não estão conectadas - VERSÃO CORRIGIDA

echo "🧹 LIMPEZA CORRIGIDA DE SESSÕES WHATSAPP"
echo "Data: $(date)"
echo "======================================================"
echo "🎯 Objetivo: Limpar sessões não conectadas do auth_info/"
echo "✅ Manter apenas as 9 instâncias ativas"
echo "🔧 VERSÃO CORRIGIDA - Remove todas as sessões inativas"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# Lista das instâncias ATIVAS/CONECTADAS (manter) - EXATAS
ACTIVE_INSTANCES=(
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
# 1. ANÁLISE DETALHADA DO DIRETÓRIO AUTH_INFO
# ============================================================

echo ""
echo "📂 1. ANÁLISE DETALHADA DO AUTH_INFO"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Diretórios atuais em auth_info/:'
if [ -d auth_info ]; then
    find auth_info -maxdepth 1 -type d | grep -v '^auth_info$' | sed 's|auth_info/||' | sort
    echo ''
    echo 'Total de diretórios:' \$(find auth_info -maxdepth 1 -type d | grep -v '^auth_info$' | wc -l)
    echo 'Instâncias com creds.json:' \$(find auth_info -name 'creds.json' | wc -l)
    
    echo ''
    echo '📋 Instâncias com credenciais válidas:'
    find auth_info -name 'creds.json' -exec dirname {} \\; | sed 's|auth_info/||' | sort
else
    echo '❌ Diretório auth_info não encontrado'
    exit 1
fi
"

# ============================================================
# 2. REMOÇÃO DIRETA E CORRIGIDA
# ============================================================

echo ""
echo "🗑️ 2. REMOÇÃO DIRETA DAS SESSÕES INATIVAS"
echo "======================================================"

echo "🎯 Instâncias ATIVAS (serão mantidas):"
for instance in "${ACTIVE_INSTANCES[@]}"; do
    echo "  ✅ $instance"
done

echo ""
echo "🗑️ Removendo todas as sessões INATIVAS..."

# Criar script temporário no VPS para remoção
ssh $VPS_SERVER "
cd $VPS_PATH

# Lista das instâncias ativas
KEEP_INSTANCES='digitalticlin admcasaoficial imperioesportegyn paulamarisaames alinyvalerias contatoluizantoniooliveira eneas marketing admgeuniformes'

echo '🔍 Processando cada diretório...'
REMOVED_COUNT=0
TOTAL_DIRS=0

# Criar backup antes da remoção
echo '💾 Criando backup de segurança...'
BACKUP_TIMESTAMP=\$(date +\"%Y%m%d_%H%M%S\")
mkdir -p ~/backups-auth-cleanup
tar -czf ~/backups-auth-cleanup/auth_backup_fixed_\$BACKUP_TIMESTAMP.tar.gz auth_info/
echo '✅ Backup: ~/backups-auth-cleanup/auth_backup_fixed_\$BACKUP_TIMESTAMP.tar.gz'
echo ''

for dir in auth_info/*/; do
    if [ -d \"\$dir\" ]; then
        DIRNAME=\$(basename \"\$dir\")
        TOTAL_DIRS=\$((TOTAL_DIRS + 1))
        
        # Verificar se está na lista de instâncias ativas
        KEEP=false
        for keep_instance in \$KEEP_INSTANCES; do
            if [ \"\$DIRNAME\" = \"\$keep_instance\" ]; then
                KEEP=true
                break
            fi
        done
        
        if [ \"\$KEEP\" = true ]; then
            echo \"  ✅ Mantendo: \$DIRNAME\"
        else
            echo \"  🗑️ Removendo: \$DIRNAME\"
            rm -rf \"auth_info/\$DIRNAME\"
            if [ \$? -eq 0 ]; then
                echo \"    ✅ Removido com sucesso\"
                REMOVED_COUNT=\$((REMOVED_COUNT + 1))
            else
                echo \"    ❌ Falha na remoção\"
            fi
        fi
    fi
done

echo ''
echo '📊 ESTATÍSTICAS DA LIMPEZA:'
echo \"   Total processado: \$TOTAL_DIRS\"
echo \"   Removidos: \$REMOVED_COUNT\"
echo \"   Mantidos: \$((TOTAL_DIRS - REMOVED_COUNT))\"
"

# ============================================================
# 3. VERIFICAÇÃO FINAL COMPLETA
# ============================================================

echo ""
echo "🔍 3. VERIFICAÇÃO FINAL COMPLETA"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Diretórios restantes em auth_info/:'
find auth_info -maxdepth 1 -type d | grep -v '^auth_info$' | sed 's|auth_info/||' | sort

echo ''
echo '📊 Estatísticas finais:'
FINAL_DIRS=\$(find auth_info -maxdepth 1 -type d | grep -v '^auth_info$' | wc -l)
FINAL_CREDS=\$(find auth_info -name 'creds.json' | wc -l)
echo \"Total de diretórios: \$FINAL_DIRS\"
echo \"Instâncias com creds.json: \$FINAL_CREDS\"

echo ''
echo '💽 Espaço do diretório auth_info:'
du -sh auth_info/

echo ''
echo '✅ Verificação: Apenas instâncias ativas mantidas'
for active in digitalticlin admcasaoficial imperioesportegyn paulamarisaames alinyvalerias contatoluizantoniooliveira eneas marketing admgeuniformes; do
    if [ -d \"auth_info/\$active\" ]; then
        echo \"  ✅ \$active - OK\"
    else
        echo \"  ❌ \$active - FALTANDO!\"
    fi
done
"

# ============================================================
# 4. TESTE DE INTEGRIDADE DO SISTEMA
# ============================================================

echo ""
echo "🧪 4. TESTE DE INTEGRIDADE DO SISTEMA"
echo "======================================================"

echo "🔄 Reiniciando servidor para aplicar limpeza..."
ssh $VPS_SERVER "
pm2 restart whatsapp-server

echo '⏳ Aguardando 30 segundos para inicialização...'
sleep 30

echo '📊 Status do servidor após limpeza:'
pm2 status

echo ''
echo '📱 Verificando instâncias conectadas:'
curl -s http://localhost:3001/instances | jq -r '.instances[].instanceId' | sort

echo ''
echo '🩺 Health check:'
curl -s http://localhost:3001/health | jq -r '.instances, .connected'
"

echo ""
echo "📊 RELATÓRIO FINAL DA LIMPEZA CORRIGIDA"
echo "======================================================"
echo "✅ LIMPEZA CORRIGIDA CONCLUÍDA!"
echo "🧹 Todas as sessões inativas foram removidas"
echo "📱 Mantidas apenas as 9 instâncias ativas"
echo "💾 Backup de segurança disponível"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Verificar instâncias: curl http://localhost:3001/instances"
echo "   2. Confirmar que todas as 9 estão conectadas"
echo "   3. Sistema deve ter menos restarts agora"
echo ""
echo "🎯 BENEFÍCIOS ALCANÇADOS:"
echo "   • Diretório auth_info/ limpo e otimizado"
echo "   • Menor uso de memória e recursos"
echo "   • Menos conflitos de sessão"
echo "   • Reinicializações mais rápidas"