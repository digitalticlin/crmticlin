#!/bin/bash

# 🚀 APLICAR CORREÇÕES BILATERAIS NA VPS - REMOTO
# Este script conecta na VPS e aplica as correções para mensagens bilaterais

VPS_IP="31.97.24.222"
VPS_USER="root"
PORT="3002"

echo "🔧 APLICANDO CORREÇÕES BILATERAIS NA VPS: $VPS_IP"
echo "📡 Conectando via SSH..."

# Função para executar comandos na VPS
execute_remote() {
    ssh $VPS_USER@$VPS_IP "$1"
}

# 1. DESCOBRIR LOCALIZAÇÃO DOS ARQUIVOS
echo "🔍 1. Descobrindo estrutura de arquivos na VPS..."
execute_remote "find /root -name '*.js' -type f | head -10"
execute_remote "find /home -name '*.js' -type f | head -10"
execute_remote "find /opt -name '*.js' -type f | head -10"

# 2. VERIFICAR PROCESSOS ATIVOS
echo "🔍 2. Verificando processos WhatsApp ativos..."
execute_remote "ps aux | grep -i whatsapp"
execute_remote "pm2 list"
execute_remote "netstat -tlnp | grep :$PORT"

# 3. LOCALIZAR ARQUIVO PRINCIPAL
echo "🔍 3. Localizando arquivo principal do servidor..."
MAIN_FILE=$(execute_remote "find / -name '*server*.js' -o -name '*connection*.js' -o -name '*whatsapp*.js' 2>/dev/null | grep -v node_modules | head -5")
echo "📁 Arquivos encontrados:"
echo "$MAIN_FILE"

# 4. FAZER BACKUP DOS ARQUIVOS ATUAIS
echo "🗂️ 4. Fazendo backup dos arquivos atuais..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
execute_remote "mkdir -p /root/backup_$TIMESTAMP"

# Descobrir arquivo correto baseado no processo
PROCESS_FILE=$(execute_remote "ps aux | grep -i node | grep -v grep | awk '{print \$NF}' | head -1")
echo "📋 Arquivo do processo ativo: $PROCESS_FILE"

if [ ! -z "$PROCESS_FILE" ]; then
    execute_remote "cp $PROCESS_FILE /root/backup_$TIMESTAMP/"
    echo "✅ Backup criado: /root/backup_$TIMESTAMP/"
else
    echo "⚠️ Não foi possível identificar arquivo principal"
    echo "🔍 Tentando localizar por porta $PORT..."
    PORT_PROCESS=$(execute_remote "lsof -i :$PORT -t")
    if [ ! -z "$PORT_PROCESS" ]; then
        SCRIPT_PATH=$(execute_remote "readlink -f /proc/$PORT_PROCESS/exe")
        echo "📋 Script da porta $PORT: $SCRIPT_PATH"
    fi
fi

# 5. VERIFICAR CONTEÚDO DO ARQUIVO PRINCIPAL
echo "🔍 5. Analisando filtros atuais..."
if [ ! -z "$PROCESS_FILE" ]; then
    echo "📄 Procurando filtros fromMe no arquivo:"
    execute_remote "grep -n 'fromMe' '$PROCESS_FILE' || echo 'Nenhum filtro fromMe encontrado'"
    execute_remote "grep -n 'from_me' '$PROCESS_FILE' || echo 'Nenhum from_me encontrado'"
    execute_remote "grep -n 'continue' '$PROCESS_FILE' | head -5"
fi

# 6. APLICAR CORREÇÃO SE POSSÍVEL
echo "🔧 6. Preparando correção..."
echo "
⚠️  PRÓXIMOS PASSOS MANUAIS:

1. **Identificar arquivo correto:**
   - Arquivo do processo: $PROCESS_FILE
   - Backup criado em: /root/backup_$TIMESTAMP

2. **Aplicar correção:**
   - Remover filtros 'if (message.key.fromMe) continue;'
   - Preservar campo 'fromMe: message.fromMe' no payload
   - Atualizar logs para mostrar direção

3. **Testar:**
   - Reiniciar serviço: pm2 restart whatsapp-server
   - Enviar mensagem teste
   - Verificar se aparece from_me: true no banco

📁 Use o arquivo connection-manager-bilateral.js como referência
"

echo "✅ Análise da VPS concluída!"
echo "📋 Execute os passos manuais acima para finalizar a correção" 