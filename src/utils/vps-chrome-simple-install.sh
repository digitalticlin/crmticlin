
#!/bin/bash

# INSTALAÇÃO CHROME SIMPLIFICADA PARA VPS
echo "🚀 INSTALAÇÃO CHROME SIMPLIFICADA"
echo "================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar Chrome rapidamente"
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

# Verificações básicas rápidas
log_info "Verificando pré-requisitos básicos..."

# Verificar se já existe Chrome instalado
if command -v google-chrome-stable &> /dev/null; then
    log_success "Google Chrome já instalado: $(google-chrome-stable --version)"
    log_info "Testando funcionalidade..."
    if timeout 10s google-chrome-stable --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
        log_success "Chrome funcionando corretamente!"
        exit 0
    else
        log_info "Chrome instalado mas com problemas, continuando instalação..."
    fi
fi

# Verificar conectividade (timeout 5s)
log_info "Verificando conectividade..."
if timeout 5s ping -c 1 google.com >/dev/null 2>&1; then
    log_success "Conectividade OK"
else
    log_error "Sem conectividade - Abortando"
    exit 1
fi

# Atualizar apenas lista de pacotes (sem upgrade)
log_info "Atualizando lista de pacotes..."
if timeout 30s apt-get update -y >>$LOG_FILE 2>&1; then
    log_success "Lista de pacotes atualizada"
else
    log_error "Falha ao atualizar lista de pacotes"
    exit 1
fi

# Instalar dependências mínimas
log_info "Instalando dependências básicas..."
apt-get install -y wget gnupg ca-certificates >>$LOG_FILE 2>&1

# MÉTODO 1: Download direto do Chrome
log_info "MÉTODO 1: Download direto do Google Chrome..."
cd /tmp

CHROME_URL="https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"
log_info "Baixando Chrome..."

if timeout 60s wget -O google-chrome.deb "$CHROME_URL" >>$LOG_FILE 2>&1; then
    log_success "Download concluído"
else
    log_error "Falha no download - tentando método alternativo"
    
    # MÉTODO 2: Repositório oficial
    log_info "MÉTODO 2: Instalação via repositório..."
    
    # Adicionar chave e repositório
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - >>$LOG_FILE 2>&1
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    
    apt-get update -y >>$LOG_FILE 2>&1
    
    if timeout 120s apt-get install -y google-chrome-stable >>$LOG_FILE 2>&1; then
        log_success "Chrome instalado via repositório"
    else
        log_error "Falha no repositório - tentando Chromium"
        
        # MÉTODO 3: Chromium fallback
        log_info "MÉTODO 3: Instalando Chromium como alternativa..."
        if timeout 60s apt-get install -y chromium-browser >>$LOG_FILE 2>&1; then
            log_success "Chromium instalado"
            # Criar link simbólico
            ln -sf /usr/bin/chromium-browser /usr/bin/google-chrome-stable
        else
            log_error "Falha completa na instalação"
            exit 1
        fi
    fi
    
    # Pular para teste se repositório funcionou
    if command -v google-chrome-stable &> /dev/null; then
        log_success "Instalação via repositório concluída"
    fi
else
    # Continuar com download direto
    log_info "Instalando via dpkg..."
    
    # Tentar instalação direta
    if dpkg -i google-chrome.deb >>$LOG_FILE 2>&1; then
        log_success "Instalação dpkg: OK"
    else
        log_info "Resolvendo dependências..."
        apt-get install -f -y >>$LOG_FILE 2>&1
        
        if dpkg -i google-chrome.deb >>$LOG_FILE 2>&1; then
            log_success "Instalação corrigida: OK"
        else
            log_error "Falha na instalação via dpkg"
            exit 1
        fi
    fi
fi

# Instalar dependências para headless
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

log_success "Dependências instaladas"

# Teste final
log_info "Testando instalação..."

# Detectar Chrome instalado
CHROME_EXEC=""
if [ -f "/usr/bin/google-chrome-stable" ]; then
    CHROME_EXEC="/usr/bin/google-chrome-stable"
elif [ -f "/usr/bin/chromium-browser" ]; then
    CHROME_EXEC="/usr/bin/chromium-browser"
else
    log_error "Nenhum executável encontrado"
    exit 1
fi

log_info "Chrome encontrado em: $CHROME_EXEC"

# Teste de versão
if timeout 10s "$CHROME_EXEC" --version >>$LOG_FILE 2>&1; then
    VERSION=$("$CHROME_EXEC" --version)
    log_success "Versão: $VERSION"
else
    log_error "Falha no teste de versão"
    exit 1
fi

# Teste headless
log_info "Testando modo headless..."
if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
    log_success "Modo headless: FUNCIONANDO"
else
    log_info "Testando com argumentos VPS..."
    if timeout 15s "$CHROME_EXEC" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-setuid-sandbox --single-process --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
        log_success "Modo headless com argumentos VPS: FUNCIONANDO"
    else
        log_error "Modo headless: FALHOU"
        exit 1
    fi
fi

# Configurar variáveis de ambiente
log_info "Configurando variáveis de ambiente..."
export PUPPETEER_EXECUTABLE_PATH="$CHROME_EXEC"
export CHROME_PATH="$CHROME_EXEC"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Adicionar ao bashrc
echo "" >> ~/.bashrc
echo "# Chrome - Instalação Simplificada $(date)" >> ~/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=\"$CHROME_EXEC\"" >> ~/.bashrc
echo "export CHROME_PATH=\"$CHROME_EXEC\"" >> ~/.bashrc
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc

log_success "Variáveis configuradas"

# Limpeza
rm -f /tmp/google-chrome.deb

echo ""
echo "🎉 INSTALAÇÃO CHROME SIMPLIFICADA CONCLUÍDA!"
echo "=========================================="
echo "✅ Chrome instalado: $VERSION"
echo "✅ Caminho: $CHROME_EXEC"
echo "✅ Teste headless: PASSOU"
echo "✅ Variáveis configuradas"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Reiniciar servidor WhatsApp: pm2 restart whatsapp-main-3002"
echo "2. Testar criação de instância"
echo ""
echo "📊 Log completo: $LOG_FILE"

log_success "INSTALAÇÃO CHROME SIMPLIFICADA FINALIZADA!"
