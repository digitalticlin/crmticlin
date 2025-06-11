
#!/bin/bash

# INSTALADOR AUTOMÁTICO VPS - ANÁLISE FORENSE E RECONSTRUÇÃO
echo "🚀 INSTALADOR AUTOMÁTICO VPS - ANÁLISE FORENSE E RECONSTRUÇÃO"
echo "============================================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar e executar scripts de correção na VPS"
echo ""

# Configurações da VPS
VPS_IP="31.97.24.222"
VPS_USER="root"
VPS_PASSWORD="TiC2024@1995"

# Função de log
log_install() {
    echo "[$(date '+%H:%M:%S')] 🚀 $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

# FASE 1: VERIFICAR CONECTIVIDADE
echo ""
echo "🔍 FASE 1: VERIFICAR CONECTIVIDADE VPS"
echo "====================================="

log_install "Testando conexão com VPS $VPS_IP..."

if ping -c 3 $VPS_IP >/dev/null 2>&1; then
    log_success "VPS está respondendo"
else
    log_error "VPS não está respondendo"
    echo "Verifique a conectividade e tente novamente"
    exit 1
fi

# FASE 2: CRIAR DIRETÓRIO DE TRABALHO
echo ""
echo "📁 FASE 2: PREPARAR AMBIENTE VPS"
echo "==============================="

log_install "Criando diretório de trabalho na VPS..."

# Criar diretório remoto
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
mkdir -p /root/forensic-scripts
chmod 755 /root/forensic-scripts
cd /root/forensic-scripts
echo "Diretório criado: $(pwd)"
EOF

if [ $? -eq 0 ]; then
    log_success "Diretório criado na VPS"
else
    log_error "Falha ao criar diretório"
    exit 1
fi

# FASE 3: TRANSFERIR SCRIPTS
echo ""
echo "📤 FASE 3: TRANSFERIR SCRIPTS PARA VPS"
echo "====================================="

SCRIPTS=(
    "vps-forensic-analysis.sh"
    "vps-radical-cleanup.sh"
    "vps-controlled-installation.sh"
    "vps-optimized-server.sh"
    "vps-comprehensive-test.sh"
)

for script in "${SCRIPTS[@]}"; do
    log_install "Transferindo $script..."
    
    if [ -f "src/utils/$script" ]; then
        scp -o StrictHostKeyChecking=no "src/utils/$script" $VPS_USER@$VPS_IP:/root/forensic-scripts/
        
        if [ $? -eq 0 ]; then
            log_success "$script transferido"
            
            # Dar permissão de execução
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "chmod +x /root/forensic-scripts/$script"
        else
            log_error "Falha ao transferir $script"
        fi
    else
        log_error "Arquivo $script não encontrado localmente"
    fi
done

# FASE 4: EXECUTAR ANÁLISE FORENSE
echo ""
echo "🔬 FASE 4: EXECUTAR ANÁLISE FORENSE"
echo "================================="

log_install "Iniciando análise forense na VPS..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
cd /root/forensic-scripts
echo "🔬 EXECUTANDO ANÁLISE FORENSE COMPLETA"
echo "====================================="
bash vps-forensic-analysis.sh
EOF

if [ $? -eq 0 ]; then
    log_success "Análise forense concluída"
else
    log_error "Falha na análise forense"
fi

# FASE 5: MENU INTERATIVO
echo ""
echo "🎛️ FASE 5: MENU DE CONTROLE INTERATIVO"
echo "====================================="

while true; do
    echo ""
    echo "🎯 PRÓXIMAS AÇÕES DISPONÍVEIS:"
    echo "1. 🧹 Executar Limpeza Radical"
    echo "2. 🚀 Executar Instalação Controlada"
    echo "3. ⚙️ Executar Servidor Otimizado"
    echo "4. 🧪 Executar Teste Abrangente"
    echo "5. 🔄 Executar Sequência Completa (2+3+4)"
    echo "6. 📋 Ver Status Atual da VPS"
    echo "7. 📜 Ver Logs PM2"
    echo "8. 🔚 Sair"
    echo ""
    read -p "Escolha uma opção (1-8): " choice
    
    case $choice in
        1)
            log_install "Executando limpeza radical..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cd /root/forensic-scripts && bash vps-radical-cleanup.sh"
            ;;
        2)
            log_install "Executando instalação controlada..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cd /root/forensic-scripts && bash vps-controlled-installation.sh"
            ;;
        3)
            log_install "Executando servidor otimizado..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cd /root/forensic-scripts && bash vps-optimized-server.sh"
            ;;
        4)
            log_install "Executando teste abrangente..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cd /root/forensic-scripts && bash vps-comprehensive-test.sh"
            ;;
        5)
            log_install "Executando sequência completa..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
cd /root/forensic-scripts
echo "🚀 SEQUÊNCIA COMPLETA INICIADA"
echo "=============================="
echo "Passo 1: Instalação Controlada"
bash vps-controlled-installation.sh
echo ""
echo "Passo 2: Servidor Otimizado"
bash vps-optimized-server.sh
echo ""
echo "Passo 3: Teste Abrangente"
bash vps-comprehensive-test.sh
echo ""
echo "🎉 SEQUÊNCIA COMPLETA FINALIZADA!"
EOF
            ;;
        6)
            log_install "Verificando status da VPS..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
echo "📊 STATUS ATUAL DA VPS"
echo "====================="
echo "Data: $(date)"
echo ""
echo "🔍 Processos PM2:"
pm2 list 2>/dev/null || echo "PM2 não está rodando"
echo ""
echo "🌐 Portas ativas:"
netstat -tulpn 2>/dev/null | grep -E "(3001|3002|9222)" || echo "Nenhuma porta WhatsApp ativa"
echo ""
echo "💾 Uso de memória:"
free -h
echo ""
echo "💽 Espaço em disco:"
df -h /
EOF
            ;;
        7)
            log_install "Visualizando logs PM2..."
            sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "pm2 logs --lines 20 2>/dev/null || echo 'PM2 não está rodando ou sem logs'"
            ;;
        8)
            log_success "Saindo do instalador..."
            break
            ;;
        *)
            log_error "Opção inválida. Escolha 1-8."
            ;;
    esac
done

echo ""
echo "🎉 INSTALADOR AUTOMÁTICO FINALIZADO!"
echo "==================================="
echo "✅ Scripts transferidos para: /root/forensic-scripts/"
echo "✅ Análise forense executada"
echo "✅ VPS pronta para próximas etapas"
echo ""
echo "📋 COMANDOS MANUAIS (se necessário):"
echo "   ssh root@$VPS_IP"
echo "   cd /root/forensic-scripts"
echo "   bash vps-radical-cleanup.sh"
echo "   bash vps-controlled-installation.sh"
echo "   bash vps-optimized-server.sh"
echo "   bash vps-comprehensive-test.sh"

EOF
