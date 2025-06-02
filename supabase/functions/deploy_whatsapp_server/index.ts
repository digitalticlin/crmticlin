
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando deploy WhatsApp Server via SSH...');

    const VPS_HOST = '31.97.24.222';
    const VPS_USER = 'root';
    const VPS_API_PORT = '3002';
    const WHATSAPP_PORT = '3001';

    // === FASE 1: VERIFICAR SE JÁ ESTÁ FUNCIONANDO ===
    console.log('📱 Verificando se WhatsApp server já está rodando...');
    
    try {
      const whatsappResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (whatsappResponse.ok) {
        const whatsappHealth = await whatsappResponse.json();
        console.log('✅ WhatsApp server já está rodando:', whatsappHealth);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp server já está online e funcionando!',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            health: whatsappHealth,
            status: 'already_running',
            deploy_method: 'Verificação de Status'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('ℹ️ WhatsApp server não está rodando, procederemos com deploy');
    }

    // === FASE 2: DEPLOY VIA SSH DIRETO ===
    console.log('🔧 Executando deploy via SSH direto...');

    // Script de deploy otimizado e compacto
    const deployScript = `#!/bin/bash
set -e
cd /root

# Verificar se já existe instância rodando
if pm2 list | grep -q "whatsapp-server.*online"; then
    echo "✅ Reiniciando servidor existente..."
    pm2 restart whatsapp-server
    sleep 3
    curl -s http://localhost:3001/health && echo "Deploy concluído!" && exit 0
fi

# Instalar dependências se necessário
command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; }
command -v pm2 >/dev/null 2>&1 || npm install -g pm2

# Criar diretório e arquivos
mkdir -p whatsapp-server && cd whatsapp-server

# Package.json mínimo
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

# Servidor simplificado
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

# Parar e iniciar com PM2
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true
pm2 start server.js --name "whatsapp-server"
pm2 save

echo "✅ Deploy concluído com sucesso!"
sleep 2
curl -s http://localhost:3001/health || echo "⚠️ Aguarde alguns segundos para o servidor inicializar"
`;

    // Executar via comando SSH direto
    console.log('📤 Executando script via SSH...');
    
    // Como não temos acesso direto ao SSH no edge function,
    // vamos tentar usar a API alternativa ou retornar instruções
    const sshCommand = `ssh ${VPS_USER}@${VPS_HOST} "${deployScript.replace(/"/g, '\\"')}"`;
    
    // Tentar usar API se disponível
    try {
      const apiResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer vps-api-token-2024'
        },
        body: JSON.stringify({
          command: deployScript,
          description: 'Deploy WhatsApp Server SSH Direto',
          timeout: 90000
        }),
        signal: AbortSignal.timeout(120000)
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('✅ Deploy executado via API:', result.success);
        
        // Aguardar um pouco e verificar
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const healthCheck = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
            signal: AbortSignal.timeout(10000)
          });
          
          if (healthCheck.ok) {
            const health = await healthCheck.json();
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Deploy realizado com sucesso via API!',
                server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
                health: health,
                deployment_output: result.output,
                deploy_method: 'SSH via API VPS'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (healthError) {
          console.log('⚠️ Health check falhou após deploy via API');
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Deploy executado via API, aguarde alguns segundos',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            deployment_output: result.output,
            deploy_method: 'SSH via API VPS',
            note: 'Aguarde alguns segundos e teste o servidor'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (apiError) {
      console.log('⚠️ API não disponível, fornecendo instruções SSH');
    }

    // Se API não funcionar, retornar instruções manuais
    return new Response(
      JSON.stringify({
        success: false,
        error: 'API Server da VPS não disponível',
        message: 'Execute manualmente via SSH',
        ssh_instructions: {
          step1: `Conecte na VPS: ssh ${VPS_USER}@${VPS_HOST}`,
          step2: 'Execute o script de deploy fornecido',
          step3: 'Verifique se funcionou: curl http://localhost:3001/health'
        },
        deploy_script: deployScript,
        ssh_command: sshCommand,
        manual_steps: [
          'Conecte na VPS via SSH',
          'Execute o script de deploy',
          'Verifique se o servidor está rodando',
          'Instale a API Server para deploy automático futuro'
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
        suggestion: 'Tente executar manualmente via SSH ou instale a API Server na VPS'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
