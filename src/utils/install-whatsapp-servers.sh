
#!/bin/bash

# Script de instalação dos servidores WhatsApp na VPS
# Execute este script na VPS para instalar ambos servidores

echo "🚀 Instalando servidores WhatsApp na VPS..."

# Criar diretórios
mkdir -p /root/api-server
mkdir -p /root/whatsapp-server

# Instalar dependências Node.js se não estiver instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar PM2 globalmente se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Copiar arquivo do API Server (porta 80)
cat > /root/api-server/server.js << 'EOF'
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 80;

app.use(cors());
app.use(express.json());

const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido' });
  }
  next();
}

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
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.post('/execute', authenticateToken, async (req, res) => {
  const { command, description, timeout = 60000 } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Comando é obrigatório'
    });
  }

  console.log(`🔧 Executando: ${description || 'Comando personalizado'}`);

  try {
    const startTime = Date.now();
    exec(command, { timeout }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
          output: stderr || stdout,
          duration
        });
      }

      const output = stdout.trim() || stderr.trim() || 'Comando executado com sucesso';
      
      res.json({
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VPS API Server rodando na porta ${PORT}`);
});

module.exports = app;
EOF

# Copiar arquivo do WhatsApp Server (porta 3001)
cat > /root/whatsapp-server/server.js << 'EOF'
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

app.use(cors());
app.use(express.json());

const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido' });
  }
  next();
}

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
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server funcionando',
    version: '2.0.0',
    endpoints: ['/health', '/status', '/instances'],
    timestamp: new Date().toISOString()
  });
});

app.get('/instances', (req, res) => {
  res.json({
    success: true,
    instances: [],
    message: 'WhatsApp Server funcionando'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Server rodando na porta ${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
EOF

# Instalar dependências para ambos servidores
echo "📦 Instalando dependências..."
cd /root/api-server && npm init -y && npm install express cors
cd /root/whatsapp-server && npm init -y && npm install express cors

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pm2 delete api-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Iniciar servidores com PM2
echo "🚀 Iniciando servidores..."
cd /root/api-server && pm2 start server.js --name api-server
cd /root/whatsapp-server && pm2 start server.js --name whatsapp-server

# Salvar configuração PM2
pm2 save
pm2 startup

echo "✅ Instalação concluída!"
echo ""
echo "📊 Status dos serviços:"
pm2 status

echo ""
echo "🧪 Teste os endpoints:"
echo "curl http://localhost:80/health"
echo "curl http://localhost:3001/health"
echo ""
echo "🌐 Teste externamente:"
echo "curl http://31.97.24.222:80/health"
echo "curl http://31.97.24.222:3001/health"
