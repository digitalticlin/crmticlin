
#!/bin/bash
# Script rápido para instalação do VPS API Server
# Versão simplificada para execução rápida

echo "🚀 Instalação Rápida do VPS API Server"

# Atualizar e instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Criar projeto
mkdir -p /root/vps-api-server && cd /root/vps-api-server

# Package.json mínimo
echo '{
  "name": "vps-api-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}' > package.json

npm install

# Servidor básico
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 3002;
const TOKEN = 'vps-api-token-2024';

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.post('/execute', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }

  const { command, description } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, error: 'Comando obrigatório' });
  }

  console.log(`Executando: ${description || command}`);
  
  exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        output: stderr || stdout
      });
    }
    
    res.json({
      success: true,
      output: stdout.trim() || 'Sucesso',
      timestamp: new Date().toISOString()
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VPS API Server rodando na porta ${PORT}`);
});
EOF

# Iniciar com PM2
pm2 start server.js --name vps-api-server
pm2 save
pm2 startup

# Testar
sleep 3
curl -s http://localhost:3002/status && echo "✅ Instalação concluída!" || echo "❌ Erro na instalação"

echo "🎉 API Server instalado! Use o painel web para aplicar correções."
EOF
