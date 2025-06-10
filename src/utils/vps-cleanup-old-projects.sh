
#!/bin/bash

# LIMPEZA SEGURA DE PROJETOS ANTIGOS NA VPS
echo "🧹 LIMPEZA SEGURA VPS - Projetos Antigos"
echo "========================================"

echo "⚠️ ATENÇÃO: Este script irá:"
echo "   - Identificar projetos/pastas antigas"
echo "   - Sugerir limpeza segura"
echo "   - NÃO deletar nada automaticamente"
echo ""

# 1. IDENTIFICAR PASTAS SUSPEITAS
echo "🔍 IDENTIFICANDO PASTAS DE PROJETOS:"
echo "==================================="

echo "📂 Pastas na raiz (/root):"
ls -la /root | grep -E "^d" | grep -v -E "(\.|\.\.|\.cache|\.npm|\.config)" | while read -r line; do
    folder=$(echo "$line" | awk '{print $9}')
    size=$(du -sh "/root/$folder" 2>/dev/null | awk '{print $1}')
    echo "   📁 $folder - Tamanho: $size"
done

echo ""
echo "📂 Processos Node.js ativos:"
ps aux | grep node | grep -v grep | while read -r line; do
    echo "   🔄 $line"
done

echo ""
echo "📂 Processos PM2 ativos:"
pm2 list 2>/dev/null | grep -E "online|stopped|errored" || echo "   ❌ PM2 não encontrado ou sem processos"

# 2. VERIFICAR DEPENDÊNCIAS DUPLICADAS
echo ""
echo "🔍 VERIFICANDO DEPENDÊNCIAS:"
echo "==========================="

echo "📦 Instalações Node.js:"
find /root -name "node_modules" -type d 2>/dev/null | while read -r dir; do
    size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
    echo "   📦 $dir - $size"
done

echo ""
echo "📦 Instalações Puppeteer:"
find /root -name "*puppeteer*" -type d 2>/dev/null | while read -r dir; do
    size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
    echo "   🤖 $dir - $size"
done

# 3. VERIFICAR CHROME/CHROMIUM DUPLICADOS
echo ""
echo "🔍 VERIFICANDO CHROME/CHROMIUM:"
echo "============================="

echo "🌐 Instalações Chrome encontradas:"
find /root -name "*chrome*" -type f 2>/dev/null | head -10 | while read -r file; do
    echo "   🌐 $file"
done

echo ""
echo "🔍 Caches Chrome/Chromium:"
find /root -path "*/.cache/google-chrome*" -o -path "*/.cache/chromium*" 2>/dev/null | while read -r cache; do
    size=$(du -sh "$cache" 2>/dev/null | awk '{print $1}')
    echo "   💾 $cache - $size"
done

# 4. GERAR COMANDOS DE LIMPEZA SEGUROS
echo ""
echo "💡 COMANDOS DE LIMPEZA SEGURA SUGERIDOS:"
echo "======================================="

echo "🧹 Para limpar caches (SEGURO):"
echo "   rm -rf /root/.cache/google-chrome/*"
echo "   rm -rf /root/.cache/chromium/*"
echo "   npm cache clean --force"

echo ""
echo "🧹 Para limpar node_modules antigos (REVISAR ANTES):"
find /root -name "node_modules" -type d 2>/dev/null | while read -r dir; do
    parent_dir=$(dirname "$dir")
    if [ "$parent_dir" != "/root" ]; then
        echo "   # Revisar: rm -rf '$dir'"
    fi
done

echo ""
echo "🧹 Para parar processos antigos (REVISAR ANTES):"
echo "   pm2 stop all"
echo "   pm2 delete all"
echo "   pm2 save"

echo ""
echo "✅ ANÁLISE CONCLUÍDA!"
echo "==================="
echo "📋 Execute os comandos sugeridos APENAS após revisar"
echo "⚠️ Sempre faça backup antes de deletar arquivos"
echo "🎯 Foque em manter apenas o projeto atual ativo"
