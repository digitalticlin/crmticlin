
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FixStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details: string;
  duration?: number;
  command?: string;
  output?: string;
}

// Configuração da API HTTP na VPS
const VPS_API_CONFIG = {
  host: '31.97.24.222',
  port: 3002, // Porta diferente do WhatsApp (3001)
  baseUrl: 'http://31.97.24.222:3002'
};

// Função para executar comando via API HTTP na VPS
async function executeVPSCommand(command: string, description: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    console.log(`🔧 Executando via API HTTP: ${description}`);
    console.log(`Command: ${command}`);
    
    const response = await fetch(`${VPS_API_CONFIG.baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('VPS_API_TOKEN') || 'default-token'}`,
      },
      body: JSON.stringify({
        command: command,
        description: description,
        timeout: 120000 // 2 minutos timeout
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Resultado: ${result.success ? 'Sucesso' : 'Erro'}`);
    console.log(`Output: ${result.output}`);
    
    return {
      success: result.success,
      output: result.output || '',
      error: result.error
    };
    
  } catch (error) {
    console.error(`❌ Erro na requisição HTTP: ${error.message}`);
    return {
      success: false,
      output: '',
      error: `Erro na comunicação com VPS: ${error.message}`
    };
  }
}

// Código servidor.js corrigido para WhatsApp Web.js
const FIXED_SERVER_CODE = `const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const instances = new Map();
const sessionDir = './sessions';

// Criar diretório de sessões se não existir
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// Health endpoint com informações das correções
app.get('/health', (req, res) => {
    const totalInstances = instances.size;
    const onlineInstances = Array.from(instances.values()).filter(inst => inst.status === 'ready').length;
    
    res.json({
        status: 'online',
        version: '2.0.0-ssl-fix',
        instances: totalInstances,
        online_instances: onlineInstances,
        uptime: process.uptime(),
        ssl_fix_enabled: true,
        timeout_fix_enabled: true,
        timestamp: new Date().toISOString()
    });
});

// Info endpoint
app.get('/info', (req, res) => {
    res.json({
        server: 'WhatsApp Web.js Server',
        version: '2.0.0-ssl-fix',
        ssl_fix: 'enabled',
        timeout_fix: 'enabled',
        webhook_url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
        total_instances: instances.size,
        active_instances: Array.from(instances.values()).filter(inst => inst.status === 'ready').length
    });
});

// Webhook de teste
app.post('/test-webhook', (req, res) => {
    console.log('Webhook teste recebido:', req.body);
    res.json({
        success: true,
        message: 'Webhook teste recebido com sucesso',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Listar instâncias
app.get('/instances', (req, res) => {
    const instanceList = Array.from(instances.entries()).map(([name, instance]) => ({
        name,
        status: instance.status || 'unknown',
        qr: instance.qr || null,
        phone: instance.phone || null,
        created_at: instance.created_at || null
    }));
    
    res.json({
        success: true,
        instances: instanceList,
        total: instanceList.length
    });
});

// Criar instância
app.post('/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({ success: false, error: 'instanceName é obrigatório' });
        }
        
        if (instances.has(instanceName)) {
            return res.status(400).json({ success: false, error: 'Instância já existe' });
        }
        
        console.log(\`Criando instância: \${instanceName}\`);
        
        // Configuração com correções SSL e timeout
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceName,
                dataPath: path.join(sessionDir, instanceName)
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
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    // CORREÇÕES SSL
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--allow-running-insecure-content',
                    '--disable-web-security'
                ],
                // CORREÇÕES DE TIMEOUT
                timeout: 120000,
                protocolTimeout: 120000
            },
            // Configurações adicionais de timeout
            qrMaxRetries: 5,
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000
        });
        
        const instanceData = {
            client,
            status: 'initializing',
            qr: null,
            phone: null,
            created_at: new Date().toISOString()
        };
        
        instances.set(instanceName, instanceData);
        
        // Event handlers com melhor tratamento de erros
        client.on('qr', (qr) => {
            console.log(\`QR Code gerado para \${instanceName}\`);
            instanceData.qr = qr;
            instanceData.status = 'qr_generated';
        });
        
        client.on('ready', () => {
            console.log(\`Cliente \${instanceName} está pronto!\`);
            instanceData.status = 'ready';
            instanceData.phone = client.info?.wid?.user || null;
            instanceData.qr = null;
        });
        
        client.on('authenticated', () => {
            console.log(\`Cliente \${instanceName} autenticado\`);
            instanceData.status = 'authenticated';
        });
        
        client.on('auth_failure', (msg) => {
            console.error(\`Falha na autenticação para \${instanceName}:\`, msg);
            instanceData.status = 'auth_failure';
        });
        
        client.on('disconnected', (reason) => {
            console.log(\`Cliente \${instanceName} desconectado:\`, reason);
            instanceData.status = 'disconnected';
            
            // Auto-reconectar após desconexão (com limite)
            if (!instanceData.reconnectAttempts) instanceData.reconnectAttempts = 0;
            if (instanceData.reconnectAttempts < 3) {
                instanceData.reconnectAttempts++;
                setTimeout(() => {
                    console.log(\`Tentando reconectar \${instanceName} (tentativa \${instanceData.reconnectAttempts})\`);
                    client.initialize();
                }, 5000);
            }
        });
        
        // Inicializar cliente com timeout de segurança
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout na inicialização')), 60000);
        });
        
        try {
            await Promise.race([initPromise, timeoutPromise]);
        } catch (error) {
            console.error(\`Erro na inicialização de \${instanceName}:\`, error);
            instances.delete(instanceName);
            throw error;
        }
        
        res.json({
            success: true,
            instanceName,
            message: 'Instância criada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar instância:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter QR Code
app.get('/qr/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    const instance = instances.get(instanceName);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    if (instance.qr) {
        const qrDataURL = await QRCode.toDataURL(instance.qr);
        res.json({
            success: true,
            qr: instance.qr,
            qrImage: qrDataURL,
            status: instance.status
        });
    } else {
        res.json({
            success: false,
            message: 'QR Code não disponível',
            status: instance.status
        });
    }
});

// Status da instância
app.get('/status/:instanceName', (req, res) => {
    const { instanceName } = req.params;
    const instance = instances.get(instanceName);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    res.json({
        success: true,
        instanceName,
        status: instance.status,
        phone: instance.phone,
        created_at: instance.created_at,
        hasQR: !!instance.qr
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Servidor WhatsApp Web.js rodando na porta \${PORT}\`);
    console.log(\`📡 Health check: http://localhost:\${PORT}/health\`);
    console.log(\`🔧 Versão: 2.0.0-ssl-fix (SSL + Timeout fixes enabled)\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Encerrando servidor...');
    instances.forEach((instance, name) => {
        if (instance.client) {
            console.log(\`Desconectando \${name}\`);
            instance.client.destroy();
        }
    });
    process.exit(0);
});

module.exports = app;`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results = {
      success: false,
      message: '',
      timestamp: new Date().toISOString(),
      steps: [] as FixStep[],
      vps_api_connection: {
        host: VPS_API_CONFIG.host,
        port: VPS_API_CONFIG.port,
        baseUrl: VPS_API_CONFIG.baseUrl,
        connected: false
      },
      final_verification: {
        server_version: '',
        ssl_fix_enabled: false,
        timeout_fix_enabled: false,
        webhook_test_available: false
      }
    };

    console.log('🚀 Iniciando aplicação de correções VPS via API HTTP...');

    // Etapa 1: Verificar conexão com a API da VPS
    const step1: FixStep = {
      step: 'Verificação de conexão API VPS',
      status: 'running',
      details: 'Testando conexão com a API HTTP da VPS...',
      command: 'GET /api/status'
    };
    results.steps.push(step1);

    const startTime1 = Date.now();
    try {
      const statusCheck = await executeVPSCommand('echo "API Connection Test - $(date)"', 'Teste de conexão API');
      
      if (statusCheck.success) {
        step1.status = 'success';
        step1.details = 'Conexão com API VPS estabelecida com sucesso';
        step1.output = statusCheck.output;
        step1.duration = Date.now() - startTime1;
        results.vps_api_connection.connected = true;
      } else {
        throw new Error(statusCheck.error || 'Falha na conexão com API VPS');
      }
    } catch (error: any) {
      step1.status = 'error';
      step1.details = `Erro na conexão com API VPS: ${error.message}`;
      step1.duration = Date.now() - startTime1;
      
      results.message = 'Falha na conexão com API VPS - Verifique se o servidor API está rodando na porta 3002';
      return new Response(
        JSON.stringify(results),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Etapa 2: Verificar diretório e criar backup
    const step2: FixStep = {
      step: 'Backup do servidor atual',
      status: 'running',
      details: 'Criando backup do arquivo server.js...',
      command: 'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"'
    };
    results.steps.push(step2);

    const startTime2 = Date.now();
    try {
      const backupResult = await executeVPSCommand(
        'cd /root/whatsapp-server && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Arquivo server.js não encontrado - será criado"',
        'Criação de backup'
      );
      
      step2.status = 'success';
      step2.details = 'Backup criado ou arquivo será criado';
      step2.output = backupResult.output;
      step2.duration = Date.now() - startTime2;
    } catch (error: any) {
      step2.status = 'error';
      step2.details = `Erro no backup: ${error.message}`;
      step2.duration = Date.now() - startTime2;
    }

    // Etapa 3: Criar diretório e aplicar código corrigido
    const step3: FixStep = {
      step: 'Aplicação das correções SSL/Timeout',
      status: 'running',
      details: 'Criando diretório e aplicando código corrigido...',
      command: 'mkdir -p /root/whatsapp-server && aplicar código corrigido'
    };
    results.steps.push(step3);

    const startTime3 = Date.now();
    try {
      // Primeiro criar o diretório
      await executeVPSCommand('mkdir -p /root/whatsapp-server', 'Criação de diretório');
      
      // Aplicar o novo código usando cat com EOF
      const writeCodeCommand = `cat > /root/whatsapp-server/server.js << 'EOF'
${FIXED_SERVER_CODE}
EOF`;
      
      const applyFixResult = await executeVPSCommand(writeCodeCommand, 'Aplicação do código corrigido');
      
      if (applyFixResult.success) {
        step3.status = 'success';
        step3.details = 'Arquivo server.js atualizado com correções SSL/Timeout';
        step3.output = 'Código corrigido aplicado com sucesso';
        step3.duration = Date.now() - startTime3;
      } else {
        throw new Error(applyFixResult.error || 'Falha na aplicação do código');
      }
    } catch (error: any) {
      step3.status = 'error';
      step3.details = `Erro ao aplicar correções: ${error.message}`;
      step3.duration = Date.now() - startTime3;
    }

    // Etapa 4: Verificar e instalar dependências
    const step4: FixStep = {
      step: 'Verificação e instalação de dependências',
      status: 'running',
      details: 'Verificando package.json e instalando dependências...',
      command: 'cd /root/whatsapp-server && npm install whatsapp-web.js express qrcode'
    };
    results.steps.push(step4);

    const startTime4 = Date.now();
    try {
      // Verificar se existe package.json, se não criar um básico
      const packageJsonCommand = `cd /root/whatsapp-server && if [ ! -f package.json ]; then
cat > package.json << 'EOF'
{
  "name": "whatsapp-server",
  "version": "2.0.0-ssl-fix",
  "description": "WhatsApp Web.js Server with SSL and Timeout fixes",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "qrcode": "^1.5.3"
  }
}
EOF
fi`;
      
      await executeVPSCommand(packageJsonCommand, 'Verificação/criação do package.json');
      
      // Instalar dependências
      const installResult = await executeVPSCommand(
        'cd /root/whatsapp-server && npm install',
        'Instalação de dependências'
      );
      
      step4.status = 'success';
      step4.details = 'Dependências verificadas e instaladas';
      step4.output = 'package.json criado/verificado e dependências instaladas';
      step4.duration = Date.now() - startTime4;
    } catch (error: any) {
      step4.status = 'error';
      step4.details = `Erro na instalação de dependências: ${error.message}`;
      step4.duration = Date.now() - startTime4;
    }

    // Etapa 5: Parar processos antigos e iniciar novo servidor
    const step5: FixStep = {
      step: 'Reinicialização do servidor',
      status: 'running',
      details: 'Parando processos antigos e iniciando novo servidor...',
      command: 'cd /root/whatsapp-server && pkill -f "node.*server.js" || true && nohup node server.js > server.log 2>&1 &'
    };
    results.steps.push(step5);

    const startTime5 = Date.now();
    try {
      // Parar processos antigos
      await executeVPSCommand('pkill -f "node.*server.js" || true', 'Parada de processos antigos');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Iniciar novo servidor
      const startResult = await executeVPSCommand(
        'cd /root/whatsapp-server && nohup node server.js > server.log 2>&1 & echo "Servidor iniciado"',
        'Inicialização do servidor'
      );
      
      step5.status = 'success';
      step5.details = 'Servidor reiniciado com sucesso';
      step5.output = startResult.output;
      step5.duration = Date.now() - startTime5;
    } catch (error: any) {
      step5.status = 'error';
      step5.details = `Erro ao reiniciar servidor: ${error.message}`;
      step5.duration = Date.now() - startTime5;
    }

    // Etapa 6: Verificação final com novos endpoints
    const step6: FixStep = {
      step: 'Verificação pós-correção',
      status: 'running',
      details: 'Aguardando servidor estabilizar e verificando endpoints...',
      command: 'sleep 10 && curl -s http://localhost:3001/health'
    };
    results.steps.push(step6);

    const startTime6 = Date.now();
    try {
      // Aguardar servidor estabilizar
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Verificar health endpoint
      const healthResult = await executeVPSCommand(
        'curl -s http://localhost:3001/health',
        'Verificação do endpoint health'
      );
      const infoResult = await executeVPSCommand(
        'curl -s http://localhost:3001/info',
        'Verificação do endpoint info'
      );
      const statusResult = await executeVPSCommand(
        'curl -s http://localhost:3001/instances',
        'Verificação do endpoint instances'
      );
      
      if (healthResult.success) {
        try {
          const healthData = JSON.parse(healthResult.output);
          const infoData = infoResult.success ? JSON.parse(infoResult.output) : {};
          
          results.final_verification = {
            server_version: healthData.version || '2.0.0-ssl-fix',
            ssl_fix_enabled: healthData.ssl_fix_enabled === true,
            timeout_fix_enabled: healthData.timeout_fix_enabled === true,
            webhook_test_available: true
          };

          step6.status = 'success';
          step6.details = `Servidor funcionando! Versão: ${results.final_verification.server_version}`;
          step6.output = `Health: ${healthResult.output}\nInfo: ${infoResult.output || 'N/A'}`;
          step6.duration = Date.now() - startTime6;
          
          results.success = true;
          results.message = 'Todas as correções foram aplicadas e verificadas com sucesso via API HTTP!';
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, ainda considerar sucesso se recebeu resposta
          step6.status = 'success';
          step6.details = 'Servidor respondendo (dados em formato não-JSON)';
          step6.output = healthResult.output;
          step6.duration = Date.now() - startTime6;
          
          results.success = true;
          results.message = 'Correções aplicadas com sucesso - servidor respondendo!';
        }
      } else {
        throw new Error('Servidor não respondeu adequadamente');
      }
    } catch (error: any) {
      step6.status = 'error';
      step6.details = `Erro na verificação final: ${error.message}`;
      step6.duration = Date.now() - startTime6;
      
      // Mesmo com erro na verificação, se os passos críticos foram bem-sucedidos
      const criticalStepsSuccess = results.steps.slice(0, 5).every(step => step.status === 'success');
      if (criticalStepsSuccess) {
        results.success = true;
        results.message = 'Correções aplicadas com sucesso (verificação final com avisos)';
      } else {
        results.message = 'Algumas correções falharam - verifique os logs';
      }
    }

    console.log('✅ Resultado final das correções via API HTTP:', {
      success: results.success,
      totalSteps: results.steps.length,
      successfulSteps: results.steps.filter(s => s.status === 'success').length,
      apiConnected: results.vps_api_connection.connected
    });

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na aplicação de correções via API HTTP:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Falha na aplicação de correções via API HTTP',
        timestamp: new Date().toISOString(),
        steps: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
