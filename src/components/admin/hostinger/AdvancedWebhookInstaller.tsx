
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Webhook, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal,
  Zap,
  MessageSquare,
  QrCode,
  Activity
} from "lucide-react";

const generateAdvancedWebhookDeployScript = (): string => {
  return `#!/bin/bash

# Script de Deploy Avançado WhatsApp Server com Webhooks v4.0
# Instalação completa do sistema de webhooks automáticos

echo "🚀 DEPLOY AVANÇADO WhatsApp Server v4.0 com Webhooks"
echo "🎯 Objetivo: Instalar servidor completo com webhooks automáticos"

# === CONFIGURAÇÕES ===
WEBHOOK_URL="https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"
SERVER_PORT=3001
PROJECT_DIR="/root/whatsapp-webhook-server"

# === PASSO 1: Preparar ambiente ===
echo "📦 Preparando ambiente..."
apt update && apt upgrade -y

# Instalar Node.js 18 LTS
if ! command -v node &> /dev/null; then
    echo "📥 Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Instalar dependências do sistema
apt-get install -y chromium-browser xvfb

# Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo "📥 Instalando PM2..."
    npm install -g pm2
fi

# === PASSO 2: Criar projeto ===
echo "📁 Criando projeto WhatsApp Webhook Server..."
rm -rf $PROJECT_DIR
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# === PASSO 3: Criar package.json ===
cat > package.json << 'PACKAGE_EOF'
{
  "name": "whatsapp-webhook-server",
  "version": "4.0.0",
  "description": "WhatsApp Web.js Server com Webhooks Automáticos",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3",
    "node-fetch": "^2.7.0",
    "fs-extra": "^11.1.1",
    "moment": "^2.29.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
PACKAGE_EOF

# === PASSO 4: Instalar dependências ===
echo "📦 Instalando dependências..."
npm install

# === PASSO 5: Criar servidor principal com webhooks ===
cat > server.js << 'SERVER_EOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const moment = require('moment');

// Configurações de ambiente
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium-browser';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Storage para clientes e configurações
const clients = new Map();
const webhookConfigs = new Map();
let globalWebhookUrl = '$WEBHOOK_URL';

// === FUNÇÕES DE WEBHOOK ===
async function sendWebhook(instanceId, eventType, data) {
  const config = webhookConfigs.get(instanceId) || { webhookUrl: globalWebhookUrl };
  
  if (!config.webhookUrl) {
    console.log(\`[Webhook] Sem webhook configurado para \${instanceId}\`);
    return;
  }

  const payload = {
    instanceId,
    eventType,
    timestamp: moment().toISOString(),
    data
  };

  try {
    console.log(\`[Webhook] Enviando \${eventType} para \${config.webhookUrl}\`);
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook-Server/4.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000
    });

    if (response.ok) {
      console.log(\`[Webhook] ✅ \${eventType} enviado com sucesso\`);
    } else {
      console.log(\`[Webhook] ❌ Erro HTTP \${response.status}\`);
    }
  } catch (error) {
    console.error(\`[Webhook] ❌ Erro ao enviar \${eventType}:\`, error.message);
  }
}

// === ENDPOINTS DE SAÚDE ===
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Webhook Server',
    version: '4.0.0',
    timestamp: moment().toISOString(),
    active_instances: clients.size,
    webhook_enabled: true,
    global_webhook: globalWebhookUrl
  });
});

app.get('/status', (req, res) => {
  const instancesStatus = Array.from(clients.entries()).map(([id, client]) => ({
    instanceId: id,
    status: client.status || 'unknown',
    lastActivity: client.lastActivity || null
  }));

  res.json({
    success: true,
    status: 'running',
    instances: instancesStatus,
    timestamp: moment().toISOString()
  });
});

// === WEBHOOK CONFIGURATION ===
app.post('/webhook/global', (req, res) => {
  const { webhookUrl, events, enabled } = req.body;
  
  if (enabled && webhookUrl) {
    globalWebhookUrl = webhookUrl;
    console.log(\`[Webhook] Webhook global configurado: \${webhookUrl}\`);
    
    res.json({
      success: true,
      message: 'Webhook global configurado',
      webhookUrl: globalWebhookUrl,
      events: events || ['all']
    });
  } else {
    globalWebhookUrl = null;
    res.json({
      success: true,
      message: 'Webhook global desabilitado'
    });
  }
});

app.get('/webhook/global/status', (req, res) => {
  res.json({
    success: true,
    enabled: !!globalWebhookUrl,
    webhookUrl: globalWebhookUrl,
    connectedInstances: clients.size
  });
});

app.post('/instance/:instanceId/webhook', (req, res) => {
  const { instanceId } = req.params;
  const { webhookUrl, events } = req.body;
  
  webhookConfigs.set(instanceId, {
    webhookUrl,
    events: events || ['all'],
    enabled: true
  });
  
  console.log(\`[Webhook] Webhook configurado para \${instanceId}: \${webhookUrl}\`);
  
  res.json({
    success: true,
    message: 'Webhook configurado para instância',
    instanceId,
    webhookUrl
  });
});

// === CRIAÇÃO DE INSTÂNCIA COM WEBHOOK AUTOMÁTICO ===
app.post('/instance/create', async (req, res) => {
  const { instanceId, sessionName, webhookUrl } = req.body;
  
  if (!instanceId || !sessionName) {
    return res.status(400).json({
      success: false,
      error: 'instanceId e sessionName são obrigatórios'
    });
  }

  if (clients.has(instanceId)) {
    return res.json({
      success: true,
      instanceId,
      status: 'already_exists',
      message: 'Instância já existe'
    });
  }

  try {
    console.log(\`[Instance] Criando instância: \${instanceId}\`);
    
    // Configurar webhook se fornecido
    if (webhookUrl) {
      webhookConfigs.set(instanceId, {
        webhookUrl,
        events: ['all'],
        enabled: true
      });
    }

    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: sessionName,
        dataPath: './sessions'
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
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 60000,
        executablePath: '/usr/bin/chromium-browser'
      }
    });

    // Configurar eventos com webhooks automáticos
    client.on('qr', async (qr) => {
      try {
        console.log(\`[QR] QR Code gerado para \${instanceId}\`);
        const qrCodeData = await QRCode.toDataURL(qr);
        
        clients.set(instanceId, {
          ...clients.get(instanceId),
          qrCode: qrCodeData,
          status: 'qr_code',
          lastActivity: moment().toISOString()
        });

        // WEBHOOK AUTOMÁTICO PARA QR CODE
        await sendWebhook(instanceId, 'qr.update', {
          qrCode: qrCodeData,
          status: 'qr_code'
        });
      } catch (error) {
        console.error(\`[QR] Erro ao gerar QR:\`, error);
      }
    });

    client.on('ready', async () => {
      console.log(\`[Instance] ✅ Cliente conectado: \${instanceId}\`);
      
      clients.set(instanceId, {
        ...clients.get(instanceId),
        client,
        status: 'ready',
        lastActivity: moment().toISOString()
      });

      // WEBHOOK AUTOMÁTICO PARA STATUS
      await sendWebhook(instanceId, 'connection.update', {
        status: 'ready',
        message: 'WhatsApp conectado com sucesso'
      });
    });

    client.on('authenticated', async () => {
      console.log(\`[Instance] Autenticado: \${instanceId}\`);
      
      // WEBHOOK AUTOMÁTICO PARA AUTENTICAÇÃO
      await sendWebhook(instanceId, 'connection.update', {
        status: 'authenticated',
        message: 'WhatsApp autenticado'
      });
    });

    client.on('disconnected', async (reason) => {
      console.log(\`[Instance] Desconectado: \${instanceId}, Razão: \${reason}\`);
      
      // WEBHOOK AUTOMÁTICO PARA DESCONEXÃO
      await sendWebhook(instanceId, 'connection.update', {
        status: 'disconnected',
        reason: reason
      });
    });

    // WEBHOOK AUTOMÁTICO PARA MENSAGENS
    client.on('message_create', async (message) => {
      await sendWebhook(instanceId, 'messages.upsert', {
        messages: [{
          key: {
            remoteJid: message.from,
            fromMe: message.fromMe,
            id: message.id._serialized
          },
          message: {
            conversation: message.body,
            messageTimestamp: moment().unix()
          },
          messageTimestamp: moment().unix(),
          status: 'sent'
        }]
      });
    });

    client.on('message', async (message) => {
      if (!message.fromMe) {
        await sendWebhook(instanceId, 'messages.upsert', {
          messages: [{
            key: {
              remoteJid: message.from,
              fromMe: false,
              id: message.id._serialized
            },
            message: {
              conversation: message.body,
              messageTimestamp: moment().unix()
            },
            messageTimestamp: moment().unix(),
            status: 'received'
          }]
        });
      }
    });

    // Armazenar cliente inicialmente
    clients.set(instanceId, {
      client: null,
      status: 'initializing',
      qrCode: null,
      lastActivity: moment().toISOString()
    });

    // Inicializar cliente
    await client.initialize();

    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância criada e inicializando'
    });

  } catch (error) {
    console.error(\`[Instance] Erro ao criar instância:\`, error);
    clients.delete(instanceId);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === OBTER QR CODE ===
app.get('/instance/:instanceId/qr', (req, res) => {
  const { instanceId } = req.params;
  const instanceData = clients.get(instanceId);

  if (!instanceData) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  if (instanceData.qrCode) {
    res.json({
      success: true,
      qrCode: instanceData.qrCode,
      status: instanceData.status
    });
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instanceData.status || 'initializing'
    });
  }
});

// === STATUS DA INSTÂNCIA ===
app.get('/instance/:instanceId/status', (req, res) => {
  const { instanceId } = req.params;
  const instanceData = clients.get(instanceId);

  if (!instanceData) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  res.json({
    success: true,
    instanceId,
    status: instanceData.status,
    lastActivity: instanceData.lastActivity,
    hasQrCode: !!instanceData.qrCode
  });
});

// === LISTAR INSTÂNCIAS ===
app.get('/instances', (req, res) => {
  const instances = Array.from(clients.entries()).map(([id, data]) => ({
    instanceId: id,
    status: data.status,
    lastActivity: data.lastActivity,
    hasQrCode: !!data.qrCode
  }));

  res.json({
    success: true,
    instances,
    total: instances.length
  });
});

// === DELETAR INSTÂNCIA ===
app.delete('/instance/:instanceId', async (req, res) => {
  const { instanceId } = req.params;
  const instanceData = clients.get(instanceId);

  if (!instanceData) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  try {
    if (instanceData.client) {
      await instanceData.client.destroy();
    }
    
    clients.delete(instanceId);
    webhookConfigs.delete(instanceId);
    
    console.log(\`[Instance] Instância deletada: \${instanceId}\`);
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
  } catch (error) {
    console.error(\`[Instance] Erro ao deletar:\`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === INICIAR SERVIDOR ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 WhatsApp Webhook Server v4.0 rodando na porta \${PORT}\`);
  console.log(\`💚 Health endpoint: http://localhost:\${PORT}/health\`);
  console.log(\`🔗 Webhook global: \${globalWebhookUrl}\`);
  console.log(\`📱 Instâncias ativas: \${clients.size}\`);
});

// === TRATAMENTO DE ERROS ===
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada:', reason);
});
SERVER_EOF

# === PASSO 6: Parar processos existentes ===
echo "🛑 Parando processos existentes..."
pm2 delete whatsapp-webhook-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# === PASSO 7: Criar diretório de sessões ===
mkdir -p sessions
chmod 755 sessions

# === PASSO 8: Iniciar servidor com PM2 ===
echo "🚀 Iniciando servidor webhook..."
pm2 start server.js --name whatsapp-webhook-server --max-memory-restart 1G

# === PASSO 9: Configurar PM2 para auto-start ===
pm2 save
pm2 startup systemd -u root --hp /root

# === PASSO 10: Configurar firewall ===
echo "🔥 Configurando firewall..."
ufw allow $SERVER_PORT/tcp 2>/dev/null || true

# === PASSO 11: Aguardar inicialização ===
echo "⏳ Aguardando servidor inicializar..."
sleep 10

# === PASSO 12: Testes de conectividade ===
echo "🧪 Testando conectividade..."

echo "Testando Health endpoint:"
curl -s http://localhost:$SERVER_PORT/health | head -c 200 || echo "❌ Health endpoint não responde"

echo ""
echo "Testando Status endpoint:"
curl -s http://localhost:$SERVER_PORT/status | head -c 200 || echo "❌ Status endpoint não responde"

echo ""
echo "Testando Webhook Global endpoint:"
curl -s -X POST http://localhost:$SERVER_PORT/webhook/global \\
  -H "Content-Type: application/json" \\
  -d '{"webhookUrl":"'$WEBHOOK_URL'","enabled":true}' | head -c 200 || echo "❌ Webhook endpoint não responde"

# === PASSO 13: Verificação final ===
echo ""
echo "📊 Status dos processos PM2:"
pm2 status

echo ""
echo "🔍 Verificação final..."
HEALTH_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/health)
WEBHOOK_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/webhook/global/status)

if [ "\$HEALTH_STATUS" = "200" ] && [ "\$WEBHOOK_STATUS" = "200" ]; then
    echo "🎉 SUCESSO! Servidor WhatsApp Webhook instalado com sucesso!"
    echo "✅ Health endpoint: HTTP \$HEALTH_STATUS"
    echo "✅ Webhook endpoint: HTTP \$WEBHOOK_STATUS"
    echo ""
    echo "🌐 Endpoints disponíveis:"
    echo "   Health: http://31.97.24.222:$SERVER_PORT/health"
    echo "   Status: http://31.97.24.222:$SERVER_PORT/status"
    echo "   Webhook Global: http://31.97.24.222:$SERVER_PORT/webhook/global"
    echo "   Criar Instância: http://31.97.24.222:$SERVER_PORT/instance/create"
    echo ""
    echo "🔗 Webhook configurado para: $WEBHOOK_URL"
    echo ""
    echo "✨ RECURSOS INSTALADOS:"
    echo "   ✅ QR Code automático via webhook"
    echo "   ✅ Mensagens automáticas via webhook"
    echo "   ✅ Status de conexão automático via webhook"
    echo "   ✅ Múltiplas instâncias suportadas"
    echo "   ✅ Persistência de sessões"
    echo "   ✅ Reconexão automática"
else
    echo "⚠️ ATENÇÃO! Alguns endpoints podem não estar funcionando:"
    echo "   Health: HTTP \$HEALTH_STATUS"
    echo "   Webhook: HTTP \$WEBHOOK_STATUS"
    echo ""
    echo "🔧 Comandos para diagnóstico:"
    echo "   pm2 logs whatsapp-webhook-server --lines 20"
    echo "   pm2 restart whatsapp-webhook-server"
    echo "   curl -v http://localhost:$SERVER_PORT/health"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Teste criar uma instância via API"
echo "2. Verifique se o webhook está sendo chamado"
echo "3. Configure o frontend para receber webhooks automáticos"
echo ""
echo "📝 LOG: Verifique os logs com: pm2 logs whatsapp-webhook-server"
`;
};

export const AdvancedWebhookInstaller = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationLogs, setInstallationLogs] = useState<string[]>([]);
  const [installationStatus, setInstallationStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setInstallationLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const installWebhookServer = async () => {
    setIsInstalling(true);
    setInstallationStatus('installing');
    setInstallationLogs([]);
    
    try {
      addLog('🚀 Iniciando instalação do servidor de webhooks...');
      
      // Gerar script de instalação
      const deployScript = generateAdvancedWebhookDeployScript();
      addLog('📋 Script de instalação gerado');
      
      // Executar via edge function
      const { supabase } = await import('@/integrations/supabase/client');
      
      addLog('📡 Enviando script para VPS...');
      
      const { data, error } = await supabase.functions.invoke('deploy_whatsapp_server', {
        body: {
          action: 'install_webhook_server',
          script: deployScript,
          serverType: 'webhook_advanced',
          version: '4.0'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        addLog('✅ Instalação concluída com sucesso!');
        addLog('🔗 Servidor de webhooks ativo na porta 3001');
        addLog('📱 QR codes automáticos habilitados');
        addLog('💬 Mensagens automáticas habilitadas');
        addLog('📊 Status automático habilitado');
        
        setInstallationStatus('success');
        toast.success('Servidor de webhooks instalado com sucesso!');
        
        // Testar conectividade
        await testWebhookServer();
        
      } else {
        throw new Error(data?.error || 'Falha na instalação');
      }
      
    } catch (error: any) {
      console.error('Erro na instalação:', error);
      addLog(`❌ Erro: ${error.message}`);
      setInstallationStatus('error');
      toast.error(`Erro na instalação: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const testWebhookServer = async () => {
    try {
      addLog('🧪 Testando conectividade do servidor...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {
          action: 'test_webhook_endpoints',
          endpoints: [
            '/health',
            '/status', 
            '/webhook/global/status',
            '/instances'
          ]
        }
      });

      if (data?.success) {
        addLog('✅ Todos os endpoints respondem corretamente');
        addLog('🎉 Servidor de webhooks totalmente funcional!');
      } else {
        addLog('⚠️ Alguns endpoints podem não estar respondendo');
      }
      
    } catch (error: any) {
      addLog(`⚠️ Erro no teste: ${error.message}`);
    }
  };

  const getStatusBadge = () => {
    switch (installationStatus) {
      case 'installing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Instalando
          </Badge>
        );
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Instalado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Webhook className="h-3 w-3 mr-1" />
            Não Instalado
          </Badge>
        );
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-purple-800">
              Instalador de Webhook Avançado
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-3">
            🎯 Recursos que serão instalados:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <QrCode className="h-4 w-4" />
              <span>QR Code automático via webhook</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <MessageSquare className="h-4 w-4" />
              <span>Mensagens automáticas via webhook</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Activity className="h-4 w-4" />
              <span>Status de conexão automático</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Zap className="h-4 w-4" />
              <span>Múltiplas instâncias simultâneas</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/80 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            🚀 Como funciona após a instalação:
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li><strong>CREATE</strong> → Instância criada na VPS</li>
            <li><strong>QR AUTOMÁTICO</strong> → VPS gera QR e envia webhook para Supabase</li>
            <li><strong>MODAL INSTANTÂNEO</strong> → Frontend recebe QR pelo banco (sem polling)</li>
            <li><strong>MENSAGENS AUTOMÁTICAS</strong> → VPS envia todas as mensagens via webhook</li>
            <li><strong>STATUS AUTOMÁTICO</strong> → VPS atualiza status de conexão via webhook</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={installWebhookServer}
            disabled={isInstalling}
            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
          >
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Instalando Servidor...
              </>
            ) : (
              <>
                <Webhook className="h-4 w-4 mr-2" />
                Instalar Servidor de Webhooks
              </>
            )}
          </Button>
          
          {installationStatus === 'success' && (
            <Button 
              onClick={testWebhookServer}
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Testar
            </Button>
          )}
        </div>

        {installationLogs.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
            <h4 className="text-white mb-2 font-bold">📋 Logs de Instalação:</h4>
            {installationLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2 text-gray-700">📚 Endpoints que serão criados:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• <code>POST /instance/create</code> - Criar instância com webhook automático</div>
            <div>• <code>GET /instance/:id/qr</code> - Obter QR code</div>
            <div>• <code>POST /webhook/global</code> - Configurar webhook global</div>
            <div>• <code>GET /webhook/global/status</code> - Status do webhook</div>
            <div>• <code>POST /instance/:id/webhook</code> - Webhook por instância</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
