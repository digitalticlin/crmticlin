
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    console.log('[VPS Auto Installer] 🔧 Verificando e instalando servidor WhatsApp...');

    const { action } = await req.json();

    switch (action) {
      case 'check_and_install':
        return await checkAndInstallWhatsAppServer();
      
      case 'check_server_status':
        return await checkServerStatus();
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[VPS Auto Installer] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkServerStatus() {
  console.log('[VPS Auto Installer] 🔍 Verificando status do servidor...');
  
  const ports = [3002, 3001, 3000, 8080];
  const host = '31.97.24.222';
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://${host}:${port}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.text();
        return new Response(
          JSON.stringify({
            success: true,
            server_running: true,
            port: port,
            response: data,
            message: `Servidor já está rodando na porta ${port}`
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log(`[VPS Auto Installer] Porta ${port} não responde`);
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      server_running: false,
      message: 'Servidor WhatsApp não está rodando'
    }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function checkAndInstallWhatsAppServer() {
  console.log('[VPS Auto Installer] 🚀 Iniciando verificação e instalação...');
  
  const steps = [];
  
  // Passo 1: Verificar se servidor já está rodando
  steps.push('Verificando se servidor já está ativo...');
  const statusCheck = await checkServerStatus();
  const statusData = await statusCheck.json();
  
  if (statusData.server_running) {
    return new Response(
      JSON.stringify({
        success: true,
        already_running: true,
        port: statusData.port,
        message: `Servidor já está funcionando na porta ${statusData.port}`,
        steps: [...steps, '✅ Servidor já está ativo!']
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
  
  steps.push('❌ Servidor não está rodando. Iniciando instalação...');
  
  // Passo 2: Tentar instalar via HTTP (método de fallback)
  const installResult = await installViaHTTP();
  
  return new Response(
    JSON.stringify({
      success: installResult.success,
      installation_attempted: true,
      method: 'http_fallback',
      steps: [...steps, ...installResult.steps],
      message: installResult.success ? 
        'Servidor instalado e iniciado com sucesso!' : 
        'Falha na instalação automática'
    }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function installViaHTTP() {
  console.log('[VPS Auto Installer] 📦 Tentando instalação via HTTP...');
  
  const steps = [];
  
  try {
    // Tentar conectar na porta 80 (API da VPS)
    steps.push('Conectando na API da VPS (porta 80)...');
    
    const response = await fetch('http://31.97.24.222:80/health', {
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      steps.push('✅ API da VPS acessível');
      
      // Tentar executar comando de instalação
      steps.push('Executando comando de instalação...');
      
      const installResponse = await fetch('http://31.97.24.222:80/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        body: JSON.stringify({
          command: `
            # Instalar Node.js se não existir
            if ! command -v node &> /dev/null; then
              curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
              sudo apt-get install -y nodejs
            fi
            
            # Instalar PM2 se não existir
            if ! command -v pm2 &> /dev/null; then
              sudo npm install -g pm2
            fi
            
            # Criar diretório do servidor
            mkdir -p /root/whatsapp-server
            cd /root/whatsapp-server
            
            # Criar servidor simples
            cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    instances: []
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('WhatsApp Server rodando na porta ' + PORT);
});
EOF
            
            # Instalar dependências
            npm init -y
            npm install express
            
            # Parar processo existente
            pm2 delete whatsapp-server 2>/dev/null || true
            
            # Iniciar servidor
            pm2 start server.js --name whatsapp-server
            pm2 save
            pm2 startup
            
            echo "Servidor instalado e iniciado com sucesso!"
          `,
          description: 'Instalação automática do servidor WhatsApp'
        }),
        signal: AbortSignal.timeout(120000) // 2 minutos
      });
      
      if (installResponse.ok) {
        const result = await installResponse.json();
        steps.push('✅ Comando de instalação executado');
        
        // Aguardar alguns segundos e verificar se servidor subiu
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const healthCheck = await fetch('http://31.97.24.222:3001/health', {
          signal: AbortSignal.timeout(5000)
        });
        
        if (healthCheck.ok) {
          steps.push('✅ Servidor WhatsApp está respondendo na porta 3001');
          return { success: true, steps };
        } else {
          steps.push('⚠️ Servidor instalado mas ainda não está respondendo');
          return { success: false, steps };
        }
      } else {
        steps.push(`❌ Falha na execução: ${installResponse.status}`);
        return { success: false, steps };
      }
    } else {
      steps.push('❌ API da VPS não acessível na porta 80');
      return { success: false, steps };
    }
    
  } catch (error: any) {
    steps.push(`❌ Erro na instalação: ${error.message}`);
    return { success: false, steps };
  }
}
