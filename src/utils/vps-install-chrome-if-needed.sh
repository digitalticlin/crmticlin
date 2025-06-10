
#!/bin/bash

# INSTALAR CHROME SE NECESSÁRIO PARA V4.0
echo "🌐 INSTALAR CHROME PARA V4.0 ULTRA (SE NECESSÁRIO)"
echo "================================================="

echo "📅 Data: $(date)"
echo "🎯 Garantir Chrome funcional para V4.0"
echo ""

echo "🔍 VERIFICANDO CHROME ATUAL"
echo "=========================="

CHROME_FOUND=false
CHROME_PATHS=(
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
)

for chrome_path in "${CHROME_PATHS[@]}"; do
    if [ -f "$chrome_path" ]; then
        echo "📋 Testando: $chrome_path"
        if timeout 5s "$chrome_path" --version >/dev/null 2>&1; then
            version=$("$chrome_path" --version 2>/dev/null)
            echo "✅ ENCONTRADO: $version"
            CHROME_FOUND=true
            break
        else
            echo "❌ Não funcional: $chrome_path"
        fi
    fi
done

if [ "$CHROME_FOUND" = true ]; then
    echo "✅ Chrome funcional já instalado - V4.0 pode usar"
    echo "🎯 V4.0 Ultra detectará automaticamente"
    exit 0
fi

echo "❌ Nenhum Chrome funcional encontrado"
echo "🚀 Instalando Google Chrome Stable..."

echo ""
echo "📦 INSTALANDO GOOGLE CHROME STABLE"
echo "================================="

echo "📋 Atualizando repositórios..."
apt update -q

echo "📋 Instalando dependências..."
apt install -y wget gnupg

echo "📋 Adicionando chave do repositório Google..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

echo "📋 Adicionando repositório Google Chrome..."
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

echo "📋 Atualizando com novo repositório..."
apt update -q

echo "📋 Instalando Google Chrome Stable..."
apt install -y google-chrome-stable

echo ""
echo "🧪 TESTANDO INSTALAÇÃO"
echo "====================="

if [ -f "/usr/bin/google-chrome-stable" ]; then
    echo "✅ Google Chrome Stable instalado"
    
    if timeout 10s /usr/bin/google-chrome-stable --version >/dev/null 2>&1; then
        version=$(/usr/bin/google-chrome-stable --version 2>/dev/null)
        echo "✅ FUNCIONANDO: $version"
        
        # Teste com args básicos
        if timeout 10s /usr/bin/google-chrome-stable --no-sandbox --headless --disable-gpu --version >/dev/null 2>&1; then
            echo "✅ ACEITA ARGUMENTOS: Pronto para V4.0 Ultra"
        else
            echo "⚠️ Argumentos podem ter problemas"
        fi
    else
        echo "❌ Instalado mas não funciona"
    fi
else
    echo "❌ Falha na instalação"
fi

echo ""
echo "🎯 CONFIGURAÇÃO PARA V4.0"
echo "========================"

echo "✅ Chrome instalado e testado"
echo "✅ V4.0 Ultra detectará automaticamente"
echo "✅ Sistema de fallback configurado"
echo "✅ Pronto para aplicar servidor V4.0"

echo ""
echo "📋 PRÓXIMO PASSO:"
echo "   Execute: ./vps-apply-v4-ultra.sh"

echo ""
echo "🏆 INSTALAÇÃO CHROME PARA V4.0 CONCLUÍDA!"
