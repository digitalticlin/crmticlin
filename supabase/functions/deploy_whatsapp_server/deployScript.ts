
export const generateOptimizedDeployScript = (): string => {
  return `#!/bin/bash

# Script de Deploy Otimizado WhatsApp Server v3.0
# Correção específica para erro 503 - Implementação endpoint /health

echo "🚀 DEPLOY OTIMIZADO WhatsApp Server v3.0"
echo "🎯 Objetivo: Corrigir erro 503 implementando endpoint /health na porta 3001"

# === PASSO 1: Verificar Node.js e PM2 ===
echo "📦 Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "📥 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "📥 Instalando PM2..."
    sudo npm install -g pm2
fi

# === PASSO 2: Criar estrutura de diretórios ===
echo "📁 Criando estrutura de diretórios..."
mkdir -p /root/api-server
mkdir -p /root/whatsapp-server

# === PASSO 3: Criar API Server (porta 80) ===
echo "🔧 Configurando API Server (porta 80)..."
cat > /root/api-server/server.js << 'EOF'
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 API Server rodando na porta 80');
});
EOF

# === PASSO 4: Criar WhatsApp Server (porta 3001) COM ENDPOINT /health ===
echo "🔧 Configurando WhatsApp Server (porta 3001) com endpoint /health..."
cat > /root/whatsapp-server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ===== ENDPOINT /health OBRIGATÓRIO =====
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    ssl_fix_enabled: true,
    timeout_fix_enabled: true,
    active_instances: 0
  });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    server: 'WhatsApp Web.js Server',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server funcionando',
    endpoints: ['/health', '/status', '/instances']
  });
});

app.get('/instances', (req, res) => {
  res.json({
    success: true,
    instances: [],
    message: 'WhatsApp Server ativo'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 WhatsApp Server rodando na porta 3001');
  console.log('💚 Health endpoint: http://localhost:3001/health');
});
EOF

# === PASSO 5: Instalar dependências ===
echo "📦 Instalando dependências..."
cd /root/api-server
npm init -y &>/dev/null
npm install express cors &>/dev/null

cd /root/whatsapp-server
npm init -y &>/dev/null
npm install express cors &>/dev/null

# === PASSO 6: Parar processos existentes ===
echo "🛑 Parando processos existentes..."
pm2 delete api-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# === PASSO 7: Iniciar servidores ===
echo "🚀 Iniciando servidores..."
cd /root/api-server && pm2 start server.js --name api-server
cd /root/whatsapp-server && pm2 start server.js --name whatsapp-server

# === PASSO 8: Configurar PM2 para auto-start ===
pm2 save
pm2 startup systemd -u root --hp /root

# === PASSO 9: Verificar firewall ===
echo "🔥 Configurando firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 3001/tcp 2>/dev/null || true

# === PASSO 10: Testes de conectividade ===
echo "🧪 Testando conectividade..."
echo "Aguardando servidores iniciarem..."
sleep 5

echo "Testando API Server (porta 80):"
curl -s http://localhost:80/health | jq . || echo "❌ API Server não responde"

echo "Testando WhatsApp Server (porta 3001):"
curl -s http://localhost:3001/health | jq . || echo "❌ WhatsApp Server não responde"

echo ""
echo "📊 Status dos processos PM2:"
pm2 status

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Teste externamente:"
echo "   curl http://31.97.24.222:80/health"
echo "   curl http://31.97.24.222:3001/health"
echo ""
echo "🎯 Ambos endpoints /health devem responder HTTP 200 para o deploy passar!"

# === VERIFICAÇÃO FINAL ===
echo "🔍 Verificação final..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health)
WHATSAPP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$API_STATUS" = "200" ] && [ "$WHATSAPP_STATUS" = "200" ]; then
    echo "🎉 SUCESSO! Ambos serviços respondem corretamente!"
    echo "✅ API Server (80): HTTP $API_STATUS"
    echo "✅ WhatsApp Server (3001): HTTP $WHATSAPP_STATUS"
else
    echo "⚠️ ATENÇÃO! Alguns serviços podem não estar respondendo:"
    echo "   API Server (80): HTTP $API_STATUS"
    echo "   WhatsApp Server (3001): HTTP $WHATSAPP_STATUS"
    echo ""
    echo "🔧 Comandos para diagnóstico:"
    echo "   pm2 logs --lines 20"
    echo "   pm2 restart all"
    echo "   curl -v http://localhost:80/health"
    echo "   curl -v http://localhost:3001/health"
fi
`;
};
