
#!/bin/bash

# INSTALAÇÃO CHROME SIMPLIFICADA PARA VPS - SINTAXE CORRIGIDA
echo "🚀 INSTALAÇÃO CHROME SIMPLIFICADA - VERSÃO CORRIGIDA"
echo "=================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar Chrome rapidamente com sintaxe corrigida"
echo ""

# Configurações
LOG_FILE="/tmp/chrome_simple_install.log"

# Função de log simplificada
log_info() {
    echo "[$(date '+%H:%M:%S')] ℹ️ $1" | tee -a $LOG_FILE
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1" | tee -a $LOG_FILE
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1" | tee -a $LOG_FILE
}

# Função para verificar se Chrome já está instalado
check_existing_chrome() {
    log_info "Verificando se Chrome já está instalado..."
    
    if command -v google-chrome-stable &> /dev/null; then
        log_success "Google Chrome já instalado: $(google-chrome-stable --version)"
        
        log_info "Testando funcionalidade do Chrome existente..."
        if timeout 10s google-chrome-stable --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
            log_success "Chrome existente funcionando corretamente!"
            return 0
        else
            log_info "Chrome instalado mas com problemas, continuando instalação..."
            return 1
        fi
    fi
    
    log_info "Chrome não encontrado, prosseguindo com instalação..."
    return 1
}

# Função para verificar conectividade
check_connectivity() {
    log_info "Verificando conectividade..."
    if timeout 5s ping -c 1 google.com >/dev/null 2>&1; then
        log_success "Conectividade OK"
        return 0
    else
        log_error "Sem conectividade - Abortando"
        return 1
    fi
}

# Função para atualizar sistema
update_system() {
    log_info "Atualizando lista de pacotes..."
    if timeout 30s apt-get update -y >>$LOG_FILE 2>&1; then
        log_success "Lista de pacotes atualizada"
        return 0
    else
        log_error "Falha ao atualizar lista de pacotes"
        return 1
    fi
}

# Função para instalar dependências básicas
install_basic_deps() {
    log_info "Instalando dependências básicas..."
    if apt-get install -y wget gnupg ca-certificates >>$LOG_FILE 2>&1; then
        log_success "Dependências básicas instaladas"
        return 0
    else
        log_error "Falha ao instalar dependências básicas"
        return 1
    fi
}

# Método 1: Download direto do Chrome
method1_direct_download() {
    log_info "MÉTODO 1: Download direto do Google Chrome..."
    cd /tmp || return 1
    
    CHROME_URL="https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"
    log_info "Baixando Chrome..."
    
    if timeout 60s wget -O google-chrome.deb "$CHROME_URL" >>$LOG_FILE 2>&1; then
        log_success "Download concluído"
    else
        log_error "Falha no download"
        return 1
    fi
    
    log_info "Instalando Chrome via dpkg..."
    if dpkg -i google-chrome.deb >>$LOG_FILE 2>&1; then
        log_success "Instalação dpkg: OK"
        return 0
    else
        log_info "Resolvendo dependências..."
        apt-get install -f -y >>$LOG_FILE 2>&1
        
        if dpkg -i google-chrome.deb >>$LOG_FILE 2>&1; then
            log_success "Instalação corrigida: OK"
            return 0
        else
            log_error "Falha na instalação via dpkg"
            return 1
        fi
    fi
}

# Método 2: Repositório oficial
method2_repository() {
    log_info "MÉTODO 2: Instalação via repositório oficial..."
    
    # Adicionar chave e repositório
    log_info "Adicionando chave GPG do Google..."
    if wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - >>$LOG_FILE 2>&1; then
        log_success "Chave GPG adicionada"
    else
        log_error "Falha ao adicionar chave GPG"
        return 1
    fi
    
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    
    apt-get update -y >>$LOG_FILE 2>&1
    
    if timeout 120s apt-get install -y google-chrome-stable >>$LOG_FILE 2>&1; then
        log_success "Chrome instalado via repositório"
        return 0
    else
        log_error "Falha no repositório"
        return 1
    fi
}

# Método 3: Chromium fallback
method3_chromium() {
    log_info "MÉTODO 3: Instalando Chromium como alternativa..."
    
    if timeout 60s apt-get install -y chromium-browser >>$LOG_FILE 2>&1; then
        log_success "Chromium instalado"
        
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

# Função para instalar dependências headless
install_headless_deps() {
    log_info "Instalando dependências headless..."
    
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
        fonts-liberation \
        libappindicator3-1 \
        xdg-utils >>$LOG_FILE 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Dependências headless instaladas"
        return 0
    else
        log_error "Algumas dependências headless falharam"
        return 1
    fi
}

# Função para testar Chrome
test_chrome() {
    log_info "Testando instalação do Chrome..."
    
    # Detectar Chrome instalado
    CHROME_EXEC=""
    if [ -f "/usr/bin/google-chrome-stable" ]; then
        CHROME_EXEC="/usr/bin/google-chrome-stable"
    elif [ -f "/usr/bin/chromium-browser" ]; then
        CHROME_EXEC="/usr/bin/chromium-browser"
    else
        log_error "Nenhum executável encontrado"
        return 1
    fi
    
    log_info "Chrome encontrado em: $CHROME_EXEC"
    
    # Teste de versão
    if timeout 10s "$CHROME_EXEC" --version >>$LOG_FILE 2>&1; then
        VERSION=$("$CHROME_EXEC" --version)
        log_success "Versão: $VERSION"
    else
        log_error "Falha no teste de versão"
        return 1
    fi
    
    # Teste headless
    log_info "Testando modo headless..."
    if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
        log_success "Modo headless: FUNCIONANDO"
        return 0
    else
        log_info "Testando com argumentos VPS..."
        if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox --single-process --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
            log_success "Modo headless com argumentos VPS: FUNCIONANDO"
            return 0
        else
            log_error "Modo headless: FALHOU"
            return 1
        fi
    fi
}

# Função para configurar variáveis de ambiente
configure_environment() {
    log_info "Configurando variáveis de ambiente..."
    
    # Detectar caminho do Chrome
    CHROME_PATH=""
    if [ -f "/usr/bin/google-chrome-stable" ]; then
        CHROME_PATH="/usr/bin/google-chrome-stable"
    elif [ -f "/usr/bin/chromium-browser" ]; then
        CHROME_PATH="/usr/bin/chromium-browser"
    fi
    
    if [ -n "$CHROME_PATH" ]; then
        export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
        export CHROME_PATH="$CHROME_PATH"
        export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
        
        # Adicionar ao bashrc
        echo "" >> ~/.bashrc
        echo "# Chrome - Instalação Simplificada $(date)" >> ~/.bashrc
        echo "export PUPPETEER_EXECUTABLE_PATH=\"$CHROME_PATH\"" >> ~/.bashrc
        echo "export CHROME_PATH=\"$CHROME_PATH\"" >> ~/.bashrc
        echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
        
        log_success "Variáveis configuradas para: $CHROME_PATH"
        return 0
    else
        log_error "Não foi possível encontrar executável do Chrome"
        return 1
    fi
}

# EXECUÇÃO PRINCIPAL
main() {
    echo "🚀 INICIANDO INSTALAÇÃO CHROME SIMPLIFICADA"
    echo "=========================================="
    
    # Criar arquivo de log
    echo "Log da instalação iniciado em $(date)" > $LOG_FILE
    
    # Verificar se Chrome já existe e funciona
    if check_existing_chrome; then
        echo ""
        echo "🎉 CHROME JÁ INSTALADO E FUNCIONANDO!"
        echo "===================================="
        configure_environment
        echo "📋 Log completo: $LOG_FILE"
        exit 0
    fi
    
    # Verificações básicas
    if ! check_connectivity; then
        exit 1
    fi
    
    if ! update_system; then
        exit 1
    fi
    
    if ! install_basic_deps; then
        exit 1
    fi
    
    # Tentativa sequencial dos métodos de instalação
    installation_success=false
    
    # Tentar Método 1
    if method1_direct_download; then
        installation_success=true
    fi
    
    # Se falhou, tentar Método 2
    if [ "$installation_success" = false ]; then
        if method2_repository; then
            installation_success=true
        fi
    fi
    
    # Se falhou, tentar Método 3
    if [ "$installation_success" = false ]; then
        if method3_chromium; then
            installation_success=true
        fi
    fi
    
    # Verificar se algum método funcionou
    if [ "$installation_success" = false ]; then
        log_error "FALHA: Todos os métodos de instalação falharam"
        echo ""
        echo "📋 LOG COMPLETO:"
        cat $LOG_FILE
        exit 1
    fi
    
    # Instalar dependências headless
    install_headless_deps
    
    # Testar instalação
    if ! test_chrome; then
        log_error "TESTE: Problemas detectados na instalação"
        exit 1
    fi
    
    # Configurar ambiente
    if ! configure_environment; then
        log_error "ERRO: Falha na configuração de variáveis"
        exit 1
    fi
    
    # Limpeza
    rm -f /tmp/google-chrome.deb
    
    # Relatório final
    echo ""
    echo "🎉 INSTALAÇÃO CHROME SIMPLIFICADA CONCLUÍDA!"
    echo "=========================================="
    
    FINAL_VERSION=""
    if command -v google-chrome-stable &> /dev/null; then
        FINAL_VERSION=$(google-chrome-stable --version 2>/dev/null)
    elif command -v chromium-browser &> /dev/null; then
        FINAL_VERSION=$(chromium-browser --version 2>/dev/null)
    fi
    
    echo "✅ Chrome instalado: $FINAL_VERSION"
    echo "✅ Caminho: $PUPPETEER_EXECUTABLE_PATH"
    echo "✅ Teste headless: PASSOU"
    echo "✅ Variáveis configuradas"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "1. Reiniciar servidor WhatsApp: pm2 restart whatsapp-main-3002"
    echo "2. Testar criação de instância"
    echo ""
    echo "📊 Log completo: $LOG_FILE"
    
    log_success "INSTALAÇÃO CHROME SIMPLIFICADA FINALIZADA!"
}

# Executar função principal
main "$@"
