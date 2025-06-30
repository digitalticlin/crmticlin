#!/bin/bash

echo "🔍 Diagnosticando CORS na VPS Puppeteer..."

# Encontrar diretório do servidor
SERVER_DIR=""
for dir in "/opt/whatsapp-puppeteer" "/root/puppeteer-import-server" "/opt/puppeteer-import-server" "/home/puppeteer-import-server"; do
    if [ -d "$dir" ]; then
        SERVER_DIR="$dir"
        echo "📁 Servidor encontrado em: $SERVER_DIR"
        break
    fi
done

if [ -z "$SERVER_DIR" ]; then
    echo "❌ Diretório do servidor não encontrado!"
    exit 1
fi

cd "$SERVER_DIR"

echo "🔍 Verificando arquivos do servidor..."
ls -la

# Verificar se CORS está realmente aplicado
echo "🔍 Verificando CORS no server.js..."
if grep -q "cors" server.js; then
    echo "✅ CORS encontrado no server.js"
else
    echo "❌ CORS NÃO encontrado no server.js"
fi

# Mostrar conteúdo relevante do server.js
echo "📋 Primeiras 30 linhas do server.js:"
head -30 server.js

echo ""
echo "📋 Procurando por rotas create-instance:"
grep -n "create-instance\|/create" server.js || echo "❌ Rota create-instance não encontrada"

echo ""
echo "🔍 Verificando processos Node.js rodando:"
ps aux | grep node

echo ""
echo "🌐 Testando endpoint diretamente da VPS:"
curl -v -X OPTIONS http://localhost:3001/create-instance 2>&1 | head -20

echo ""
echo "🌐 Testando endpoint GET health:"
curl -v http://localhost:3001/health 2>&1 | head -10

echo ""
echo "🔧 Aplicando CORS FORÇA TOTAL em todas as rotas..."

# Backup do arquivo atual
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)

# Script para aplicar CORS completo
cat > /tmp/fix-cors-complete.js << 'EOF'
const fs = require('fs');

const serverFile = 'server.js';
let content = fs.readFileSync(serverFile, 'utf8');

// Remover CORS antigo se existir
content = content.replace(/\/\/ CORS Configuration[\s\S]*?app\.use\(cors\(corsOptions\)\);/g, '');
content = content.replace(/const cors = require\('cors'\);?\n?/g, '');

// Adicionar import do cors no topo
if (!content.includes("const cors = require('cors')")) {
    content = content.replace(
        "const express = require('express');",
        "const express = require('express');\nconst cors = require('cors');"
    );
}

// Configuração CORS completa
const corsSetup = `
// CORS Configuration - FORÇA TOTAL
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'https://rhjgagzstjzynvrakdyj.supabase.co'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origin:', origin);
      callback(null, true); // Permitir mesmo assim para debug
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Aplicar CORS globalmente
app.use(cors(corsOptions));

// Middleware adicional para garantir headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
`;

// Inserir após criação do app
const appRegex = /const app = express\(\);/;
if (appRegex.test(content)) {
    content = content.replace(appRegex, 'const app = express();' + corsSetup);
} else {
    // Se não encontrar padrão, inserir após as importações
    const lines = content.split('\n');
    const insertIndex = lines.findIndex(line => line.includes('express()')) + 1;
    if (insertIndex > 0) {
        lines.splice(insertIndex, 0, corsSetup);
        content = lines.join('\n');
    }
}

fs.writeFileSync(serverFile, content);
console.log('✅ CORS FORÇA TOTAL aplicado!');
EOF

node /tmp/fix-cors-complete.js

echo ""
echo "🔄 Parando todos os processos Node.js..."
pkill -f "node.*server" || true
sleep 2

echo "🚀 Reiniciando servidor..."
nohup node server.js > server.log 2>&1 &
sleep 3

echo ""
echo "🔍 Verificando se servidor está rodando..."
if pgrep -f "node.*server" > /dev/null; then
    echo "✅ Servidor rodando!"
    
    echo "🌐 Testando CORS com OPTIONS:"
    curl -X OPTIONS \
         -H "Origin: http://localhost:8081" \
         -H "Access-Control-Request-Method: POST" \
         -H "Access-Control-Request-Headers: Content-Type, Authorization" \
         -v http://localhost:3001/create-instance 2>&1 | grep -E "(Access-Control|HTTP/)"
    
    echo ""
    echo "🌐 Testando endpoint health com CORS:"
    curl -H "Origin: http://localhost:8081" -v http://localhost:3001/health 2>&1 | grep -E "(Access-Control|HTTP/)"
    
else
    echo "❌ Servidor não está rodando!"
    echo "📋 Últimas linhas do log:"
    tail -10 server.log
fi

echo ""
echo "🎯 Diagnóstico CORS completo!" 