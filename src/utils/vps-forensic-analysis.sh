
#!/bin/bash

# ANÁLISE FORENSE COMPLETA VPS - INVESTIGAÇÃO PROFUNDA
echo "🔬 ANÁLISE FORENSE COMPLETA VPS - INVESTIGAÇÃO PROFUNDA"
echo "======================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Mapear TODOS os componentes e conflitos do sistema"
echo ""

# Função de log avançada
log_forensic() {
    echo "[$(date '+%H:%M:%S')] 🔍 $1"
}

log_critical() {
    echo "[$(date '+%H:%M:%S')] 🚨 CRÍTICO: $1"
}

log_warning() {
    echo "[$(date '+%H:%M:%S')] ⚠️ ATENÇÃO: $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

# FASE 1: MAPEAMENTO COMPLETO DO SISTEMA
echo ""
echo "🔍 FASE 1: MAPEAMENTO COMPLETO DO SISTEMA"
echo "========================================"

log_forensic "Coletando informações do sistema..."

echo "📋 INFORMAÇÕES BÁSICAS DO SISTEMA:"
echo "   Sistema: $(uname -a)"
echo "   Distribuição: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "   Kernel: $(uname -r)"
echo "   Arquitetura: $(uname -m)"
echo "   Uptime: $(uptime)"

echo ""
echo "💾 RECURSOS DO SISTEMA:"
echo "   Memória:"
free -h | head -2

echo "   CPU:"
lscpu | grep -E "(Model name|CPU\(s\)|Thread|Core)"

echo "   Disco:"
df -h | grep -E "(Filesystem|/$|/root)"

# FASE 2: MAPEAMENTO COMPLETO NODE.JS E DERIVADOS
echo ""
echo "🔍 FASE 2: MAPEAMENTO COMPLETO NODE.JS"
echo "====================================="

log_forensic "Procurando TODAS as instalações Node.js no sistema..."

echo "📍 INSTALAÇÕES NODE.JS ENCONTRADAS:"
# Procurar em locais comuns
NODE_LOCATIONS=(
    "/usr/bin/node"
    "/usr/local/bin/node"
    "/opt/node/bin/node"
    "/snap/bin/node"
    "~/.nvm/versions/node/*/bin/node"
    "/usr/bin/nodejs"
)

for location in "${NODE_LOCATIONS[@]}"; do
    if ls $location 2>/dev/null; then
        version=$(eval "$location --version" 2>/dev/null || echo "ERRO")
        echo "   ✅ $location - Versão: $version"
    fi
done

echo ""
echo "📍 PROCURA GLOBAL POR EXECUTÁVEIS NODE:"
find /usr /opt /snap 2>/dev/null | grep -E "(node$|nodejs$)" | head -10

echo ""
echo "📍 VERIFICAÇÃO NVM:"
if [ -d ~/.nvm ]; then
    echo "   ✅ NVM encontrado em ~/.nvm"
    ls ~/.nvm/versions/node/ 2>/dev/null || echo "   ❌ Nenhuma versão Node via NVM"
else
    echo "   ❌ NVM não encontrado"
fi

echo ""
echo "📍 NODE_MODULES GLOBAIS:"
npm list -g --depth=0 2>/dev/null | head -15 || echo "   ❌ NPM não acessível"

# FASE 3: MAPEAMENTO COMPLETO PUPPETEER
echo ""
echo "🔍 FASE 3: MAPEAMENTO COMPLETO PUPPETEER"
echo "======================================"

log_forensic "Procurando TODAS as instalações Puppeteer..."

echo "📍 PUPPETEER INSTALAÇÕES:"
find /root /usr /opt 2>/dev/null | grep -i puppeteer | head -20 || echo "   ❌ Nenhuma instalação Puppeteer encontrada"

echo ""
echo "📍 PUPPETEER VIA NPM:"
npm list puppeteer 2>/dev/null | head -10 || echo "   ❌ Puppeteer não listado via NPM local"
npm list -g puppeteer 2>/dev/null | head -10 || echo "   ❌ Puppeteer não listado via NPM global"

echo ""
echo "📍 CHROMIUM BAIXADO PELO PUPPETEER:"
find /root -name "*chromium*" -type d 2>/dev/null | head -10 || echo "   ❌ Nenhum Chromium baixado pelo Puppeteer"

# FASE 4: MAPEAMENTO COMPLETO CHROME/CHROMIUM
echo ""
echo "🔍 FASE 4: MAPEAMENTO COMPLETO CHROME/CHROMIUM"
echo "============================================="

log_forensic "Mapeando TODAS as instalações Chrome/Chromium..."

echo "📍 EXECUTÁVEIS CHROME/CHROMIUM:"
CHROME_PATHS=(
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/opt/google/chrome/chrome"
    "/snap/bin/chromium"
    "/usr/local/bin/chrome"
)

CHROME_WORKING=()
CHROME_BROKEN=()

for chrome_path in "${CHROME_PATHS[@]}"; do
    if [ -f "$chrome_path" ]; then
        version=$($chrome_path --version 2>/dev/null || echo "ERRO")
        if [[ "$version" != "ERRO" ]]; then
            echo "   ✅ $chrome_path - $version"
            CHROME_WORKING+=("$chrome_path")
        else
            echo "   ❌ $chrome_path - NÃO FUNCIONA"
            CHROME_BROKEN+=("$chrome_path")
        fi
    fi
done

echo ""
echo "📍 CHROME VIA SNAP:"
snap list 2>/dev/null | grep -i chrom || echo "   ❌ Nenhum Chrome via Snap"

echo ""
echo "📍 CHROME VIA APT:"
dpkg -l | grep -i chrom | head -10 || echo "   ❌ Nenhum Chrome via APT"

echo ""
echo "📍 BIBLIOTECAS CHROME:"
find /usr/lib -name "*chrome*" -type d 2>/dev/null | head -5 || echo "   ❌ Nenhuma biblioteca Chrome encontrada"

# FASE 5: ANÁLISE DE PROCESSOS E CONFLITOS
echo ""
echo "🔍 FASE 5: ANÁLISE DE PROCESSOS E CONFLITOS"
echo "=========================================="

log_forensic "Analisando processos ativos e possíveis conflitos..."

echo "📍 PROCESSOS NODE.JS ATIVOS:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "   ❌ Nenhum processo Node.js ativo"

echo ""
echo "📍 PROCESSOS CHROME ATIVOS:"
ps aux | grep -E "(chrome|chromium)" | grep -v grep || echo "   ❌ Nenhum processo Chrome ativo"

echo ""
echo "📍 PROCESSOS PM2:"
pm2 list 2>/dev/null || echo "   ❌ PM2 não encontrado ou sem processos"

echo ""
echo "📍 PORTAS EM USO:"
netstat -tulpn 2>/dev/null | grep -E "(3001|3002|9222)" || echo "   ❌ Nenhuma porta WhatsApp/Debug ativa"

# FASE 6: ANÁLISE DE LOGS E ERROS
echo ""
echo "🔍 FASE 6: ANÁLISE DE LOGS E ERROS"
echo "================================="

log_forensic "Analisando logs do sistema..."

echo "📍 ERROS RECENTES NO KERNEL (dmesg):"
dmesg | tail -20 | grep -i -E "(error|chrome|node|segfault)" || echo "   ✅ Nenhum erro relevante no kernel"

echo ""
echo "📍 ERROS RECENTES NO SYSTEMD:"
journalctl -xe --no-pager | tail -30 | grep -i -E "(error|failed|chrome|node)" || echo "   ✅ Nenhum erro relevante no systemd"

echo ""
echo "📍 LOGS PM2 (se existir):"
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 10 2>/dev/null | grep -i error || echo "   ✅ Nenhum erro nos logs PM2"
else
    echo "   ❌ PM2 não disponível"
fi

# FASE 7: ANÁLISE DE SEGURANÇA E RESTRIÇÕES
echo ""
echo "🔍 FASE 7: ANÁLISE DE SEGURANÇA E RESTRIÇÕES"
echo "==========================================="

log_forensic "Verificando políticas de segurança que podem bloquear Puppeteer..."

echo "📍 APPARMOR:"
if command -v aa-status &> /dev/null; then
    echo "   ✅ AppArmor ativo:"
    aa-status | head -10
    echo ""
    echo "   📋 Perfis relacionados ao Chrome:"
    aa-status | grep -i chrome || echo "   ✅ Nenhum perfil Chrome no AppArmor"
else
    echo "   ✅ AppArmor não instalado"
fi

echo ""
echo "📍 SELINUX:"
if command -v getenforce &> /dev/null; then
    echo "   ⚠️ SELinux status: $(getenforce)"
else
    echo "   ✅ SELinux não instalado"
fi

echo ""
echo "📍 ULIMITS:"
echo "   📋 Limites de processo:"
ulimit -a | grep -E "(processes|files|memory)"

echo ""
echo "📍 VARIÁVEIS DE AMBIENTE:"
echo "   📋 Variáveis relacionadas:"
env | grep -i -E "(chrome|puppeteer|node|display)" || echo "   ✅ Nenhuma variável específica"

# FASE 8: TESTE DE DEPENDÊNCIAS
echo ""
echo "🔍 FASE 8: TESTE DE DEPENDÊNCIAS"
echo "==============================="

log_forensic "Testando dependências críticas..."

echo "📍 BIBLIOTECAS COMPARTILHADAS:"
if [ ${#CHROME_WORKING[@]} -gt 0 ]; then
    chrome_exe="${CHROME_WORKING[0]}"
    echo "   📋 Dependências do Chrome ($chrome_exe):"
    ldd "$chrome_exe" | grep "not found" || echo "   ✅ Todas as dependências encontradas"
else
    echo "   ❌ Nenhum Chrome funcional para testar dependências"
fi

echo ""
echo "📍 TESTE BÁSICO CHROME:"
if [ ${#CHROME_WORKING[@]} -gt 0 ]; then
    chrome_exe="${CHROME_WORKING[0]}"
    echo "   🧪 Testando Chrome headless básico..."
    timeout 10s "$chrome_exe" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,test" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Chrome headless funciona"
    else
        echo "   ❌ Chrome headless FALHA"
    fi
else
    echo "   ❌ Nenhum Chrome para testar"
fi

# RESUMO DA ANÁLISE FORENSE
echo ""
echo "📊 RESUMO DA ANÁLISE FORENSE"
echo "=========================="

echo "🔍 RESULTADOS DA INVESTIGAÇÃO:"
echo "   Chrome funcionando: ${#CHROME_WORKING[@]} instalações"
echo "   Chrome com problemas: ${#CHROME_BROKEN[@]} instalações"

if [ ${#CHROME_WORKING[@]} -gt 0 ]; then
    echo "   ✅ Chrome principal: ${CHROME_WORKING[0]}"
else
    log_critical "NENHUM CHROME FUNCIONANDO ENCONTRADO!"
fi

echo ""
echo "💡 PRÓXIMAS AÇÕES BASEADAS NA ANÁLISE:"
if [ ${#CHROME_WORKING[@]} -eq 0 ]; then
    echo "   1. 🚨 CRÍTICO: Instalar Chrome funcional"
    echo "   2. 🔧 Configurar dependências do sistema"
    echo "   3. 🧪 Testar Puppeteer básico"
else
    echo "   1. 🧹 Limpar instalações conflitantes"
    echo "   2. 🔧 Configurar Puppeteer com Chrome funcional"
    echo "   3. 🧪 Implementar servidor corrigido"
fi

echo ""
log_success "ANÁLISE FORENSE CONCLUÍDA!"
echo "📋 Execute o próximo script: vps-radical-cleanup.sh"
