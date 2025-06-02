
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando diagnóstico profissional da VPS...');

    const VPS_HOST = '31.97.24.222';
    const VPS_API_PORT = '3002';
    const WHATSAPP_PORT = '3001';
    const API_TOKEN = 'vps-api-token-2024';

    // === FASE 1: DIAGNÓSTICO RÁPIDO ===
    console.log('📊 FASE 1: Diagnóstico de conectividade VPS');
    
    const diagnosticResults = {
      vps_ping: false,
      api_server_running: false,
      whatsapp_server_running: false,
      api_authentication: false,
      error_details: []
    };

    // 1.1 Verificar se WhatsApp server já está rodando (prioridade)
    try {
      console.log(`📱 Verificando WhatsApp server na porta ${WHATSAPP_PORT}...`);
      const whatsappResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (whatsappResponse.ok) {
        const whatsappHealth = await whatsappResponse.json();
        diagnosticResults.whatsapp_server_running = true;
        console.log('✅ WhatsApp server já está rodando:', whatsappHealth);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp server já está online e funcionando!',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            health: whatsappHealth,
            status: 'already_running',
            diagnostics: diagnosticResults
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('ℹ️ WhatsApp server não está rodando, procederemos com deploy');
    }

    // 1.2 Teste da API Server (porta 3002)
    try {
      console.log(`🔧 Testando API Server na porta ${VPS_API_PORT}...`);
      const apiStatusResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (apiStatusResponse.ok) {
        diagnosticResults.api_server_running = true;
        console.log('✅ API Server está online');
      } else {
        throw new Error(`API Server retornou status ${apiStatusResponse.status}`);
      }
    } catch (error) {
      console.log('❌ API Server não está rodando:', error.message);
      diagnosticResults.error_details.push(`API Server: ${error.message}`);
    }

    // 1.3 Teste de autenticação da API
    if (diagnosticResults.api_server_running) {
      try {
        console.log('🔐 Testando autenticação da API...');
        const authTestResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            command: 'echo "Test auth"',
            description: 'Teste de autenticação'
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (authTestResponse.ok) {
          diagnosticResults.api_authentication = true;
          console.log('✅ Autenticação da API funcionando');
        } else {
          throw new Error(`Auth falhou: HTTP ${authTestResponse.status}`);
        }
      } catch (error) {
        console.log('❌ Falha na autenticação da API:', error.message);
        diagnosticResults.error_details.push(`Auth API: ${error.message}`);
      }
    }

    // === VERIFICAÇÃO DE PRÉ-REQUISITOS ===
    if (!diagnosticResults.api_server_running) {
      console.log('⚠️ API Server não disponível - Deploy não é possível');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API Server da VPS não está disponível',
          message: 'Não é possível fazer deploy sem a API da VPS rodando',
          diagnostics: diagnosticResults,
          next_steps: [
            'Verifique se a VPS está online',
            'Instale o API Server usando: node vps-api-server.js',
            'Verifique se a porta 3002 está liberada no firewall'
          ]
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!diagnosticResults.api_authentication) {
      console.log('⚠️ Falha na autenticação da API');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha na autenticação com API da VPS',
          message: 'Token de autenticação inválido ou API não configurada',
          diagnostics: diagnosticResults
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // === FASE 2: DEPLOY OTIMIZADO ===
    console.log('🚀 FASE 2: Executando deploy otimizado via API');

    // Script simplificado e otimizado
    const deployScript = `#!/bin/bash
set -e
echo "🚀 Deploy WhatsApp Server Rápido - $(date)"

# Verificar se já existe e está rodando
if pm2 list | grep -q "whatsapp-permanent-server.*online"; then
    echo "✅ Servidor já está rodando, reiniciando..."
    pm2 restart whatsapp-permanent-server
    exit 0
fi

# Instalar Node.js se necessário
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Instalar PM2 se necessário
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Criar e configurar diretório
mkdir -p /root/whatsapp-permanent-server
cd /root/whatsapp-permanent-server

# Package.json mínimo
cat > package.json << 'EOF'
{
  "name": "whatsapp-permanent-server",
  "version": "2.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3"
  }
}
EOF

# Instalar dependências
npm install --production

# Servidor simplificado
cat > server.js << 'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const clients = new Map();

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Permanent Server v2.0',
    timestamp: new Date().toISOString(),
    active_instances: clients.size,
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 WhatsApp Server running on port \${PORT}\`);
});
EOF

# Parar instância anterior
pm2 stop whatsapp-permanent-server 2>/dev/null || true
pm2 delete whatsapp-permanent-server 2>/dev/null || true

# Iniciar com PM2
pm2 start server.js --name "whatsapp-permanent-server"
pm2 save

echo "✅ Deploy concluído!"
curl -s http://localhost:3001/health || echo "❌ Teste final falhou"
`;

    console.log('📤 Enviando script otimizado via API...');

    const deployResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        command: deployScript,
        description: 'Deploy WhatsApp Server Otimizado',
        timeout: 120000 // 2 minutos
      }),
      signal: AbortSignal.timeout(150000) // 2.5 minutos
    });

    if (!deployResponse.ok) {
      throw new Error(`Deploy API falhou: HTTP ${deployResponse.status}`);
    }

    const deployResult = await deployResponse.json();
    
    if (!deployResult.success) {
      throw new Error(`Deploy script falhou: ${deployResult.error || 'Erro desconhecido'}`);
    }

    console.log('✅ Deploy executado com sucesso');

    // === VALIDAÇÃO FINAL ===
    console.log('🧪 FASE 3: Validação final');
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos

    try {
      const finalHealthResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (finalHealthResponse.ok) {
        const finalHealth = await finalHealthResponse.json();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Deploy realizado com sucesso! Servidor WhatsApp online.',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            health: finalHealth,
            deployment_output: deployResult.output,
            diagnostics: diagnosticResults,
            deploy_method: 'API VPS Otimizada'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(`Health check final falhou: HTTP ${finalHealthResponse.status}`);
      }
      
    } catch (healthError) {
      console.log('⚠️ Deploy concluído mas validação final falhou:', healthError.message);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Deploy executado, mas validação final falhou',
          server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
          deployment_output: deployResult.output,
          validation_error: healthError.message,
          diagnostics: diagnosticResults,
          next_steps: [
            'Aguarde alguns segundos e teste manualmente',
            'Verifique se o PM2 está rodando o processo'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro crítico no deploy:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Falha crítica no processo de deploy',
        timestamp: new Date().toISOString(),
        error_type: error.constructor.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
