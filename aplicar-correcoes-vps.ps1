# 🚀 APLICAR CORREÇÕES BILATERAIS NA VPS - PowerShell
# Este script conecta na VPS e aplica as correções para mensagens bilaterais

$VPS_IP = "31.97.24.222"
$VPS_USER = "root"
$PORT = "3002"

Write-Host "🔧 APLICANDO CORREÇÕES BILATERAIS NA VPS: $VPS_IP" -ForegroundColor Green
Write-Host "📡 Conectando via SSH..." -ForegroundColor Yellow

# Função para executar comandos na VPS
function Execute-Remote {
    param($Command)
    ssh "$VPS_USER@$VPS_IP" "$Command"
}

# 1. DESCOBRIR LOCALIZAÇÃO DOS ARQUIVOS
Write-Host "🔍 1. Descobrindo estrutura de arquivos na VPS..." -ForegroundColor Blue
Execute-Remote "find /root -name '*.js' -type f | head -10"
Execute-Remote "find /home -name '*.js' -type f | head -10"
Execute-Remote "find /opt -name '*.js' -type f | head -10"

# 2. VERIFICAR PROCESSOS ATIVOS
Write-Host "🔍 2. Verificando processos WhatsApp ativos..." -ForegroundColor Blue
Execute-Remote "ps aux | grep -i whatsapp"
Execute-Remote "pm2 list"
Execute-Remote "netstat -tlnp | grep :$PORT"

# 3. LOCALIZAR ARQUIVO PRINCIPAL
Write-Host "🔍 3. Localizando arquivo principal do servidor..." -ForegroundColor Blue
$MAIN_FILES = Execute-Remote "find / -name '*server*.js' -o -name '*connection*.js' -o -name '*whatsapp*.js' 2>/dev/null | grep -v node_modules | head -5"
Write-Host "📁 Arquivos encontrados:" -ForegroundColor Yellow
Write-Host $MAIN_FILES

# 4. FAZER BACKUP DOS ARQUIVOS ATUAIS
Write-Host "🗂️ 4. Fazendo backup dos arquivos atuais..." -ForegroundColor Blue
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
Execute-Remote "mkdir -p /root/backup_$TIMESTAMP"

# Descobrir arquivo correto baseado no processo
$PROCESS_FILE = Execute-Remote "ps aux | grep -i node | grep -v grep | awk '{print `$NF}' | head -1"
Write-Host "📋 Arquivo do processo ativo: $PROCESS_FILE" -ForegroundColor Yellow

if ($PROCESS_FILE) {
    Execute-Remote "cp '$PROCESS_FILE' /root/backup_$TIMESTAMP/"
    Write-Host "✅ Backup criado: /root/backup_$TIMESTAMP/" -ForegroundColor Green
} else {
    Write-Host "⚠️ Não foi possível identificar arquivo principal" -ForegroundColor Red
    Write-Host "🔍 Tentando localizar por porta $PORT..." -ForegroundColor Yellow
    $PORT_PROCESS = Execute-Remote "lsof -i :$PORT -t"
    if ($PORT_PROCESS) {
        $SCRIPT_PATH = Execute-Remote "readlink -f /proc/$PORT_PROCESS/exe"
        Write-Host "📋 Script da porta $PORT`: $SCRIPT_PATH" -ForegroundColor Yellow
    }
}
}

# 5. VERIFICAR CONTEÚDO DO ARQUIVO PRINCIPAL
Write-Host "🔍 5. Analisando filtros atuais..." -ForegroundColor Blue
if ($PROCESS_FILE) {
    Write-Host "📄 Procurando filtros fromMe no arquivo:" -ForegroundColor Yellow
    Execute-Remote "grep -n 'fromMe' '$PROCESS_FILE' || echo 'Nenhum filtro fromMe encontrado'"
    Execute-Remote "grep -n 'from_me' '$PROCESS_FILE' || echo 'Nenhum from_me encontrado'"
    Execute-Remote "grep -n 'continue' '$PROCESS_FILE' | head -5"
}

# 6. PRÓXIMOS PASSOS
Write-Host @"
🔧 6. PRÓXIMOS PASSOS MANUAIS:

1. **Arquivo identificado:**
   - Processo ativo: $PROCESS_FILE
   - Backup em: /root/backup_$TIMESTAMP

2. **Aplicar correção:**
   - Remover filtros 'if (message.key.fromMe) continue;'
   - Preservar campo 'fromMe: message.fromMe' no payload
   - Atualizar logs para mostrar direção

3. **Comando para correção rápida:**
   ssh $VPS_USER@$VPS_IP "sed -i 's/if (message\.key\.fromMe) continue;//g' '$PROCESS_FILE'"

4. **Reiniciar serviço:**
   ssh $VPS_USER@$VPS_IP "pm2 restart whatsapp-server"

5. **Testar:**
   - Enviar mensagem do CRM para lead
   - Verificar se aparece from_me: true no banco

📁 Use connection-manager-bilateral.js como referência
"@ -ForegroundColor Cyan

Write-Host "✅ Análise da VPS concluída!" -ForegroundColor Green 