#!/bin/bash

# 🚨 CORREÇÃO IMEDIATA - RESTAURAR FUNCIONAMENTO URGENTE
echo "🚨 CORREÇÃO IMEDIATA - RESTAURAR FUNCIONAMENTO URGENTE"
echo "Localizando backup real e restaurando servidor"
echo "Data: $(date)"
echo "============================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🚨 AÇÃO EMERGENCIAL IMEDIATA"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 LOCALIZANDO TODOS OS BACKUPS DISPONÍVEIS:'
echo ''
echo '📁 Diretórios de backup:'
ls -la | grep backup

echo ''
echo '📁 Arquivos server.js.backup:'
ls -la server.js.backup* 2>/dev/null || echo 'Nenhum backup server.js encontrado'

echo ''
echo '📁 Verificando pasta backup-complete-delete-fix:'
if [ -d 'backup-complete-delete-fix-20250904_193547' ]; then
    echo '✅ Pasta de backup encontrada'
    ls -la backup-complete-delete-fix-20250904_193547/
else
    echo '❌ Pasta de backup não encontrada'
    echo 'Procurando outras pastas:'
    ls -la backup*/
fi

echo ''
echo '🔧 TENTATIVA 1: Restaurar do backup mais recente'
# Procurar backup mais recente do server.js
LATEST_BACKUP=\$(ls -t server.js.backup* 2>/dev/null | head -1)
if [ -n \"\$LATEST_BACKUP\" ]; then
    echo \"📄 Tentando backup: \$LATEST_BACKUP\"
    cp \"\$LATEST_BACKUP\" server.js
    
    if node -c server.js 2>/dev/null; then
        echo '✅ Backup funcionando encontrado!'
    else
        echo '❌ Backup tem erro, tentando próximo...'
    fi
fi

echo ''
echo '🔧 TENTATIVA 2: Verificar se existe backup na pasta'
if [ -f 'backup-complete-delete-fix-20250904_193547/server.js.original' ]; then
    echo '📄 Tentando backup da pasta'
    cp backup-complete-delete-fix-20250904_193547/server.js.original server.js
    
    if node -c server.js 2>/dev/null; then
        echo '✅ Backup da pasta funcionando!'
    else
        echo '❌ Backup da pasta também tem erro'
    fi
fi

echo ''
echo '🔧 TENTATIVA 3: Procurar qualquer server.js funcionando'
for backup_file in server.js.backup* server.js.bak*; do
    if [ -f \"\$backup_file\" ]; then
        echo \"🧪 Testando: \$backup_file\"
        cp \"\$backup_file\" server.js.temp
        
        if node -c server.js.temp 2>/dev/null; then
            echo \"✅ ENCONTRADO: \$backup_file tem sintaxe válida\"
            cp \"\$backup_file\" server.js
            break
        else
            echo \"❌ \$backup_file tem erro\"
        fi
        rm -f server.js.temp
    fi
done

echo ''
echo '🔍 VERIFICAÇÃO FINAL DA SINTAXE:'
if node -c server.js 2>/dev/null; then
    echo '✅ server.js atual tem sintaxe VÁLIDA'
else
    echo '❌ server.js ainda tem erro:'
    node -c server.js
fi
"

echo ""
echo "🚀 INICIANDO WHATSAPP-SERVER IMEDIATAMENTE"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando whatsapp-server com arquivo atual...'
pm2 start server.js --name whatsapp-server

echo ''
echo '⏳ Aguardando 10 segundos...'
sleep 10

echo ''
echo '📊 Status imediato:'
pm2 list | grep whatsapp-server

echo ''
echo '🧪 Teste rápido de funcionamento:'
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo '✅ SERVIDOR RESPONDENDO!'
else
    echo '❌ Servidor ainda não responde'
    
    echo ''
    echo '📋 Logs do erro:'
    pm2 logs whatsapp-server --lines 5 --nostream
    
    echo ''
    echo '🔧 Tentando restart:'
    pm2 restart whatsapp-server
    
    echo '⏳ Aguardando mais 10 segundos...'
    sleep 10
    
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo '✅ SERVIDOR FUNCIONANDO APÓS RESTART!'
    else
        echo '❌ Servidor ainda com problema'
    fi
fi
"

echo ""
echo "📊 VERIFICAÇÃO FINAL"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 STATUS FINAL:'
pm2 list

echo ''
echo '🏥 HEALTH CHECK:'
curl -s http://localhost:3001/health || echo 'Não responde'

echo ''
echo '📂 INSTÂNCIAS:'
ls -1 auth_info/ | wc -l
echo 'instâncias encontradas'

echo ''
if pm2 list | grep whatsapp-server | grep -q online; then
    echo '🎉 ✅ SUCESSO: SERVIDOR ONLINE!'
else
    echo '❌ FALHA: Servidor ainda não está funcionando'
    echo '💡 PODE PRECISAR DE INTERVENÇÃO MANUAL'
fi
"

echo ""
echo "🎯 CORREÇÃO IMEDIATA CONCLUÍDA"
echo "============================================================="
echo "Se servidor não estiver funcionando, pode precisar de:"
echo "1. Verificação manual do server.js"
echo "2. Restauração de snapshot completo do sistema"
echo "3. Análise dos logs de erro específicos"
echo "============================================================="