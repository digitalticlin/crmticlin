#!/bin/bash

# Script para adicionar CORS na VPS Puppeteer
# Execute este comando na VPS: bash adicionar-cors-vps.sh

echo "🔧 Adicionando CORS na VPS Puppeteer..."

# Criar arquivo de configuração CORS
cat > /tmp/cors-config.js << 'EOF'
// Middleware CORS para Express
const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:8081', 'https://rhjgagzstjzynvrakdyj.supabase.co'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

module.exports = corsOptions;
EOF

# Verificar se o servidor Puppeteer está rodando
if pgrep -f "puppeteer.*server" > /dev/null; then
    echo "📱 Servidor Puppeteer encontrado, parando para aplicar CORS..."
    pkill -f "puppeteer.*server"
    sleep 2
fi

# Instalar cors se não estiver instalado
echo "📦 Instalando dependência CORS..."
cd /root/puppeteer-import-server 2>/dev/null || cd /opt/puppeteer-import-server 2>/dev/null || cd /home/puppeteer-import-server 2>/dev/null

if [ ! -d "node_modules" ]; then
    npm install
fi

npm install cors --save

# Adicionar CORS ao servidor principal
echo "🔧 Aplicando CORS no servidor..."

# Backup do arquivo original
cp server.js server.js.backup 2>/dev/null || echo "Arquivo server.js não encontrado"

# Aplicar CORS diretamente no código
cat > /tmp/apply-cors.js << 'EOF'
const fs = require('fs');

const serverFile = 'server.js';
if (!fs.existsSync(serverFile)) {
    console.log('❌ Arquivo server.js não encontrado');
    process.exit(1);
}

let content = fs.readFileSync(serverFile, 'utf8');

// Verificar se CORS já está aplicado
if (content.includes('cors')) {
    console.log('✅ CORS já está configurado');
    process.exit(0);
}

// Adicionar import do cors
if (!content.includes("const cors = require('cors')")) {
    content = content.replace(
        "const express = require('express');",
        "const express = require('express');\nconst cors = require('cors');"
    );
}

// Adicionar middleware CORS
const corsMiddleware = `
// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:8081', 'https://rhjgagzstjzynvrakdyj.supabase.co'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

app.use(cors(corsOptions));
`;

// Inserir CORS após criação do app
content = content.replace(
    'const app = express();',
    'const app = express();' + corsMiddleware
);

// Salvar arquivo modificado
fs.writeFileSync(serverFile, content);
console.log('✅ CORS aplicado com sucesso!');
EOF

node /tmp/apply-cors.js

# Reiniciar servidor
echo "🚀 Reiniciando servidor com CORS..."
nohup node server.js > puppeteer.log 2>&1 &

sleep 3

# Verificar se está rodando
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Servidor Puppeteer reiniciado com CORS!"
    echo "🌐 Testando endpoint..."
    
    # Testar endpoint health
    curl -I http://localhost:3001/health 2>/dev/null | head -1
    
    echo "🎯 CORS configurado com sucesso!"
    echo "📋 Origins permitidas:"
    echo "   - http://localhost:8080"
    echo "   - http://localhost:8081" 
    echo "   - https://rhjgagzstjzynvrakdyj.supabase.co"
else
    echo "❌ Erro ao reiniciar servidor"
    exit 1
fi

# Limpeza
rm -f /tmp/cors-config.js /tmp/apply-cors.js

echo "🎉 CORS aplicado com sucesso na VPS!" 