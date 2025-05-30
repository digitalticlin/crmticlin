
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando teste de conectividade VPS Ubuntu 4GB...');
    
    const vpsConfig = {
      host: '31.97.24.222',
      port: 3001,
      sshPort: 22,
      type: 'Ubuntu 4GB VPS'
    };

    // Teste 1: Verificar se a porta 3001 está acessível
    console.log(`Testando conectividade HTTP na porta ${vpsConfig.port}...`);
    
    let httpTest = false;
    try {
      const response = await fetch(`http://${vpsConfig.host}:${vpsConfig.port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      httpTest = response.ok;
      console.log(`Teste HTTP: ${httpTest ? 'SUCESSO' : 'FALHOU'} - Status: ${response.status}`);
    } catch (error) {
      console.log(`Teste HTTP: FALHOU - ${error.message}`);
    }

    // Teste 2: Ping básico (simulado via HTTP)
    console.log(`Testando ping básico para ${vpsConfig.host}...`);
    
    let pingTest = false;
    try {
      const response = await fetch(`http://${vpsConfig.host}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      pingTest = true;
      console.log('Ping: SUCESSO - Host é acessível');
    } catch (error) {
      console.log(`Ping: FALHOU - ${error.message}`);
    }

    // Script do servidor Node.js atualizado
    const serverScript = `#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenar instâncias ativas
const instances = new Map();

// Verificação de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    instances: instances.size,
    server: 'WhatsApp Web.js Server',
    version: '1.0.0'
  });
});

// Informações do servidor
app.get('/info', (req, res) => {
  res.json({
    server: 'WhatsApp Web.js Server',
    version: '1.0.0',
    host: '${vpsConfig.host}',
    port: PORT,
    activeInstances: instances.size,
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Listar instâncias
app.get('/instances', (req, res) => {
  const instanceList = Array.from(instances.keys()).map(id => ({
    instanceId: id,
    status: instances.get(id).client.info ? 'ready' : 'connecting',
    createdAt: instances.get(id).createdAt,
    lastActivity: instances.get(id).lastActivity
  }));

  res.json({ 
    success: true, 
    instances: instanceList,
    total: instanceList.length
  });
});

// Criar nova instância WhatsApp
app.post('/create', async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl } = req.body;
    
    console.log(\`Criando instância: \${instanceId}\`);
    
    if (instances.has(instanceId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instância já existe' 
      });
    }

    // Criar cliente WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instanceId,
        dataPath: \`./sessions/\${instanceId}\`
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    let qrCode = null;

    // Event listeners
    client.on('qr', async (qr) => {
      console.log(\`QR Code gerado para \${instanceId}\`);
      try {
        qrCode = await QRCode.toDataURL(qr);
        
        // Atualizar QR na instância
        if (instances.has(instanceId)) {
          instances.get(instanceId).qrCode = qrCode;
          instances.get(instanceId).lastActivity = new Date();
        }
        
        // Enviar QR para webhook
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'qr',
              instanceId,
              data: { qr: qrCode },
              timestamp: new Date().toISOString()
            })
          });
        }
      } catch (error) {
        console.error('Erro ao gerar QR:', error);
      }
    });

    client.on('ready', async () => {
      console.log(\`Cliente \${instanceId} conectado!\`);
      
      const info = client.info;
      
      // Atualizar status da instância
      if (instances.has(instanceId)) {
        instances.get(instanceId).status = 'ready';
        instances.get(instanceId).lastActivity = new Date();
        instances.get(instanceId).phone = info.wid.user;
        instances.get(instanceId).name = info.pushname;
      }
      
      // Enviar evento de ready para webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ready',
            instanceId,
            data: {
              phone: info.wid.user,
              name: info.pushname,
              profilePic: await client.getProfilePicUrl(info.wid._serialized).catch(() => null)
            },
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    client.on('message', async (message) => {
      console.log(\`Nova mensagem para \${instanceId}:\`, message.body);
      
      // Atualizar atividade da instância
      if (instances.has(instanceId)) {
        instances.get(instanceId).lastActivity = new Date();
      }
      
      // Enviar mensagem para webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'message',
            instanceId,
            data: {
              id: message.id.id,
              from: message.from,
              body: message.body,
              type: message.type,
              timestamp: message.timestamp,
              notifyName: message.notifyName
            }
          })
        });
      }
    });

    client.on('disconnected', async (reason) => {
      console.log(\`Cliente \${instanceId} desconectado:\`, reason);
      
      // Remover instância
      instances.delete(instanceId);
      
      // Enviar evento de disconnected para webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'disconnected',
            instanceId,
            data: { reason },
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    // Armazenar instância
    instances.set(instanceId, { 
      client, 
      webhookUrl, 
      qrCode,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // Inicializar cliente
    await client.initialize();

    res.json({ 
      success: true, 
      instanceId,
      qrCode,
      status: 'connecting'
    });

  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Deletar instância
app.post('/delete', async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instances.has(instanceId)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Instância não encontrada' 
      });
    }

    const instance = instances.get(instanceId);
    await instance.client.destroy();
    instances.delete(instanceId);

    // Limpar sessão
    const sessionPath = \`./sessions/\${instanceId}\`;
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obter QR Code
app.get('/qr/:instanceId', (req, res) => {
  const { instanceId } = req.params;
  
  const instance = instances.get(instanceId);
  if (!instance) {
    return res.status(404).json({ 
      success: false, 
      error: 'Instância não encontrada' 
    });
  }

  res.json({ 
    success: true, 
    qrCode: instance.qrCode,
    status: instance.status
  });
});

// Status da instância
app.get('/status/:instanceId', async (req, res) => {
  const { instanceId } = req.params;
  
  const instance = instances.get(instanceId);
  if (!instance) {
    return res.status(404).json({ 
      success: false, 
      error: 'Instância não encontrada' 
    });
  }

  try {
    const state = await instance.client.getState();
    
    res.json({ 
      success: true, 
      status: {
        state,
        isReady: instance.client.info !== null,
        createdAt: instance.createdAt,
        lastActivity: instance.lastActivity,
        phone: instance.phone || null,
        name: instance.name || null
      }
    });
  } catch (error) {
    res.json({
      success: true,
      status: {
        state: 'disconnected',
        isReady: false,
        createdAt: instance.createdAt,
        lastActivity: instance.lastActivity,
        error: error.message
      }
    });
  }
});

// Enviar mensagem
app.post('/send', async (req, res) => {
  try {
    const { instanceId, phone, message } = req.body;
    
    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({ 
        success: false, 
        error: 'Instância não encontrada' 
      });
    }

    if (!instance.client.info) {
      return res.status(400).json({
        success: false,
        error: 'Instância não está conectada'
      });
    }

    const chatId = phone.includes('@') ? phone : \`\${phone}@c.us\`;
    await instance.client.sendMessage(chatId, message);

    // Atualizar atividade
    instance.lastActivity = new Date();

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro no servidor:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Erro interno do servidor' 
  });
});

// Criar diretório de sessões se não existir
if (!fs.existsSync('./sessions')) {
  fs.mkdirSync('./sessions', { recursive: true });
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`=== WhatsApp Web.js Server ===\`);
  console.log(\`Servidor rodando na porta \${PORT}\`);
  console.log(\`Host: ${vpsConfig.host}\`);
  console.log(\`Health: http://${vpsConfig.host}:\${PORT}/health\`);
  console.log(\`Info: http://${vpsConfig.host}:\${PORT}/info\`);
  console.log(\`Instâncias: http://${vpsConfig.host}:\${PORT}/instances\`);
  console.log(\`===============================\`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Finalizando servidor...');
  
  // Fechar todas as instâncias
  for (const [instanceId, instance] of instances) {
    try {
      await instance.client.destroy();
      console.log(\`Instância \${instanceId} finalizada\`);
    } catch (error) {
      console.error(\`Erro ao finalizar \${instanceId}:\`, error);
    }
  }
  
  process.exit(0);
});
`;

    const packageJson = `{
  "name": "whatsapp-web-server",
  "version": "1.0.0",
  "description": "Servidor WhatsApp Web.js para Ticlin - VPS Ubuntu 4GB",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "install-deps": "npm install express cors whatsapp-web.js qrcode",
    "setup": "mkdir -p sessions && npm run install-deps"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5", 
    "whatsapp-web.js": "^1.23.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "keywords": ["whatsapp", "web", "api", "ticlin", "ubuntu"],
  "author": "Ticlin",
  "license": "MIT"
}`;

    const installScript = `#!/bin/bash

echo "=== Instalação do Servidor WhatsApp Web.js - Ubuntu 4GB VPS ==="
echo "Host: ${vpsConfig.host}"
echo "Porta: ${vpsConfig.port}"
echo ""

# Verificar se estamos executando como root
if [[ $EUID -ne 0 ]]; then
   echo "Este script deve ser executado como root (use sudo)" 
   exit 1
fi

# Verificar conectividade
echo "Verificando conectividade..."
if ! ping -c 1 google.com &> /dev/null; then
    echo "Aviso: Sem conectividade com a internet"
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Instalando Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js já instalado: $(node --version)"
fi

# Verificar se NPM está funcionando
if ! command -v npm &> /dev/null; then
    echo "NPM não encontrado. Reinstalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "Versão do Node.js: $(node --version)"
echo "Versão do NPM: $(npm --version)"

# Instalar dependências do sistema
echo "Instalando dependências do sistema..."
apt-get update
apt-get install -y curl wget gnupg2 software-properties-common

# Instalar Google Chrome (necessário para whatsapp-web.js)
if ! command -v google-chrome &> /dev/null; then
    echo "Instalando Google Chrome..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update
    apt-get install -y google-chrome-stable
fi

# Criar diretório do projeto
echo "Criando diretório do projeto..."
mkdir -p /root/whatsapp-server
cd /root/whatsapp-server

# Criar arquivos
echo "Criando package.json..."
cat > package.json << 'EOF'
${packageJson}
EOF

echo "Criando server.js..."
cat > server.js << 'EOF'
${serverScript}
EOF

# Instalar dependências
echo "Instalando dependências do projeto..."
npm install

# Instalar PM2 para gerenciar o processo
echo "Instalando PM2..."
npm install -g pm2

# Criar arquivo de configuração do PM2
echo "Criando configuração do PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: ${vpsConfig.port}
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

# Criar script de inicialização
echo "Criando script de inicialização..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "Iniciando WhatsApp Web.js Server..."
cd /root/whatsapp-server

# Parar instância anterior se existir
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Iniciar nova instância
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "Servidor iniciado!"
echo "Status: pm2 status"
echo "Logs: pm2 logs whatsapp-server"
echo "Health check: curl http://localhost:${vpsConfig.port}/health"
EOF

chmod +x start.sh

# Criar script de parada
cat > stop.sh << 'EOF'
#!/bin/bash
echo "Parando WhatsApp Web.js Server..."
pm2 stop whatsapp-server
pm2 delete whatsapp-server
echo "Servidor parado!"
EOF

chmod +x stop.sh

# Configurar firewall UFW
echo "Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow ${vpsConfig.port}
ufw --force enable

echo ""
echo "=== Instalação concluída com sucesso! ==="
echo ""
echo "Próximos passos:"
echo "1. Iniciar servidor: ./start.sh"
echo "2. Verificar status: pm2 status"
echo "3. Ver logs: pm2 logs whatsapp-server"
echo "4. Testar saúde: curl http://localhost:${vpsConfig.port}/health"
echo "5. Testar externamente: curl http://${vpsConfig.host}:${vpsConfig.port}/health"
echo ""
echo "Endpoints disponíveis:"
echo "- Health: http://${vpsConfig.host}:${vpsConfig.port}/health"
echo "- Info: http://${vpsConfig.host}:${vpsConfig.port}/info"  
echo "- Instâncias: http://${vpsConfig.host}:${vpsConfig.port}/instances"
echo ""
echo "Comandos úteis:"
echo "- pm2 status          # Ver status dos processos"
echo "- pm2 logs            # Ver logs em tempo real"
echo "- pm2 restart all     # Reiniciar todos os processos"
echo "- ./stop.sh           # Parar servidor"
echo "- ./start.sh          # Iniciar servidor"
echo ""
`;

    const results = {
      connectivity: {
        http_test: httpTest,
        ping_test: pingTest,
        host: vpsConfig.host,
        port: vpsConfig.port,
        type: vpsConfig.type
      },
      server_files: {
        server_script: "server.js criado com endpoints /health, /info, /instances",
        package_json: "package.json criado com dependências atualizadas", 
        install_script: "install.sh criado com instalação completa para Ubuntu",
        ecosystem_config: "PM2 ecosystem.config.js configurado",
        firewall_setup: "Configuração UFW incluída"
      },
      next_steps: [
        "1. Conectar na VPS: ssh root@" + vpsConfig.host,
        "2. Atualizar sistema: apt update && apt upgrade -y",
        "3. Executar script de instalação completo",
        "4. Configurar firewall UFW (incluído no script)",
        "5. Iniciar servidor WhatsApp com PM2",
        "6. Testar endpoints: /health, /info, /instances",
        "7. Executar novo teste de conectividade no painel"
      ]
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teste de conectividade realizado para VPS Ubuntu 4GB",
        results,
        scripts: {
          server: serverScript,
          package: packageJson,
          install: installScript
        },
        vps: vpsConfig
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro no teste de conectividade:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: "Falha no teste de conectividade com a VPS Ubuntu 4GB"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
