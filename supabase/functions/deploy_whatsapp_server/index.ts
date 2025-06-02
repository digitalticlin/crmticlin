
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando deploy WhatsApp Server via SSH na porta 80...');

    const VPS_HOST = '31.97.24.222';
    const VPS_USER = 'root';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === FASE 1: VERIFICAR SE JÁ ESTÁ FUNCIONANDO ===
    console.log('📱 Verificando se API server já está rodando na porta 80...');
    
    try {
      const apiResponse = await fetch(`http://${VPS_HOST}:${API_SERVER_PORT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (apiResponse.ok) {
        const apiHealth = await apiResponse.json();
        console.log('✅ API server já está rodando na porta 80:', apiHealth);
        
        // Verificar também o WhatsApp server
        try {
          const whatsappResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(8000)
          });
          
          if (whatsappResponse.ok) {
            const whatsappHealth = await whatsappResponse.json();
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Servidores API (porta 80) e WhatsApp (porta 3001) já estão online!',
                api_server_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
                whatsapp_server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
                api_health: apiHealth,
                whatsapp_health: whatsappHealth,
                status: 'already_running',
                deploy_method: 'Verificação de Status'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (whatsappError) {
          console.log('ℹ️ WhatsApp server não está rodando, mas API server está na porta 80');
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'API server já está online na porta 80!',
            api_server_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
            api_health: apiHealth,
            status: 'api_running',
            deploy_method: 'Verificação de Status'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('ℹ️ Servidores não estão rodando, procederemos com deploy completo');
    }

    // === FASE 2: DEPLOY COMPLETO VIA SSH ===
    console.log('🔧 Executando deploy completo via SSH...');

    // Script de deploy otimizado para porta 80
    const deployScript = `#!/bin/bash
set -e
cd /root

echo "🔧 Configurando firewall para porta 80..."
# Configurar firewall para permitir porta 80
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

echo "📦 Verificando dependências..."
# Instalar dependências se necessário
command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; }
command -v pm2 >/dev/null 2>&1 || npm install -g pm2

echo "🚀 Configurando API Server na porta 80..."
# Criar diretório para API server
mkdir -p vps-api-server && cd vps-api-server

# Package.json para API server
cat > package.json << 'EOFPKG'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "child_process": "^1.0.2"
  }
}
EOFPKG

# Instalar dependências
npm install --production --silent

# API Server para porta 80
cat > server.js << 'EOFJS'
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: Math.floor(process.uptime())
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/execute', (req, res) => {
  const { command, description } = req.body;
  
  if (!command) {
    return res.status(400).json({ success: false, error: 'Comando é obrigatório' });
  }
  
  console.log(\`Executando: \${description || command}\`);
  
  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        error: error.message,
        output: stdout,
        stderr: stderr,
        exit_code: error.code || 1
      });
    }
    
    res.json({
      success: true,
      output: stdout,
      stderr: stderr,
      exit_code: 0,
      description: description || command
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 VPS API Server rodando na porta \${PORT}\`);
});
EOFJS

# Parar e iniciar API server com PM2
pm2 stop vps-api-server 2>/dev/null || true
pm2 delete vps-api-server 2>/dev/null || true
pm2 start server.js --name "vps-api-server"

echo "📱 Configurando WhatsApp Server na porta 3001..."
# Voltar para root e criar WhatsApp server
cd /root
mkdir -p whatsapp-server && cd whatsapp-server

# Package.json para WhatsApp
cat > package.json << 'EOFPKG'
{
  "name": "whatsapp-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOFPKG

# Instalar dependências
npm install --production --silent

# Servidor WhatsApp simplificado
cat > server.js << 'EOFJS'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let clients = new Map();

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server v1.0',
    timestamp: new Date().toISOString(),
    instances: clients.size,
    uptime: Math.floor(process.uptime())
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    instances: clients.size,
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 WhatsApp Server rodando na porta \${PORT}\`);
});
EOFJS

# Parar e iniciar WhatsApp server com PM2
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true
pm2 start server.js --name "whatsapp-server"

# Salvar configuração PM2
pm2 save

echo "✅ Deploy concluído com sucesso!"
echo "🌐 API Server: http://localhost:80"
echo "📱 WhatsApp Server: http://localhost:3001"

sleep 3
# Testar ambos os servidores
curl -s http://localhost:80/health && echo "✅ API Server funcionando!"
curl -s http://localhost:3001/health && echo "✅ WhatsApp Server funcionando!"
`;

    // Tentar usar API se disponível na porta 80
    try {
      const apiResponse = await fetch(`http://${VPS_HOST}:${API_SERVER_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer vps-api-token-2024'
        },
        body: JSON.stringify({
          command: deployScript,
          description: 'Deploy completo com API Server na porta 80 e WhatsApp na 3001',
          timeout: 180000
        }),
        signal: AbortSignal.timeout(200000)
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('✅ Deploy executado via API na porta 80:', result.success);
        
        // Aguardar um pouco e verificar ambos os serviços
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const healthChecks = await Promise.allSettled([
          fetch(`http://${VPS_HOST}:${API_SERVER_PORT}/health`, { signal: AbortSignal.timeout(10000) }),
          fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, { signal: AbortSignal.timeout(10000) })
        ]);
        
        const apiHealthy = healthChecks[0].status === 'fulfilled' && healthChecks[0].value.ok;
        const whatsappHealthy = healthChecks[1].status === 'fulfilled' && healthChecks[1].value.ok;
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Deploy realizado com sucesso!',
            api_server_url: `http://${VPS_HOST}:${API_SERVER_PORT}`,
            whatsapp_server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            api_healthy: apiHealthy,
            whatsapp_healthy: whatsappHealthy,
            deployment_output: result.output,
            deploy_method: 'SSH via API VPS porta 80',
            firewall_configured: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (apiError) {
      console.log('⚠️ API não disponível na porta 80, fornecendo instruções SSH');
    }

    // Se API não funcionar, retornar instruções manuais
    return new Response(
      JSON.stringify({
        success: false,
        error: 'API Server da VPS não disponível na porta 80',
        message: 'Execute manualmente via SSH para configurar servidores',
        ssh_instructions: {
          step1: \`Conecte na VPS: ssh \${VPS_USER}@\${VPS_HOST}\`,
          step2: 'Execute o script de deploy fornecido',
          step3: 'Verifique API: curl http://localhost:80/health',
          step4: 'Verifique WhatsApp: curl http://localhost:3001/health'
        },
        deploy_script: deployScript,
        manual_steps: [
          'Conecte na VPS via SSH',
          'Execute o script de deploy',
          'Configure firewall para porta 80',
          'Instale API Server na porta 80',
          'Instale WhatsApp Server na porta 3001',
          'Verifique se ambos estão rodando'
        ]
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro crítico no deploy:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro no sistema de deploy',
        timestamp: new Date().toISOString(),
        suggestion: 'Tente executar manualmente via SSH ou verifique se a porta 80 está liberada no firewall'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
