
#!/bin/bash

# INSTALAÇÃO ROBUSTA DO CHROME PARA VPS
echo "🔧 INSTALAÇÃO ROBUSTA DO CHROME PARA VPS"
echo "========================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar Chrome com múltiplas estratégias"
echo ""

# Configurações
CHROME_VERSION="stable"
TEMP_DIR="/tmp/chrome_install"
LOG_FILE="/tmp/chrome_install.log"

# Função de log melhorada
log_info() {
    echo "[$(date '+%H:%M:%S')] ℹ️ $1" | tee -a $LOG_FILE
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1" | tee -a $LOG_FILE
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1" | tee -a $LOG_FILE
}

log_warning() {
    echo "[$(date '+%H:%M:%S')] ⚠️ $1" | tee -a $LOG_FILE
}

log_test() {
    echo "[$(date '+%H:%M:%S')] 🧪 $1" | tee -a $LOG_FILE
}

# Função para detectar arquitetura
detect_architecture() {
    local arch=$(uname -m)
    local os_info=$(cat /etc/os-release 2>/dev/null || echo "Unknown")
    
    log_info "Detectando arquitetura do sistema..."
    log_info "Arquitetura: $arch"
    log_info "Sistema: $(echo "$os_info" | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')"
    
    case "$arch" in
        x86_64|amd64)
            ARCH="amd64"
            log_success "Arquitetura suportada: $ARCH"
            return 0
            ;;
        aarch64|arm64)
            ARCH="arm64"
            log_warning "Arquitetura ARM64 detectada - usando Chromium como alternativa"
            return 1
            ;;
        *)
            log_error "Arquitetura não suportada: $arch"
            return 2
            ;;
    esac
}

# Função para verificar conectividade
check_connectivity() {
    log_info "Verificando conectividade de rede..."
    
    if ping -c 1 google.com >/dev/null 2>&1; then
        log_success "Conectividade: OK"
        return 0
    else
        log_error "Sem conectividade com a internet"
        return 1
    fi
}

# Função para verificar espaço em disco
check_disk_space() {
    log_info "Verificando espaço em disco..."
    
    local available=$(df / | tail -1 | awk '{print $4}')
    local needed=500000  # 500MB em KB
    
    if [ "$available" -gt "$needed" ]; then
        log_success "Espaço disponível: $(($available / 1024))MB"
        return 0
    else
        log_error "Espaço insuficiente. Disponível: $(($available / 1024))MB, Necessário: $(($needed / 1024))MB"
        return 1
    fi
}

# Função para limpeza prévia
cleanup_previous_installs() {
    log_info "Limpando instalações anteriores..."
    
    # Parar processos relacionados
    pkill -f chrome 2>/dev/null || true
    pkill -f chromium 2>/dev/null || true
    
    # Remover instalações antigas
    apt-get remove --purge -y google-chrome-stable google-chrome chromium-browser chromium 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    
    # Limpar repositórios
    rm -f /etc/apt/sources.list.d/google-chrome.list 2>/dev/null || true
    rm -f /etc/apt/sources.list.d/chromium.list 2>/dev/null || true
    
    # Limpar cache
    apt-get clean
    
    # Criar diretório temporário
    mkdir -p $TEMP_DIR
    
    log_success "Limpeza concluída"
}

# MÉTODO 1: Download direto do Google
install_chrome_direct_download() {
    log_info "MÉTODO 1: Download direto do arquivo .deb do Google"
    
    cd $TEMP_DIR
    
    # URLs para diferentes arquiteturas
    case "$ARCH" in
        amd64)
            CHROME_URL="https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"
            ;;
        arm64)
            log_warning "Chrome não disponível para ARM64 - pulando método 1"
            return 1
            ;;
    esac
    
    log_info "Baixando Chrome do Google..."
    if wget -O google-chrome.deb "$CHROME_URL" 2>>$LOG_FILE; then
        log_success "Download concluído"
    else
        log_error "Falha no download"
        return 1
    fi
    
    log_info "Instalando dependências..."
    apt-get update -y >>$LOG_FILE 2>&1
    apt-get install -f -y >>$LOG_FILE 2>&1
    
    log_info "Instalando Chrome via dpkg..."
    if dpkg -i google-chrome.deb 2>>$LOG_FILE; then
        log_success "Instalação via dpkg: OK"
    else
        log_warning "dpkg falhou, tentando corrigir dependências..."
        apt-get install -f -y >>$LOG_FILE 2>&1
        if dpkg -i google-chrome.deb 2>>$LOG_FILE; then
            log_success "Instalação corrigida: OK"
        else
            log_error "Falha na instalação via dpkg"
            return 1
        fi
    fi
    
    return 0
}

# MÉTODO 2: Repositório oficial do Google
install_chrome_repository() {
    log_info "MÉTODO 2: Instalação via repositório oficial"
    
    log_info "Instalando dependências básicas..."
    apt-get update -y >>$LOG_FILE 2>&1
    apt-get install -y wget gnupg2 software-properties-common apt-transport-https ca-certificates >>$LOG_FILE 2>&1
    
    log_info "Adicionando chave GPG do Google..."
    if wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - 2>>$LOG_FILE; then
        log_success "Chave GPG adicionada"
    else
        log_error "Falha ao adicionar chave GPG"
        return 1
    fi
    
    log_info "Adicionando repositório do Chrome..."
    echo "deb [arch=$ARCH] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    
    log_info "Atualizando lista de pacotes..."
    if apt-get update -y >>$LOG_FILE 2>&1; then
        log_success "Lista de pacotes atualizada"
    else
        log_error "Falha ao atualizar lista de pacotes"
        return 1
    fi
    
    log_info "Instalando Google Chrome Stable..."
    if apt-get install -y google-chrome-stable >>$LOG_FILE 2>&1; then
        log_success "Chrome instalado via repositório"
        return 0
    else
        log_error "Falha na instalação via repositório"
        return 1
    fi
}

# MÉTODO 3: Chromium como fallback
install_chromium_fallback() {
    log_info "MÉTODO 3: Instalação do Chromium (fallback)"
    
    log_info "Atualizando repositórios..."
    apt-get update -y >>$LOG_FILE 2>&1
    
    log_info "Instalando Chromium..."
    if apt-get install -y chromium-browser >>$LOG_FILE 2>&1; then
        log_success "Chromium instalado com sucesso"
        
        # Criar link simbólico para compatibilidade
        if [ ! -f "/usr/bin/google-chrome-stable" ]; then
            ln -sf /usr/bin/chromium-browser /usr/bin/google-chrome-stable
            log_info "Link simbólico criado: google-chrome-stable -> chromium-browser"
        fi
        
        return 0
    else
        log_error "Falha na instalação do Chromium"
        return 1
    fi
}

# Função para instalar dependências necessárias
install_chrome_dependencies() {
    log_info "Instalando dependências do Chrome/Chromium..."
    
    apt-get install -y \
        libnss3 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libxss1 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        fonts-liberation \
        libappindicator3-1 \
        xdg-utils \
        libx11-xcb1 \
        libxcb-dri3-0 \
        libxcursor1 \
        libxi6 \
        libxtst6 \
        libu2f-udev \
        libvulkan1 >>$LOG_FILE 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Dependências instaladas"
        return 0
    else
        log_warning "Algumas dependências podem ter falhado"
        return 1
    fi
}

# Função para testar instalação
test_chrome_installation() {
    log_test "Testando instalação do Chrome..."
    
    # Detectar qual Chrome foi instalado
    local chrome_paths=(
        "/usr/bin/google-chrome-stable"
        "/usr/bin/google-chrome"
        "/usr/bin/chromium-browser"
        "/usr/bin/chromium"
    )
    
    local chrome_executable=""
    for path in "${chrome_paths[@]}"; do
        if [ -f "$path" ]; then
            chrome_executable="$path"
            log_info "Chrome encontrado em: $path"
            break
        fi
    done
    
    if [ -z "$chrome_executable" ]; then
        log_error "Nenhum executável do Chrome encontrado"
        return 1
    fi
    
    # Teste 1: Verificar versão
    log_test "Testando comando --version..."
    if timeout 10s "$chrome_executable" --version >>$LOG_FILE 2>&1; then
        local version=$("$chrome_executable" --version 2>/dev/null)
        log_success "Versão: $version"
    else
        log_error "Falha no teste de versão"
        return 1
    fi
    
    # Teste 2: Modo headless básico
    log_test "Testando modo headless básico..."
    if timeout 15s "$chrome_executable" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
        log_success "Modo headless: FUNCIONANDO"
    else
        log_warning "Modo headless com problemas, tentando com mais argumentos..."
        
        # Teste com argumentos VPS específicos
        if timeout 15s "$chrome_executable" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox --single-process --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
            log_success "Modo headless com argumentos VPS: FUNCIONANDO"
        else
            log_error "Modo headless: FALHOU COMPLETAMENTE"
            return 1
        fi
    fi
    
    # Teste 3: Verificar dependências
    log_test "Verificando dependências..."
    if ldd "$chrome_executable" | grep -q "not found"; then
        log_warning "Algumas dependências podem estar faltando:"
        ldd "$chrome_executable" | grep "not found" | tee -a $LOG_FILE
    else
        log_success "Todas as dependências encontradas"
    fi
    
    return 0
}

# Função para configurar variáveis de ambiente
configure_environment() {
    log_info "Configurando variáveis de ambiente..."
    
    # Detectar caminho do Chrome instalado
    local chrome_paths=(
        "/usr/bin/google-chrome-stable"
        "/usr/bin/google-chrome"
        "/usr/bin/chromium-browser"
        "/usr/bin/chromium"
    )
    
    local chrome_path=""
    for path in "${chrome_paths[@]}"; do
        if [ -f "$path" ]; then
            chrome_path="$path"
            break
        fi
    done
    
    if [ -n "$chrome_path" ]; then
        export PUPPETEER_EXECUTABLE_PATH="$chrome_path"
        export CHROME_PATH="$chrome_path"
        export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
        
        # Adicionar ao bashrc
        echo "" >> ~/.bashrc
        echo "# Chrome/Chromium - Instalação Robusta $(date)" >> ~/.bashrc
        echo "export PUPPETEER_EXECUTABLE_PATH=\"$chrome_path\"" >> ~/.bashrc
        echo "export CHROME_PATH=\"$chrome_path\"" >> ~/.bashrc
        echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
        
        log_success "Variáveis configuradas para: $chrome_path"
        return 0
    else
        log_error "Não foi possível encontrar executável do Chrome"
        return 1
    fi
}

# Função principal
main() {
    echo "🚀 INICIANDO INSTALAÇÃO ROBUSTA DO CHROME"
    echo "========================================"
    
    # Criar arquivo de log
    echo "Log da instalação iniciado em $(date)" > $LOG_FILE
    
    # Pré-verificações
    log_info "Executando pré-verificações..."
    
    if ! check_connectivity; then
        log_error "Aborting: Sem conectividade de rede"
        exit 1
    fi
    
    if ! check_disk_space; then
        log_error "Aborting: Espaço insuficiente em disco"
        exit 1
    fi
    
    # Detectar arquitetura
    detect_architecture
    arch_result=$?
    
    # Limpeza prévia
    cleanup_previous_installs
    
    # Tentar métodos de instalação
    local success=false
    
    if [ $arch_result -eq 0 ]; then
        # Arquitetura x86_64 - tentar Chrome
        log_info "Tentando instalação do Google Chrome..."
        
        # Método 1: Download direto
        if install_chrome_direct_download; then
            success=true
        # Método 2: Repositório
        elif install_chrome_repository; then
            success=true
        fi
    fi
    
    # Método 3: Fallback para Chromium (sempre tentar se Chrome falhou)
    if [ "$success" = false ]; then
        log_info "Tentando Chromium como fallback..."
        if install_chromium_fallback; then
            success=true
        fi
    fi
    
    if [ "$success" = false ]; then
        log_error "FALHA: Todos os métodos de instalação falharam"
        echo ""
        echo "📋 LOG COMPLETO:"
        cat $LOG_FILE
        exit 1
    fi
    
    # Instalar dependências
    install_chrome_dependencies
    
    # Testar instalação
    if test_chrome_installation; then
        log_success "TESTE: Chrome/Chromium funcionando corretamente"
    else
        log_error "TESTE: Problemas detectados na instalação"
        exit 1
    fi
    
    # Configurar ambiente
    configure_environment
    
    # Relatório final
    echo ""
    echo "🎉 INSTALAÇÃO ROBUSTA CONCLUÍDA COM SUCESSO!"
    echo "=========================================="
    
    # Mostrar informações da instalação
    local chrome_info=""
    if command -v google-chrome-stable &> /dev/null; then
        chrome_info=$(google-chrome-stable --version 2>/dev/null)
    elif command -v chromium-browser &> /dev/null; then
        chrome_info=$(chromium-browser --version 2>/dev/null)
    fi
    
    echo "✅ INSTALAÇÃO:"
    echo "   📦 Navegador: $chrome_info"
    echo "   📍 Caminho: $PUPPETEER_EXECUTABLE_PATH"
    echo "   🏗️ Arquitetura: $ARCH"
    echo "   🧪 Teste headless: PASSOU"
    
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "   1. Reiniciar o servidor WhatsApp"
    echo "   2. Testar criação de instância"
    echo "   3. Verificar QR Code"
    
    echo ""
    echo "📊 LOG COMPLETO SALVO EM: $LOG_FILE"
    
    # Limpeza
    rm -rf $TEMP_DIR
    
    log_success "INSTALAÇÃO ROBUSTA DO CHROME FINALIZADA!"
}

# Executar função principal
main "$@"
