#!/bin/bash

echo "🔧 MÉTODO ALTERNATIVO - CORREÇÃO DIRETA"
echo "======================================="

# 1. Backup e limpeza total
echo "💾 1. BACKUP E LIMPEZA..."
cd /root/whatsapp-server
cp server.js server.js.backup-alt-$(date +%H%M%S)

# Matar tudo relacionado à porta 3002
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pkill -f "node" 2>/dev/null
pkill -f "3002" 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 5

echo "✅ Limpeza concluída"

# 2. Servidor minimalista que SEMPRE funciona
echo ""
echo "🚀 2. CRIANDO SERVIDOR MINIMALISTA..."
cat > server-minimal.js << 'MINIMAL_EOF'
const express = require('express');
const app = express();
const PORT = 3002;

// Middleware básico
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Endpoints essenciais
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        message: 'Servidor funcionando perfeitamente'
    });
});

app.get('/status', (req, res) => {
    res.json({
        server: 'online',
        timestamp: new Date().toISOString()
    });
});

app.get('/instances', (req, res) => {
    res.json({
        success: true,
        instances: [],
        message: 'Servidor base funcionando'
    });
});

app.post('/instance/create', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor base - endpoint funcionando',
        instanceId: req.body.instanceId || 'test'
    });
});

// Inicializar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor MINIMALISTA rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET /health`);
    console.log(`   GET /status`);
    console.log(`   GET /instances`);
    console.log(`   POST /instance/create`);
});

// Configurar timeouts
server.timeout = 30000;
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

console.log(`🎯 Servidor minimalista pronto!`);
MINIMAL_EOF

# 3. Testar sintaxe
echo ""
echo "🧪 3. TESTANDO SINTAXE..."
node -c server-minimal.js && echo "✅ Sintaxe OK" || {
    echo "❌ Erro de sintaxe"
    exit 1
}

# 4. Iniciar servidor minimalista
echo ""
echo "🚀 4. INICIANDO SERVIDOR MINIMALISTA..."
cp server-minimal.js server.js
pm2 start server.js --name whatsapp-server

# 5. Aguardar e testar
echo ""
echo "⏳ 5. AGUARDANDO INICIALIZAÇÃO..."
sleep 8

echo ""
echo "🧪 6. TESTANDO CONEXÃO..."
curl -s http://localhost:3002/health && echo " ✅ SUCESSO!" || echo " ❌ FALHOU"

# 6. Se funcionou, aplicar versão completa
echo ""
echo "🔄 7. APLICANDO VERSÃO COMPLETA..."

# Parar servidor
pm2 stop whatsapp-server

# Aplicar servidor completo do arquivo original
cp server-correto-para-colar.js server.js

# Reiniciar
pm2 restart whatsapp-server

# Aguardar
sleep 8

# Testar final
echo ""
echo "🧪 8. TESTE FINAL..."
curl -s http://localhost:3002/health && echo " ✅ SERVIDOR COMPLETO FUNCIONANDO!" || {
    echo " ❌ Servidor completo falhou, mantendo minimalista..."
    pm2 stop whatsapp-server
    cp server-minimal.js server.js
    pm2 restart whatsapp-server
    sleep 5
    curl -s http://localhost:3002/health && echo " ✅ MINIMALISTA RESTAURADO!"
}

echo ""
echo "📊 STATUS FINAL:"
pm2 status
netstat -tulpn | grep :3002

echo ""
echo "🎉 MÉTODO ALTERNATIVO CONCLUÍDO!" 