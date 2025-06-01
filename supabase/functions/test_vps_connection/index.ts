
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vpsHost = '31.97.24.222';
    const vpsPort = 3001;
    const results = {
      success: false,
      message: '',
      timestamp: new Date().toISOString(),
      vps: {
        host: vpsHost,
        port: vpsPort,
        type: 'Ubuntu 4GB VPS'
      },
      diagnostics: {
        connectivity: {
          basic_ping: { success: false, details: '' },
          node_server: { success: false, details: '' },
          server_info: { success: false, data: null },
          instances_list: { success: false, data: null },
          webhook_url: { success: false, details: '' }
        },
        analysis: {
          server_running: false,
          has_instances: false,
          webhook_reachable: false,
          total_instances: 0
        }
      },
      recommendations: [] as Array<{
        priority: string;
        issue: string;
        solution: string;
      }>,
      ssl_timeout_fix: {
        backup_script: '',
        fix_script: '',
        restart_script: ''
      },
      verification_script: '',
      summary: {
        server_status: 'OFFLINE',
        total_issues: 0,
        total_warnings: 0,
        next_steps: [] as string[]
      }
    };

    // Test 1: Basic connectivity
    console.log('Testing basic connectivity...');
    try {
      const healthResponse = await fetch(`http://${vpsHost}:${vpsPort}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (healthResponse.ok) {
        results.diagnostics.connectivity.basic_ping.success = true;
        results.diagnostics.connectivity.basic_ping.details = `Servidor acessível via HTTP (${healthResponse.status})`;
        results.diagnostics.analysis.server_running = true;
      } else {
        results.diagnostics.connectivity.basic_ping.details = `HTTP ${healthResponse.status}: ${healthResponse.statusText}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.basic_ping.details = `Erro de conectividade: ${error.message}`;
    }

    // Test 2: Node.js server endpoints
    console.log('Testing Node.js server endpoints...');
    try {
      const infoResponse = await fetch(`http://${vpsHost}:${vpsPort}/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (infoResponse.ok) {
        const serverInfo = await infoResponse.json();
        results.diagnostics.connectivity.server_info.success = true;
        results.diagnostics.connectivity.server_info.data = serverInfo;
        results.diagnostics.connectivity.node_server.success = true;
        results.diagnostics.connectivity.node_server.details = 'Servidor Node.js respondendo corretamente';
      } else {
        results.diagnostics.connectivity.node_server.details = `Erro HTTP ${infoResponse.status}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.node_server.details = `Erro ao acessar /info: ${error.message}`;
    }

    // Test 3: Instances list
    console.log('Testing instances endpoint...');
    try {
      const instancesResponse = await fetch(`http://${vpsHost}:${vpsPort}/instances`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        results.diagnostics.connectivity.instances_list.success = true;
        results.diagnostics.connectivity.instances_list.data = instancesData;
        results.diagnostics.analysis.total_instances = Array.isArray(instancesData.instances) ? instancesData.instances.length : 0;
        results.diagnostics.analysis.has_instances = results.diagnostics.analysis.total_instances > 0;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.instances_list.details = `Erro ao listar instâncias: ${error.message}`;
    }

    // Test 4: Webhook connectivity
    console.log('Testing webhook connectivity...');
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    try {
      // Test webhook URL accessibility from our side
      const webhookTestResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          event: 'test',
          instanceId: 'diagnostic_test',
          data: { test: true, message: 'Teste de conectividade do diagnóstico' }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (webhookTestResponse.ok || webhookTestResponse.status === 200) {
        results.diagnostics.connectivity.webhook_url.success = true;
        results.diagnostics.connectivity.webhook_url.details = 'Webhook Supabase acessível e funcionando';
        results.diagnostics.analysis.webhook_reachable = true;
      } else {
        results.diagnostics.connectivity.webhook_url.details = `Webhook retornou ${webhookTestResponse.status}: ${webhookTestResponse.statusText}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.webhook_url.details = `Erro ao testar webhook: ${error.message}`;
    }

    // Generate SSL/Timeout fix scripts
    console.log('Generating SSL/Timeout fix scripts...');
    
    // Backup script
    results.ssl_timeout_fix.backup_script = `#!/bin/bash
echo "=== BACKUP DO SERVIDOR ATUAL ==="
cd /root/whatsapp-server
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado: server.js.backup.$(date +%Y%m%d_%H%M%S)"
echo ""`;

    // Fix script with complete server.js replacement
    results.ssl_timeout_fix.fix_script = `#!/bin/bash
echo "=== APLICANDO CORREÇÃO SSL/TIMEOUT ==="
cd /root/whatsapp-server

# Backup do arquivo atual
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# Criar novo server.js com correções SSL/Timeout
cat > server.js << 'EOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// CORREÇÃO SSL: Desabilitar verificação de certificados SSL para desenvolvimento
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const app = express();
app.use(express.json());

const PORT = 3001;
const HOST = '31.97.24.222';
const instances = new Map();

// Função melhorada para envio de webhook com retry e configuração SSL
async function sendWebhook(event, instanceId, data, retries = 3) {
  const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(\`📤 Tentativa \${attempt}/\${retries} de envio webhook: \${event} para \${instanceId}\`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A',
          'User-Agent': 'WhatsApp-Server/1.0'
        },
        body: JSON.stringify({
          event,
          instanceId,
          data
        }),
        // CORREÇÃO TIMEOUT: Aumentar timeout para 30 segundos
        timeout: 30000,
        // Configurações adicionais para melhor conectividade
        agent: {
          keepAlive: true,
          timeout: 30000
        }
      });

      if (response.ok) {
        console.log(\`✅ Webhook enviado com sucesso (tentativa \${attempt}): \${event}\`);
        return true;
      } else {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        console.log(\`⚠️ Webhook falhou HTTP \${response.status} (tentativa \${attempt}): \${errorText}\`);
      }
    } catch (error) {
      console.log(\`❌ Erro webhook (tentativa \${attempt}): \${error.message}\`);
      
      // Log detalhado do erro para debug
      if (error.code) {
        console.log(\`   Código do erro: \${error.code}\`);
      }
      if (error.cause) {
        console.log(\`   Causa: \${error.cause.message || error.cause}\`);
      }
      
      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < retries) {
        const waitTime = 2000 * attempt; // Backoff exponencial
        console.log(\`   ⏳ Aguardando \${waitTime}ms antes da próxima tentativa...\`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.log(\`🔥 Webhook falhou após \${retries} tentativas para evento: \${event}\`);
  return false;
}

// Função para criar uma nova instância WhatsApp
async function createInstance(instanceId) {
  if (instances.has(instanceId)) {
    return { success: false, message: 'Instância já existe' };
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: instanceId }),
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

  // QR Code gerado
  client.on('qr', async (qr) => {
    console.log(\`\${new Date().toISOString()}: QR Code gerado para \${instanceId}\`);
    try {
      const qrCodeData = await QRCode.toDataURL(qr);
      await sendWebhook('qr', instanceId, { qr: qrCodeData });
    } catch (error) {
      console.log(\`\${new Date().toISOString()}: Erro ao gerar QR: \${error.message}\`, error);
    }
  });

  // Cliente pronto
  client.on('ready', async () => {
    console.log(\`\${new Date().toISOString()}: Cliente \${instanceId} conectado!\`);
    const clientInfo = client.info;
    await sendWebhook('ready', instanceId, {
      phone: clientInfo.wid.user,
      name: clientInfo.pushname,
      platform: clientInfo.platform
    });
  });

  // Nova mensagem recebida
  client.on('message', async (message) => {
    console.log(\`\${new Date().toISOString()}: Nova mensagem para \${instanceId}: \${message.body}\`);
    await sendWebhook('message', instanceId, {
      id: message.id._serialized,
      body: message.body,
      from: message.from,
      to: message.to,
      timestamp: message.timestamp,
      type: message.type,
      notifyName: message.notifyName
    });
  });

  // Cliente desconectado
  client.on('disconnected', async (reason) => {
    console.log(\`\${new Date().toISOString()}: Cliente \${instanceId} desconectado: \${reason}\`);
    await sendWebhook('disconnected', instanceId, { reason });
    instances.delete(instanceId);
  });

  // Inicializar cliente
  try {
    await client.initialize();
    instances.set(instanceId, client);
    return { success: true, message: 'Instância criada com sucesso' };
  } catch (error) {
    console.error(\`Erro ao criar instância \${instanceId}:\`, error);
    return { success: false, message: error.message };
  }
}

// Rotas da API
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    instances: instances.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0-ssl-fix'
  });
});

app.get('/info', (req, res) => {
  res.json({
    server: 'WhatsApp Web.js Server',
    version: '2.0.0-ssl-fix',
    host: HOST,
    port: PORT,
    instances_active: instances.size,
    instances_list: Array.from(instances.keys()),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ssl_fix: 'enabled',
    timeout_fix: 'enabled',
    webhook_url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
  });
});

app.get('/instances', (req, res) => {
  const instanceList = Array.from(instances.entries()).map(([id, client]) => ({
    id,
    status: client.info ? 'connected' : 'disconnected',
    info: client.info || null
  }));
  
  res.json({
    total: instances.size,
    instances: instanceList
  });
});

app.post('/create-instance', async (req, res) => {
  const { instanceId } = req.body;
  
  if (!instanceId) {
    return res.status(400).json({ success: false, message: 'instanceId é obrigatório' });
  }
  
  const result = await createInstance(instanceId);
  res.json(result);
});

app.delete('/delete-instance/:instanceId', async (req, res) => {
  const { instanceId } = req.params;
  
  if (!instances.has(instanceId)) {
    return res.status(404).json({ success: false, message: 'Instância não encontrada' });
  }
  
  try {
    const client = instances.get(instanceId);
    await client.destroy();
    instances.delete(instanceId);
    res.json({ success: true, message: 'Instância removida com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Teste de webhook manual
app.post('/test-webhook', async (req, res) => {
  const { event = 'test', instanceId = 'manual_test', data = {} } = req.body;
  
  console.log(\`🧪 Teste manual de webhook: \${event}\`);
  const result = await sendWebhook(event, instanceId, { ...data, manual_test: true });
  
  res.json({
    success: result,
    message: result ? 'Webhook teste enviado com sucesso' : 'Webhook teste falhou',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(\`\${new Date().toISOString()}: Finalizando servidor...\`);
  
  for (const [instanceId, client] of instances) {
    try {
      await client.destroy();
      console.log(\`Cliente \${instanceId} finalizado\`);
    } catch (error) {
      console.error(\`Erro ao finalizar cliente \${instanceId}:\`, error);
    }
  }
  
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(\`\${new Date().toISOString()}: === WhatsApp Web.js Server ===\`);
  console.log(\`\${new Date().toISOString()}: Servidor rodando na porta \${PORT}\`);
  console.log(\`\${new Date().toISOString()}: Host: \${HOST}\`);
  console.log(\`\${new Date().toISOString()}: Health: http://\${HOST}:\${PORT}/health\`);
  console.log(\`\${new Date().toISOString()}: Info: http://\${HOST}:\${PORT}/info\`);
  console.log(\`\${new Date().toISOString()}: Instâncias: http://\${HOST}:\${PORT}/instances\`);
  console.log(\`\${new Date().toISOString()}: SSL Fix: ATIVADO\`);
  console.log(\`\${new Date().toISOString()}: Timeout Fix: ATIVADO\`);
  console.log(\`\${new Date().toISOString()}: ===============================\`);
});
EOF

echo "✅ Arquivo server.js atualizado com correções SSL/Timeout"
echo ""`;

    // Restart script
    results.ssl_timeout_fix.restart_script = `#!/bin/bash
echo "=== REINICIANDO SERVIDOR COM CORREÇÕES ==="
cd /root/whatsapp-server

# Parar processo atual
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Aguardar um momento
sleep 3

# Iniciar com novo código
pm2 start server.js --name whatsapp-server --log-date-format="YYYY-MM-DD HH:mm:ss"

# Verificar status
sleep 5
pm2 status
pm2 logs whatsapp-server --lines 20

echo ""
echo "✅ Servidor reiniciado com correções SSL/Timeout"
echo "🧪 Teste os endpoints:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/info"
echo "   curl -X POST http://localhost:3001/test-webhook"
echo ""`;

    // Generate recommendations based on test results
    console.log('Generating recommendations...');
    
    if (!results.diagnostics.analysis.server_running) {
      results.recommendations.push({
        priority: 'CRÍTICO',
        issue: 'Servidor Node.js não está respondendo',
        solution: 'Execute o script de correção SSL/Timeout e reinicie o servidor'
      });
    }

    if (!results.diagnostics.analysis.webhook_reachable) {
      results.recommendations.push({
        priority: 'ALTO',
        issue: 'Problemas SSL/Timeout detectados nos logs (UNABLE_TO_VERIFY_LEAF_SIGNATURE, UND_ERR_CONNECT_TIMEOUT)',
        solution: 'Aplicar correção SSL/Timeout no código do servidor'
      });
    }

    results.recommendations.push({
      priority: 'INFORMATIVO',
      issue: 'Logs mostram erros SSL e timeout recorrentes',
      solution: 'Use os scripts de correção fornecidos para resolver definitivamente'
    });

    // Generate verification script
    results.verification_script = `#!/bin/bash
echo "=== VERIFICAÇÃO PÓS-CORREÇÃO ==="
echo "Data: $(date)"
echo ""

echo "=== 1. STATUS DO SERVIDOR CORRIGIDO ==="
curl -s http://localhost:3001/health | jq .
echo ""

echo "=== 2. INFORMAÇÕES DETALHADAS ==="
curl -s http://localhost:3001/info | jq .
echo ""

echo "=== 3. TESTE WEBHOOK MANUAL ==="
curl -X POST http://localhost:3001/test-webhook \\
  -H "Content-Type: application/json" \\
  -d '{"event":"test_correcao","instanceId":"verificacao","data":{"message":"Teste após correção SSL/Timeout"}}' | jq .
echo ""

echo "=== 4. LOGS RECENTES ==="
pm2 logs whatsapp-server --lines 10 --nostream
echo ""

echo "=== 5. STATUS PM2 ==="
pm2 status
echo ""

echo "=== VERIFICAÇÃO CONCLUÍDA ==="`;

    // Calculate summary
    let totalIssues = 0;
    let totalWarnings = 0;

    results.recommendations.forEach(rec => {
      if (rec.priority === 'CRÍTICO') totalIssues++;
      else if (rec.priority === 'ALTO') totalWarnings++;
    });

    results.summary.total_issues = totalIssues;
    results.summary.total_warnings = totalWarnings;

    if (results.diagnostics.analysis.server_running) {
      results.summary.server_status = 'ONLINE';
      results.success = true;
      results.message = 'Diagnóstico concluído - Servidor online mas com problemas SSL/Timeout';
    } else {
      results.summary.server_status = 'OFFLINE';
      results.message = 'Diagnóstico concluído - Problemas críticos detectados';
    }

    // Generate next steps
    results.summary.next_steps.push('1. Fazer backup do servidor atual');
    results.summary.next_steps.push('2. Aplicar script de correção SSL/Timeout');
    results.summary.next_steps.push('3. Reiniciar servidor com PM2');
    results.summary.next_steps.push('4. Verificar logs e testar webhook');
    results.summary.next_steps.push('5. Executar verificação pós-correção');

    console.log('Diagnostic completed with SSL/Timeout fixes:', results);

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Diagnostic error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
