
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
    console.log('Iniciando teste de conectividade VPS...');
    
    const vpsConfig = {
      host: '92.112.178.252',
      port: 3001,
      sshPort: 22
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

    // Preparar script do servidor Node.js
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
    instances: instances.size 
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
        
        // Enviar QR para webhook
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'qr',
              instanceId,
              data: { qr: qrCode }
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
            }
          })
        });
      }
    });

    client.on('message', async (message) => {
      console.log(\`Nova mensagem para \${instanceId}:\`, message.body);
      
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
            data: { reason }
          })
        });
      }
    });

    // Armazenar instância
    instances.set(instanceId, { client, webhookUrl, qrCode });

    // Inicializar cliente
    await client.initialize();

    res.json({ 
      success: true, 
      instanceId,
      qrCode 
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
    qrCode: instance.qrCode 
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

  const state = await instance.client.getState();
  
  res.json({ 
    success: true, 
    status: {
      state,
      isReady: instance.client.info !== null
    }
  });
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

    const chatId = phone.includes('@') ? phone : \`\${phone}@c.us\`;
    await instance.client.sendMessage(chatId, message);

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Listar instâncias
app.get('/instances', (req, res) => {
  const instanceList = Array.from(instances.keys()).map(id => ({
    instanceId: id,
    status: instances.get(id).client.info ? 'ready' : 'connecting'
  }));

  res.json({ 
    success: true, 
    instances: instanceList 
  });
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
  console.log(\`Servidor WhatsApp Web.js rodando na porta \${PORT}\`);
  console.log(\`Acesse: http://localhost:\${PORT}/health\`);
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
  "description": "Servidor WhatsApp Web.js para Ticlin",
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
  "keywords": ["whatsapp", "web", "api", "ticlin"],
  "author": "Ticlin",
  "license": "MIT"
}`;

    const installScript = `#!/bin/bash

echo "=== Instalação do Servidor WhatsApp Web.js ==="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar versão do Node.js
echo "Versão do Node.js: $(node --version)"
echo "Versão do NPM: $(npm --version)"

# Criar diretório do projeto
mkdir -p /root/whatsapp-server
cd /root/whatsapp-server

# Criar arquivos
cat > package.json << 'EOF'
${packageJson}
EOF

cat > server.js << 'EOF'
${serverScript}
EOF

# Instalar dependências
echo "Instalando dependências..."
npm install

# Instalar PM2 para gerenciar o processo
npm install -g pm2

# Criar arquivo de configuração do PM2
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
      PORT: 3001
    }
  }]
};
EOF

# Criar script de inicialização
cat > start.sh << 'EOF'
#!/bin/bash
cd /root/whatsapp-server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF

chmod +x start.sh

echo "=== Instalação concluída! ==="
echo "Para iniciar o servidor:"
echo "cd /root/whatsapp-server && ./start.sh"
echo ""
echo "Para verificar status:"
echo "pm2 status"
echo ""
echo "Para ver logs:"
echo "pm2 logs whatsapp-server"
`;

    const results = {
      connectivity: {
        http_test: httpTest,
        ping_test: pingTest,
        host: vpsConfig.host,
        port: vpsConfig.port
      },
      server_files: {
        server_script: "server.js criado",
        package_json: "package.json criado", 
        install_script: "install.sh criado"
      },
      next_steps: [
        "Conectar na VPS via SSH",
        "Executar o script de instalação",
        "Iniciar o servidor WhatsApp",
        "Testar conectividade com Supabase"
      ]
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teste de conectividade realizado e scripts criados",
        results,
        scripts: {
          server: serverScript,
          package: packageJson,
          install: installScript
        }
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
        message: "Falha no teste de conectividade"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
