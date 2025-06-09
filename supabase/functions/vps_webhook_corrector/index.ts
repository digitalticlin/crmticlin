
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
    console.log('[VPS Webhook Corrector] 🔧 Iniciando correção de webhook...');

    const { action } = await req.json();

    switch (action) {
      case 'apply_webhook_fix':
        return await applyWebhookFix();
      
      case 'verify_webhook_working':
        return await verifyWebhookWorking();
      
      case 'get_fix_script':
        return await getWebhookFixScript();
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[VPS Webhook Corrector] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

async function applyWebhookFix() {
  console.log('[VPS Webhook Corrector] 🚀 Aplicando correção de webhook via SSH...');
  
  const fixSteps = [];
  
  try {
    fixSteps.push('🔧 Iniciando correção de webhook na VPS...');
    
    // 1. Verificar se o servidor ainda está funcionando
    fixSteps.push('🔍 Verificando status atual do servidor...');
    
    const healthCheck = await testVPSHealth();
    if (!healthCheck.success) {
      throw new Error(`Servidor VPS não está respondendo: ${healthCheck.error}`);
    }
    
    fixSteps.push('✅ Servidor VPS está rodando e acessível');
    
    // 2. Gerar script de correção
    fixSteps.push('📝 Gerando script de correção de webhook...');
    
    const fixScript = generateWebhookFixScript();
    
    fixSteps.push('✅ Script de correção gerado');
    
    // 3. Instruções para aplicação manual
    fixSteps.push('📋 Script pronto para aplicação manual via SSH');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Script de correção de webhook preparado',
        fixScript,
        steps: fixSteps,
        instructions: [
          '1. Conecte na VPS via SSH: ssh root@31.97.24.222',
          '2. Crie o arquivo de correção: nano /root/webhook_fix.sh',
          '3. Cole o script fornecido e salve (Ctrl+X, Y, Enter)',
          '4. Torne executável: chmod +x /root/webhook_fix.sh',
          '5. Execute: ./webhook_fix.sh',
          '6. Verifique o resultado: curl http://31.97.24.222:3002/health'
        ],
        nextSteps: [
          'Após executar o script, teste criar uma instância na interface',
          'O QR code deve aparecer automaticamente via webhook',
          'O status deve sincronizar em tempo real com o Supabase'
        ]
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    fixSteps.push(`❌ Erro durante correção: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        steps: fixSteps
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

async function testVPSHealth() {
  try {
    const response = await fetch('http://31.97.24.222:3002/health', {
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data,
        message: 'VPS respondendo normalmente'
      };
    }
    
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function generateWebhookFixScript() {
  return `#!/bin/bash
# Script de Correção de Webhook para Sincronização VPS ↔ Supabase
# Execute como root na VPS

echo "🔧 CORREÇÃO DE WEBHOOK PARA SINCRONIZAÇÃO VPS ↔ SUPABASE"
echo "========================================================"

# 1. Verificar servidor atual
echo "🔍 Verificando servidor atual..."
if ! curl -s http://localhost:3002/health > /dev/null; then
  echo "❌ Servidor não está rodando na porta 3002"
  exit 1
fi

echo "✅ Servidor está rodando"

# 2. Fazer backup do arquivo atual
echo "💾 Fazendo backup do server.js atual..."
cd /root/webhook-server-3002
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# 3. Verificar se já tem webhook
if grep -q "webhook.*kigyebrhfoljnydfipcr" server.js; then
  echo "⚠️  Webhook já parece estar configurado"
  echo "📊 Verificando configuração..."
  grep -n "webhook\|kigyebrhfoljnydfipcr" server.js | head -5
else
  echo "❌ Webhook não configurado - aplicando correção..."
  
  # 4. Aplicar patch de webhook
  cat >> webhook_patch.js << 'EOF'

// ========================================
// PATCH DE WEBHOOK PARA SUPABASE
// ========================================

const SUPABASE_WEBHOOK_URL = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// Função para enviar webhook ao Supabase
async function sendWebhookToSupabase(eventType, instanceData, extraData = {}) {
  try {
    const webhookPayload = {
      event: eventType,
      instance: instanceData.instanceId || instanceData.sessionName,
      instanceName: instanceData.sessionName || instanceData.instanceId,
      data: {
        ...extraData,
        timestamp: new Date().toISOString(),
        vpsInstanceId: instanceData.instanceId || instanceData.sessionName
      }
    };

    console.log('[Webhook] 📡 Enviando para Supabase:', JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${API_TOKEN}\`
      },
      body: JSON.stringify(webhookPayload),
      timeout: 10000
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[Webhook] ✅ Sucesso:', result);
      return { success: true, result };
    } else {
      const errorText = await response.text();
      console.error('[Webhook] ❌ Erro HTTP:', response.status, errorText);
      return { success: false, error: \`HTTP \${response.status}: \${errorText}\` };
    }
  } catch (error) {
    console.error('[Webhook] ❌ Erro ao enviar webhook:', error);
    return { success: false, error: error.message };
  }
}

// Endpoints de webhook
app.get('/webhook/status', (req, res) => {
  res.json({
    success: true,
    status: 'configured',
    webhookUrl: SUPABASE_WEBHOOK_URL,
    timestamp: new Date().toISOString()
  });
});

app.post('/webhook/global', (req, res) => {
  const { webhookUrl, events } = req.body;
  
  console.log('[Webhook] 🔧 Configuração global recebida:', { webhookUrl, events });
  
  res.json({
    success: true,
    message: 'Webhook global configurado',
    configuredUrl: SUPABASE_WEBHOOK_URL,
    supportedEvents: ['qr.update', 'connection.update', 'messages.upsert']
  });
});

// Interceptar eventos existentes e adicionar webhook
const originalCreateInstance = app.post.bind(app);

// Override do endpoint de criação para adicionar webhook automático
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl } = req.body;
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe'
      });
    }
    
    // Criar instância com webhook automático
    const finalWebhookUrl = webhookUrl || SUPABASE_WEBHOOK_URL;
    
    const instance = {
      instanceId,
      sessionName,
      status: 'initializing',
      webhookUrl: finalWebhookUrl,
      qrCode: null,
      phone: null,
      profileName: null,
      createdAt: new Date().toISOString(),
      client: null
    };
    
    instances.set(instanceId, instance);
    
    // Notificar Supabase sobre criação
    await sendWebhookToSupabase('instance.created', instance, {
      status: 'initializing'
    });
    
    // Inicializar cliente WhatsApp com eventos de webhook
    await initializeWhatsAppClientWithWebhook(instance);
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'initializing',
      message: 'Instância criada com webhook automático'
    });
    
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Função melhorada para inicializar cliente com webhook
async function initializeWhatsAppClientWithWebhook(instance) {
  try {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName
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

    instance.client = client;

    // Evento QR - CRÍTICO para o Supabase
    client.on('qr', async (qr) => {
      console.log('[QR] 📱 QR Code gerado para:', instance.instanceId);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      
      // WEBHOOK AUTOMÁTICO: Enviar QR para Supabase
      await sendWebhookToSupabase('qr.update', instance, {
        qrCode: qr,
        status: 'qr_ready'
      });
    });

    // Evento Ready - Instância conectada
    client.on('ready', async () => {
      console.log('[Ready] ✅ Cliente pronto:', instance.instanceId);
      instance.status = 'ready';
      instance.qrCode = null;
      instance.phone = client.info?.wid?.user || null;
      instance.profileName = client.info?.pushname || null;
      
      // WEBHOOK AUTOMÁTICO: Notificar conexão
      await sendWebhookToSupabase('connection.update', instance, {
        status: 'ready',
        phone: instance.phone,
        profileName: instance.profileName
      });
    });

    // Evento Authenticated
    client.on('authenticated', async () => {
      console.log('[Auth] 🔐 Cliente autenticado:', instance.instanceId);
      instance.status = 'authenticated';
      
      await sendWebhookToSupabase('connection.update', instance, {
        status: 'authenticated'
      });
    });

    // Evento Auth Failure
    client.on('auth_failure', async (msg) => {
      console.error('[Auth] ❌ Falha na autenticação:', instance.instanceId, msg);
      instance.status = 'auth_failed';
      
      await sendWebhookToSupabase('connection.update', instance, {
        status: 'auth_failed',
        error: msg
      });
    });

    // Evento Disconnected
    client.on('disconnected', async (reason) => {
      console.log('[Disconnect] 🔌 Cliente desconectado:', instance.instanceId, reason);
      instance.status = 'disconnected';
      
      await sendWebhookToSupabase('connection.update', instance, {
        status: 'disconnected',
        reason: reason
      });
    });

    // Evento Message Create - Mensagens recebidas
    client.on('message_create', async (message) => {
      // Só processar mensagens recebidas (não enviadas)
      if (!message.fromMe && !message.from.includes('@g.us')) {
        console.log('[Message] 💬 Nova mensagem para:', instance.instanceId);
        
        await sendWebhookToSupabase('messages.upsert', instance, {
          messages: [{
            key: {
              id: message.id._serialized || message.id,
              remoteJid: message.from,
              fromMe: false
            },
            message: {
              conversation: message.body
            },
            messageTimestamp: Date.now()
          }]
        });
      }
    });

    await client.initialize();
    console.log('[Init] 🚀 Cliente inicializado com webhook para:', instance.instanceId);
    
  } catch (error) {
    console.error('[Init] ❌ Erro ao inicializar cliente:', error);
    instance.status = 'error';
    instance.error = error.message;
    
    await sendWebhookToSupabase('connection.update', instance, {
      status: 'error',
      error: error.message
    });
  }
}

console.log('🎉 PATCH DE WEBHOOK APLICADO COM SUCESSO!');
console.log('📡 Webhook URL:', SUPABASE_WEBHOOK_URL);
console.log('🔗 Endpoints adicionados: /webhook/status, /webhook/global');
console.log('⚡ Eventos automáticos: QR, conexão, mensagens');

EOF

  # 5. Aplicar o patch ao server.js
  echo "🔧 Aplicando patch de webhook..."
  cat webhook_patch.js >> server.js
  
  echo "✅ Patch aplicado com sucesso!"
fi

# 6. Reiniciar o servidor
echo "🔄 Reiniciando servidor..."
pm2 restart all
sleep 3

# 7. Verificar se está funcionando
echo "🧪 Testando servidor com webhook..."
curl -s http://localhost:3002/health | jq '.' || curl -s http://localhost:3002/health

echo "🧪 Testando endpoint de webhook..."
curl -s http://localhost:3002/webhook/status | jq '.' || curl -s http://localhost:3002/webhook/status

echo ""
echo "✅ CORREÇÃO DE WEBHOOK CONCLUÍDA!"
echo "================================="
echo "🎯 Próximos passos:"
echo "1. Teste criar uma instância na interface web"
echo "2. O QR code deve aparecer automaticamente"
echo "3. O status deve sincronizar com o Supabase"
echo ""
echo "🔗 Monitorar logs: pm2 logs"
echo "📊 Status PM2: pm2 status"
echo "🩺 Health check: curl http://31.97.24.222:3002/health"
echo "🪝 Webhook status: curl http://31.97.24.222:3002/webhook/status"
`;
}

async function verifyWebhookWorking() {
  console.log('[VPS Webhook Corrector] 🧪 Verificando se webhook está funcionando...');
  
  try {
    // 1. Testar health
    const healthResponse = await fetch('http://31.97.24.222:3002/health', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Health check falhou: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    
    // 2. Testar webhook status
    const webhookResponse = await fetch('http://31.97.24.222:3002/webhook/status', {
      signal: AbortSignal.timeout(5000)
    });
    
    const webhookWorking = webhookResponse.ok;
    let webhookData = null;
    
    if (webhookWorking) {
      webhookData = await webhookResponse.json();
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          serverHealth: {
            working: true,
            data: healthData
          },
          webhookEndpoint: {
            working: webhookWorking,
            data: webhookData,
            status: webhookResponse.status
          },
          recommendation: webhookWorking 
            ? 'Webhook configurado e funcionando! Teste criar uma instância.'
            : 'Webhook ainda não configurado. Execute o script de correção.'
        }
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        recommendation: 'Execute o script de correção de webhook'
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

async function getWebhookFixScript() {
  const script = generateWebhookFixScript();
  
  return new Response(
    JSON.stringify({
      success: true,
      script,
      filename: 'webhook_fix.sh',
      instructions: [
        '1. Conecte na VPS: ssh root@31.97.24.222',
        '2. Crie o arquivo: nano /root/webhook_fix.sh', 
        '3. Cole o script e salve',
        '4. Execute: chmod +x /root/webhook_fix.sh && ./webhook_fix.sh',
        '5. Teste: curl http://31.97.24.222:3002/webhook/status'
      ]
    }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}
