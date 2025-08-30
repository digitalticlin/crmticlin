#!/bin/bash

# 🧹 LIMPEZA DE SESSÕES NÃO UTILIZADAS
# Remove diretórios de sessões que não estão conectadas

echo "🧹 LIMPEZA DE SESSÕES WHATSAPP NÃO UTILIZADAS"
echo "Data: $(date)"
echo "======================================================"
echo "🎯 Objetivo: Limpar sessões não conectadas do auth_info/"
echo "✅ Manter apenas as 9 instâncias ativas"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# Lista das instâncias ATIVAS/CONECTADAS (manter)
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
# 1. ANÁLISE DO DIRETÓRIO AUTH_INFO
# ============================================================

echo ""
echo "📂 1. ANÁLISE DO DIRETÓRIO AUTH_INFO"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Diretórios atuais em auth_info/:'
if [ -d auth_info ]; then
    ls -la auth_info/ | grep '^d' | awk '{print \$9}' | grep -v '^\\.$' | grep -v '^\\.\\.$' | sort
    echo ''
    echo 'Total de diretórios:' \$(ls -la auth_info/ | grep '^d' | wc -l)
    echo 'Instâncias com creds.json:' \$(find auth_info -name 'creds.json' | wc -l)
else
    echo '❌ Diretório auth_info não encontrado'
    exit 1
fi
"

# ============================================================
# 2. IDENTIFICAR SESSÕES A REMOVER
# ============================================================

echo ""
echo "🔍 2. IDENTIFICANDO SESSÕES PARA REMOÇÃO"
echo "======================================================"

echo "🎯 Instâncias ATIVAS (manter):"
for instance in "${ACTIVE_INSTANCES[@]}"; do
    echo "  ✅ $instance"
done

echo ""
echo "🗑️ Sessões para REMOVER:"

# Obter lista de diretórios no auth_info via SSH
DIRECTORIES_TO_REMOVE=$(ssh $VPS_SERVER "
cd $VPS_PATH
if [ -d auth_info ]; then
    find auth_info -maxdepth 1 -type d | sed 's|auth_info/||' | grep -v '^auth_info$' | grep -v '^\\.$'
fi
" | while read -r dir; do
    # Verificar se o diretório NÃO está na lista de ativos
    is_active=false
    for active in "${ACTIVE_INSTANCES[@]}"; do
        if [[ "$dir" == "$active" ]]; then
            is_active=true
            break
        fi
    done
    
    if [[ "$is_active" == false && -n "$dir" ]]; then
        echo "$dir"
    fi
done)

if [[ -z "$DIRECTORIES_TO_REMOVE" ]]; then
    echo "✅ Nenhuma sessão desnecessária encontrada!"
    echo "📱 Todas as sessões são de instâncias ativas."
    exit 0
fi

echo "$DIRECTORIES_TO_REMOVE" | while read -r dir; do
    if [[ -n "$dir" ]]; then
        echo "  🗑️ $dir"
    fi
done

TOTAL_TO_REMOVE=$(echo "$DIRECTORIES_TO_REMOVE" | wc -l)
echo ""
echo "📊 Total de sessões para remover: $TOTAL_TO_REMOVE"

# ============================================================
# 3. CONFIRMAÇÃO DE SEGURANÇA
# ============================================================

echo ""
echo "⚠️ 3. CONFIRMAÇÃO DE SEGURANÇA"
echo "======================================================"
echo "🚨 ATENÇÃO: Esta ação é IRREVERSÍVEL!"
echo ""
echo "📱 Instâncias que SERÃO MANTIDAS:"
for instance in "${ACTIVE_INSTANCES[@]}"; do
    echo "  ✅ $instance"
done

echo ""
echo "🗑️ Sessões que SERÃO REMOVIDAS:"
echo "$DIRECTORIES_TO_REMOVE" | while read -r dir; do
    if [[ -n "$dir" ]]; then
        echo "  ❌ $dir"
    fi
done

echo ""
read -p "✋ Confirma a remoção das sessões não utilizadas? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada pelo usuário"
    exit 1
fi

# ============================================================
# 4. BACKUP DAS SESSÕES ANTES DA REMOÇÃO
# ============================================================

echo ""
echo "💾 4. BACKUP DE SEGURANÇA"
echo "======================================================"

BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📦 Criando backup das sessões antes da remoção...'
mkdir -p ~/backups-auth-cleanup
tar -czf ~/backups-auth-cleanup/auth_info_backup_$BACKUP_TIMESTAMP.tar.gz auth_info/

echo '✅ Backup criado:'
ls -lh ~/backups-auth-cleanup/auth_info_backup_$BACKUP_TIMESTAMP.tar.gz
"

# ============================================================
# 5. REMOÇÃO DAS SESSÕES
# ============================================================

echo ""
echo "🗑️ 5. REMOVENDO SESSÕES NÃO UTILIZADAS"
echo "======================================================"

REMOVED_COUNT=0
FAILED_COUNT=0

echo "$DIRECTORIES_TO_REMOVE" | while read -r dir; do
    if [[ -n "$dir" ]]; then
        echo "🗑️ Removendo: $dir"
        
        REMOVE_RESULT=$(ssh $VPS_SERVER "
        cd $VPS_PATH
        if [ -d 'auth_info/$dir' ]; then
            rm -rf 'auth_info/$dir' 2>/dev/null && echo 'success' || echo 'failed'
        else
            echo 'not_found'
        fi
        ")
        
        case $REMOVE_RESULT in
            "success")
                echo "  ✅ Removido com sucesso"
                ((REMOVED_COUNT++))
                ;;
            "failed")
                echo "  ❌ Falha na remoção"
                ((FAILED_COUNT++))
                ;;
            "not_found")
                echo "  ⚠️ Diretório não encontrado"
                ;;
        esac
    fi
done

# ============================================================
# 6. VERIFICAÇÃO FINAL
# ============================================================

echo ""
echo "🔍 6. VERIFICAÇÃO FINAL"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📂 Diretórios restantes em auth_info/:'
ls -la auth_info/ | grep '^d' | awk '{print \$9}' | grep -v '^\\.$' | grep -v '^\\.\\.$' | sort

echo ''
echo '📊 Estatísticas finais:'
echo 'Total de diretórios:' \$(ls -la auth_info/ | grep '^d' | grep -v '^\\.$' | grep -v '^\\.\\.$' | wc -l)
echo 'Instâncias com creds.json:' \$(find auth_info -name 'creds.json' | wc -l)

echo ''
echo '💽 Espaço liberado:'
du -sh auth_info/
"

# ============================================================
# 7. RELATÓRIO FINAL
# ============================================================

echo ""
echo "📊 7. RELATÓRIO FINAL DE LIMPEZA"
echo "======================================================"

echo "🎯 RESULTADOS DA LIMPEZA:"
echo "   ✅ Sessões removidas: $REMOVED_COUNT"
echo "   ❌ Falhas: $FAILED_COUNT"
echo "   📱 Instâncias mantidas: ${#ACTIVE_INSTANCES[@]}"

echo ""
echo "💾 BACKUP DE SEGURANÇA:"
echo "   📦 ~/backups-auth-cleanup/auth_info_backup_$BACKUP_TIMESTAMP.tar.gz"

echo ""
echo "✅ LIMPEZA CONCLUÍDA!"
echo "======================================================"
echo "🧹 Diretório auth_info/ otimizado"
echo "📱 Apenas instâncias ativas mantidas"
echo "💾 Backup de segurança disponível"
echo ""
echo "🔄 Recomendação:"
echo "   • Reiniciar servidor: pm2 restart whatsapp-server"
echo "   • Verificar instâncias: curl http://localhost:3001/instances"
echo ""
echo "🆘 Para restaurar (se necessário):"
echo "   cd ~/whatsapp-server"
echo "   tar -xzf ~/backups-auth-cleanup/auth_info_backup_$BACKUP_TIMESTAMP.tar.gz"