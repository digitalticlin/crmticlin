
#!/bin/bash

# DIAGNÓSTICO COMPLETO VPS - ANÁLISE PROFUNDA PUPPETEER
# Objetivo: Identificar causa raiz do erro "Protocol error (Network.setUserAgentOverride): Session closed"
echo "🔬 DIAGNÓSTICO COMPLETO VPS - ANÁLISE PROFUNDA PUPPETEER"
echo "========================================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Resolver erro 'Session closed' definitivamente"
echo ""

# Configurações
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TIMESTAMP=$(date +%s)

# Função de log com cores
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[✅]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[⚠️]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[❌]\033[0m $1"
}

log_section() {
    echo ""
    echo -e "\033[36m===============================================\033[0m"
    echo -e "\033[36m$1\033[0m"
    echo -e "\033[36m===============================================\033[0m"
}

# FASE 1: VERIFICAÇÃO COMPLETA DOS CAMINHOS CHROME/CHROMIUM
log_section "FASE 1: VERIFICAÇÃO COMPLETA CHROME/CHROMIUM"

log_info "🔍 Mapeando todas as instalações de Chrome/Chromium..."

# Verificar todos os possíveis executáveis
CHROME_PATHS=(
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
    "/snap/bin/chromium"
    "/opt/google/chrome/chrome"
    "/usr/local/bin/chrome"
    "/usr/local/bin/chromium"
)

WORKING_CHROMES=()
BROKEN_CHROMES=()

for chrome_path in "${CHROME_PATHS[@]}"; do
    if [ -f "$chrome_path" ]; then
        log_info "📍 Testando: $chrome_path"
        
        # Verificar se é executável
        if [ -x "$chrome_path" ]; then
            # Testar versão
            if version_output=$("$chrome_path" --version 2>/dev/null); then
                log_success "   Versão: $version_output"
                
                # Testar headless básico
                if timeout 10s "$chrome_path" --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,test" >/dev/null 2>&1; then
                    log_success "   Headless: FUNCIONANDO"
                    WORKING_CHROMES+=("$chrome_path")
                else
                    log_warning "   Headless: FALHA"
                    BROKEN_CHROMES+=("$chrome_path")
                fi
            else
                log_error "   Não consegue obter versão"
                BROKEN_CHROMES+=("$chrome_path")
            fi
        else
            log_error "   Não é executável"
        fi
    fi
done

echo ""
log_info "📊 RESUMO CHROME/CHROMIUM:"
log_success "Funcionando: ${#WORKING_CHROMES[@]} executáveis"
for chrome in "${WORKING_CHROMES[@]}"; do
    echo "   ✅ $chrome"
done

log_warning "Com problemas: ${#BROKEN_CHROMES[@]} executáveis"
for chrome in "${BROKEN_CHROMES[@]}"; do
    echo "   ❌ $chrome"
done

# FASE 2: VERIFICAÇÃO DA INTEGRIDADE DO AMBIENTE
log_section "FASE 2: VERIFICAÇÃO DA INTEGRIDADE DO AMBIENTE"

log_info "🔍 Verificando processos PM2..."
echo "📋 Processos PM2 ativos:"
pm2 list 2>/dev/null || log_warning "PM2 não está rodando"

echo ""
log_info "🔍 Verificando processos órfãos..."
echo "📋 Processos Node.js ativos:"
ps aux | grep -E "(node|pm2)" | grep -v grep || log_info "Nenhum processo Node.js encontrado"

echo ""
log_info "🔍 Verificando processos Chrome órfãos..."
echo "📋 Processos Chrome ativos:"
ps aux | grep -E "(chrome|chromium)" | grep -v grep || log_info "Nenhum processo Chrome encontrado"

echo ""
log_info "🔍 Verificando porta 3002..."
if netstat -tulpn 2>/dev/null | grep ":3002" >/dev/null; then
    echo "📋 Porta 3002 ocupada por:"
    netstat -tulpn 2>/dev/null | grep ":3002"
else
    log_warning "Porta 3002 livre"
fi

echo ""
log_info "🔍 Verificando estrutura de diretórios..."
echo "📁 Estrutura /root:"
ls -la /root/ | grep -E "(whatsapp|node_modules|\.wwebjs|sessions)"

echo ""
log_info "🔍 Verificando node_modules..."
if [ -d "/root/node_modules" ]; then
    log_success "Node_modules local encontrado"
    echo "📦 Dependências principais:"
    cd /root
    npm list --depth=0 2>/dev/null | grep -E "(whatsapp-web|puppeteer|express|cors)" || log_warning "Dependências não listadas corretamente"
else
    log_error "Node_modules local não encontrado"
fi

# FASE 3: VERIFICAÇÃO DE PERMISSÕES E SEGURANÇA
log_section "FASE 3: VERIFICAÇÃO DE PERMISSÕES E SEGURANÇA"

log_info "🛡️ Verificando AppArmor..."
if command -v aa-status >/dev/null 2>&1; then
    echo "📋 Status AppArmor:"
    aa-status 2>/dev/null | head -10
    
    echo ""
    log_info "🔍 Verificando perfis relacionados ao Chrome..."
    aa-status 2>/dev/null | grep -i chrome || log_info "Nenhum perfil Chrome no AppArmor"
else
    log_success "AppArmor não está instalado"
fi

echo ""
log_info "🔍 Verificando limites de recursos..."
echo "💾 Memória disponível:"
free -h

echo ""
echo "💽 Espaço em disco:"
df -h /

echo ""
echo "⚙️ Limites de processo:"
ulimit -a | grep -E "(processes|files)"

echo ""
log_info "🔍 Verificando permissões de usuário..."
echo "👤 Usuário atual: $(whoami)"
echo "🏠 Diretório home: $HOME"
echo "📁 Permissões /root:"
ls -ld /root

# FASE 4: ANÁLISE ESPECÍFICA DO ERRO "SESSION CLOSED"
log_section "FASE 4: ANÁLISE ESPECÍFICA DO ERRO SESSION CLOSED"

log_info "🔬 Testando Puppeteer isoladamente..."

# Criar teste específico para o erro Session closed
cat > /tmp/test-session-closed.js << 'TEST_EOF'
const puppeteer = require('puppeteer');

console.log('🧪 TESTE ESPECÍFICO: Reproduzir erro Session closed');

const testConfigs = [
    {
        name: "Configuração Básica",
        config: {
            headless: true,
            args: ['--no-sandbox']
        }
    },
    {
        name: "Configuração WhatsApp Original",
        config: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    },
    {
        name: "Configuração VPS Otimizada",
        config: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--disable-gpu',
                '--no-first-run',
                '--disable-extensions'
            ]
        }
    }
];

for (const test of testConfigs) {
    console.log(`\n🔬 Testando: ${test.name}`);
    
    try {
        const browser = await puppeteer.launch(test.config);
        console.log('✅ Browser lançado');
        
        const page = await browser.newPage();
        console.log('✅ Página criada');
        
        // ESTE É O PONTO CRÍTICO - setUserAgent
        console.log('🎯 Testando setUserAgent (ponto do erro)...');
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
        console.log('✅ setUserAgent funcionou!');
        
        await page.goto('data:text/html,<h1>Test</h1>');
        console.log('✅ Navegação funcionou!');
        
        await browser.close();
        console.log('✅ SUCESSO TOTAL!');
        
    } catch (error) {
        console.error(`❌ ERRO: ${error.message}`);
        if (error.message.includes('Session closed')) {
            console.error('🎯 ERRO "SESSION CLOSED" REPRODUZIDO!');
        }
    }
}
TEST_EOF

echo "🚀 Executando teste de reprodução do erro..."
cd /root
timeout 60s node /tmp/test-session-closed.js 2>&1

echo ""
log_info "🔍 Verificando logs específicos do erro..."
if [ -f "/root/.pm2/logs/whatsapp-main-3002-error.log" ]; then
    echo "📋 Últimos erros PM2:"
    tail -20 /root/.pm2/logs/whatsapp-main-3002-error.log | grep -A5 -B5 "Session closed"
fi

# FASE 5: VERIFICAÇÃO DE DEPENDÊNCIAS E VERSÕES
log_section "FASE 5: VERIFICAÇÃO DE DEPENDÊNCIAS E VERSÕES"

log_info "📦 Verificando versões críticas..."
echo "🔧 Node.js: $(node --version)"
echo "📦 NPM: $(npm --version)"

echo ""
log_info "🔍 Verificando versões específicas das dependências..."
cd /root
if [ -f "package.json" ]; then
    echo "📋 Dependências instaladas:"
    npm list whatsapp-web.js puppeteer puppeteer-core express cors 2>/dev/null
else
    log_warning "package.json não encontrado"
fi

echo ""
log_info "🔍 Verificando conflitos de versão..."
if [ -d "node_modules" ]; then
    echo "📋 Verificando puppeteer instalado:"
    find node_modules -name "puppeteer*" -type d 2>/dev/null | head -10
    
    echo ""
    echo "📋 Verificando whatsapp-web.js:"
    find node_modules -name "*whatsapp*" -type d 2>/dev/null | head -5
fi

# FASE 6: TESTE DE CONECTIVIDADE ATUAL
log_section "FASE 6: TESTE DE CONECTIVIDADE ATUAL"

log_info "🌐 Testando servidor atual..."
if curl -s http://localhost:3002/health >/dev/null 2>&1; then
    echo "📋 Health check:"
    curl -s http://localhost:3002/health | jq . 2>/dev/null || curl -s http://localhost:3002/health
else
    log_warning "Servidor não está respondendo na porta 3002"
fi

echo ""
log_info "🧪 Testando criação de instância..."
create_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST \
    "http://localhost:3002/instance/create" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"instanceName":"diagnostic_test"}' \
    --max-time 30 2>/dev/null)

create_status=$(echo $create_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
create_body=$(echo $create_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $create_status"
echo "Response: $create_body"

if echo "$create_body" | grep -q "Session closed"; then
    log_error "🎯 ERRO 'SESSION CLOSED' CONFIRMADO NA CRIAÇÃO DE INSTÂNCIA!"
fi

# RESUMO E RECOMENDAÇÕES
log_section "RESUMO E RECOMENDAÇÕES"

echo "📊 DIAGNÓSTICO COMPLETO FINALIZADO"
echo "=================================="
echo ""
echo "🔍 RESULTADOS:"
echo "   Chrome funcionando: ${#WORKING_CHROMES[@]} executáveis"
echo "   Erro Session closed: $(echo "$create_body" | grep -q "Session closed" && echo "CONFIRMADO" || echo "NÃO DETECTADO")"
echo ""
echo "💡 PRÓXIMAS AÇÕES RECOMENDADAS:"

if [ ${#WORKING_CHROMES[@]} -eq 0 ]; then
    echo "   1. ❌ CRÍTICO: Instalar Chrome funcional"
    echo "   2. 🔧 Configurar Puppeteer com Chrome correto"
elif echo "$create_body" | grep -q "Session closed"; then
    echo "   1. 🎯 PROBLEMA IDENTIFICADO: Erro Session closed confirmado"
    echo "   2. 🔧 Aplicar configuração Puppeteer específica para VPS"
    echo "   3. 🧹 Limpar ambiente e reinstalar dependências"
else
    echo "   1. ✅ Ambiente parece estar configurado corretamente"
    echo "   2. 🔍 Investigar outros possíveis problemas"
fi

echo ""
echo "📋 LOGS SALVOS EM:"
echo "   /tmp/test-session-closed.js (teste específico)"
echo "   Este output completo do diagnóstico"

# Cleanup
rm -f /tmp/test-session-closed.js 2>/dev/null

echo ""
log_success "🏁 DIAGNÓSTICO COMPLETO FINALIZADO!"
echo "Execute as recomendações acima para resolver o problema definitivamente."
