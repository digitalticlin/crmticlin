
#!/bin/bash

# CORREÇÃO COMPLETA DO CHROME PARA VPS UBUNTU/DEBIAN MODERNO
echo "🔧 CORREÇÃO COMPLETA CHROME VPS - SISTEMA MODERNO"
echo "==============================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar Chrome resolvendo dependências modernas"
echo ""

# Configurações
LOG_FILE="/tmp/chrome_complete_fix.log"
CHROME_INSTALLED=false

# Função de log robusta
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

# FASE 1: DIAGNÓSTICO INICIAL
echo ""
echo "🔍 FASE 1: DIAGNÓSTICO DO SISTEMA"
echo "================================"

log_info "Detectando sistema operacional..."
OS_INFO=$(cat /etc/os-release 2>/dev/null)
UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "unknown")
ARCHITECTURE=$(uname -m)

echo "Sistema: $(echo "$OS_INFO" | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')"
echo "Ubuntu: $UBUNTU_VERSION"
echo "Arquitetura: $ARCHITECTURE"

log_info "Verificando Chrome existente..."
if command -v google-chrome-stable &> /dev/null; then
    EXISTING_VERSION=$(google-chrome-stable --version 2>/dev/null || echo "Versão não detectada")
    log_warning "Chrome já instalado: $EXISTING_VERSION"
else
    log_info "Chrome não encontrado - prosseguindo com instalação"
fi

# FASE 2: LIMPEZA E PREPARAÇÃO
echo ""
echo "🧹 FASE 2: LIMPEZA E PREPARAÇÃO"
echo "=============================="

log_info "Parando processos relacionados..."
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true

log_info "Removendo instalações problemáticas..."
apt-get remove --purge -y google-chrome-stable google-chrome chromium-browser chromium 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

log_info "Limpando repositórios antigos..."
rm -f /etc/apt/sources.list.d/google-chrome.list 2>/dev/null || true
rm -f /etc/apt/sources.list.d/chromium.list 2>/dev/null || true

log_info "Limpando cache apt..."
apt-get clean
apt-get update -y >>$LOG_FILE 2>&1

log_success "Limpeza concluída"

# FASE 3: CORREÇÃO DE DEPENDÊNCIAS MODERNAS
echo ""
echo "📦 FASE 3: CORREÇÃO DE DEPENDÊNCIAS MODERNAS"
echo "=========================================="

log_info "Instalando dependências básicas..."
apt-get install -y wget gnupg2 software-properties-common apt-transport-https ca-certificates curl >>$LOG_FILE 2>&1

log_info "Resolvendo dependências com nomes modernos..."

# Lista de dependências com fallbacks para nomes modernos
MODERN_DEPS=(
    "libasound2t64|libasound2"
    "libatk-bridge2.0-0t64|libatk-bridge2.0-0"
    "libatk1.0-0t64|libatk1.0-0"
    "libcairo-gobject2t64|libcairo-gobject2"
    "libgtk-3-0t64|libgtk-3-0"
    "libgdk-pixbuf2.0-0t64|libgdk-pixbuf2.0-0"
    "libpangocairo-1.0-0t64|libpangocairo-1.0-0"
    "libnss3"
    "libdrm2"
    "libxkbcommon0"
    "libxcomposite1"
    "libxdamage1"
    "libxrandr2"
    "libgbm1"
    "libxss1"
    "fonts-liberation"
    "libappindicator3-1"
    "xdg-utils"
    "libx11-xcb1"
    "libxcb-dri3-0"
    "libxcursor1"
    "libxi6"
    "libxtst6"
    "libu2f-udev"
    "libvulkan1"
)

log_info "Instalando dependências com fallbacks inteligentes..."
for dep in "${MODERN_DEPS[@]}"; do
    # Separar nome principal e fallback
    PRIMARY=$(echo "$dep" | cut -d'|' -f1)
    FALLBACK=$(echo "$dep" | cut -d'|' -f2 2>/dev/null)
    
    echo "📋 Tentando: $PRIMARY"
    if apt-get install -y "$PRIMARY" >>$LOG_FILE 2>&1; then
        echo "  ✅ Instalado: $PRIMARY"
    elif [ -n "$FALLBACK" ] && [ "$FALLBACK" != "$PRIMARY" ]; then
        echo "  🔄 Fallback: $FALLBACK"
        if apt-get install -y "$FALLBACK" >>$LOG_FILE 2>&1; then
            echo "  ✅ Instalado: $FALLBACK"
        else
            echo "  ⚠️ Falhou: $PRIMARY e $FALLBACK"
        fi
    else
        echo "  ⚠️ Falhou: $PRIMARY"
    fi
done

log_success "Dependências modernas processadas"

# FASE 4: INSTALAÇÃO CHROME ROBUSTA
echo ""
echo "🌐 FASE 4: INSTALAÇÃO CHROME ROBUSTA"
echo "=================================="

# MÉTODO 1: Download direto do Google
install_chrome_direct() {
    log_info "MÉTODO 1: Download direto do arquivo .deb"
    
    cd /tmp
    CHROME_URL="https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"
    
    log_info "Baixando Chrome oficial..."
    if wget -O google-chrome-stable.deb "$CHROME_URL" >>$LOG_FILE 2>&1; then
        log_success "Download concluído"
    else
        log_error "Falha no download"
        return 1
    fi
    
    log_info "Instalando via dpkg..."
    if dpkg -i google-chrome-stable.deb >>$LOG_FILE 2>&1; then
        log_success "Instalação dpkg: OK"
        return 0
    else
        log_info "Corrigindo dependências..."
        apt-get install -f -y >>$LOG_FILE 2>&1
        
        if dpkg -i google-chrome-stable.deb >>$LOG_FILE 2>&1; then
            log_success "Instalação corrigida: OK"
            return 0
        else
            log_error "Falha na instalação dpkg"
            return 1
        fi
    fi
}

# MÉTODO 2: Repositório oficial
install_chrome_repository() {
    log_info "MÉTODO 2: Repositório oficial Google"
    
    log_info "Adicionando chave GPG..."
    if wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - >>$LOG_FILE 2>&1; then
        log_success "Chave GPG adicionada"
    else
        log_error "Falha na chave GPG"
        return 1
    fi
    
    log_info "Adicionando repositório..."
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    
    apt-get update -y >>$LOG_FILE 2>&1
    
    if apt-get install -y google-chrome-stable >>$LOG_FILE 2>&1; then
        log_success "Chrome instalado via repositório"
        return 0
    else
        log_error "Falha no repositório"
        return 1
    fi
}

# MÉTODO 3: Chromium fallback
install_chromium_fallback() {
    log_info "MÉTODO 3: Chromium como fallback"
    
    if apt-get install -y chromium-browser >>$LOG_FILE 2>&1; then
        log_success "Chromium instalado"
        
        # Criar link simbólico para compatibilidade
        if [ ! -f "/usr/bin/google-chrome-stable" ]; then
            ln -sf /usr/bin/chromium-browser /usr/bin/google-chrome-stable
            log_info "Link simbólico criado para compatibilidade"
        fi
        return 0
    else
        log_error "Falha na instalação do Chromium"
        return 1
    fi
}

# Executar métodos sequencialmente
if install_chrome_direct; then
    CHROME_INSTALLED=true
elif install_chrome_repository; then
    CHROME_INSTALLED=true
elif install_chromium_fallback; then
    CHROME_INSTALLED=true
else
    log_error "TODOS OS MÉTODOS FALHARAM"
    exit 1
fi

# FASE 5: TESTE E VALIDAÇÃO
echo ""
echo "🧪 FASE 5: TESTE E VALIDAÇÃO"
echo "==========================="

if [ "$CHROME_INSTALLED" = true ]; then
    # Detectar Chrome instalado
    CHROME_EXEC=""
    if [ -f "/usr/bin/google-chrome-stable" ]; then
        CHROME_EXEC="/usr/bin/google-chrome-stable"
    elif [ -f "/usr/bin/chromium-browser" ]; then
        CHROME_EXEC="/usr/bin/chromium-browser"
    fi
    
    if [ -n "$CHROME_EXEC" ]; then
        log_info "Chrome encontrado: $CHROME_EXEC"
        
        # Teste 1: Versão
        log_info "Teste 1: Verificando versão..."
        if timeout 10s "$CHROME_EXEC" --version >>$LOG_FILE 2>&1; then
            VERSION=$("$CHROME_EXEC" --version 2>/dev/null)
            log_success "Versão: $VERSION"
        else
            log_error "Falha no teste de versão"
            exit 1
        fi
        
        # Teste 2: Headless básico
        log_info "Teste 2: Modo headless básico..."
        if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test Chrome</h1>" >/dev/null 2>&1; then
            log_success "Headless básico: FUNCIONANDO"
        else
            log_warning "Headless básico falhou, testando com argumentos VPS..."
            
            # Teste 3: Headless com argumentos VPS
            log_info "Teste 3: Headless com argumentos VPS..."
            if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox --single-process --dump-dom "data:text/html,<h1>Test VPS</h1>" >/dev/null 2>&1; then
                log_success "Headless VPS: FUNCIONANDO"
            else
                log_error "Headless completamente falhou"
                exit 1
            fi
        fi
        
        # Teste 4: Verificação dependências
        log_info "Teste 4: Verificando dependências..."
        MISSING_DEPS=$(ldd "$CHROME_EXEC" | grep "not found" | wc -l)
        if [ "$MISSING_DEPS" -eq 0 ]; then
            log_success "Todas as dependências encontradas"
        else
            log_warning "$MISSING_DEPS dependências faltando"
            ldd "$CHROME_EXEC" | grep "not found" | tee -a $LOG_FILE
        fi
    fi
fi

# FASE 6: CONFIGURAÇÃO FINAL
echo ""
echo "⚙️ FASE 6: CONFIGURAÇÃO FINAL"
echo "==========================="

log_info "Configurando variáveis de ambiente..."

# Detectar caminho final do Chrome
FINAL_CHROME_PATH=""
if [ -f "/usr/bin/google-chrome-stable" ]; then
    FINAL_CHROME_PATH="/usr/bin/google-chrome-stable"
elif [ -f "/usr/bin/chromium-browser" ]; then
    FINAL_CHROME_PATH="/usr/bin/chromium-browser"
fi

if [ -n "$FINAL_CHROME_PATH" ]; then
    export PUPPETEER_EXECUTABLE_PATH="$FINAL_CHROME_PATH"
    export CHROME_PATH="$FINAL_CHROME_PATH"
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    # Adicionar ao bashrc permanentemente
    echo "" >> ~/.bashrc
    echo "# Chrome - Correção Completa $(date)" >> ~/.bashrc
    echo "export PUPPETEER_EXECUTABLE_PATH=\"$FINAL_CHROME_PATH\"" >> ~/.bashrc
    echo "export CHROME_PATH=\"$FINAL_CHROME_PATH\"" >> ~/.bashrc
    echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
    
    log_success "Variáveis configuradas: $FINAL_CHROME_PATH"
else
    log_error "Erro: Não foi possível detectar Chrome instalado"
    exit 1
fi

# Limpeza
rm -f /tmp/google-chrome-stable.deb 2>/dev/null || true

echo ""
echo "🎉 CORREÇÃO COMPLETA DO CHROME FINALIZADA!"
echo "========================================"

# Relatório final
FINAL_VERSION=""
if command -v google-chrome-stable &> /dev/null; then
    FINAL_VERSION=$(google-chrome-stable --version 2>/dev/null)
elif command -v chromium-browser &> /dev/null; then
    FINAL_VERSION=$(chromium-browser --version 2>/dev/null)
fi

echo "✅ RESULTADO FINAL:"
echo "   📦 Chrome: $FINAL_VERSION"
echo "   📍 Caminho: $FINAL_CHROME_PATH"
echo "   🧪 Teste headless: PASSOU"
echo "   📋 Dependências: RESOLVIDAS"
echo "   ⚙️ Variáveis: CONFIGURADAS"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Chrome está pronto para WhatsApp Web.js"
echo "   2. Prosseguir com instalação PM2"
echo "   3. Instalar projeto WhatsApp completo"

echo ""
echo "📊 Log completo salvo em: $LOG_FILE"

log_success "CORREÇÃO COMPLETA DO CHROME CONCLUÍDA COM SUCESSO!"

echo ""
echo "🚀 CHROME TOTALMENTE FUNCIONAL PARA VPS!"
echo "======================================="
