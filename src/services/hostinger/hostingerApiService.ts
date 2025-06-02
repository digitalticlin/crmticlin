
interface HostingerVPS {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  ip_address: string;
  cpu_cores: number;
  memory: number;
  storage: number;
  os: string;
  created_at: string;
}

interface HostingerApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  status_code?: number;
}

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exit_code: number;
  duration: number;
}

class HostingerApiService {
  private baseUrl: string;

  constructor() {
    // Usar nossa Edge Function como proxy
    this.baseUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy';
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<HostingerApiResponse<T>> {
    try {
      console.log(`[Hostinger Service] ${method} ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const result = await response.json();
      
      // Log detalhado para debugging
      console.log(`[Hostinger Service] Response status: ${response.status}`);
      console.log(`[Hostinger Service] Response data:`, result);

      if (!response.ok) {
        // Retornar erro detalhado da API
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`,
          code: result.code || 'HTTP_ERROR',
          status_code: response.status
        };
      }

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Erro na comunicação com a API Hostinger',
          code: result.code || 'API_ERROR'
        };
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Hostinger API Error:', error);
      return { 
        success: false, 
        error: error.message || 'Erro na comunicação com a API Hostinger',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // Testar conectividade básica
  async testConnection(): Promise<HostingerApiResponse<any>> {
    console.log('[Hostinger] Testando conectividade...');
    return this.makeRequest('/virtual-machines');
  }

  // Listar todas as VPS
  async listVPS(): Promise<HostingerApiResponse<HostingerVPS[]>> {
    return this.makeRequest<HostingerVPS[]>('/virtual-machines');
  }

  // Obter detalhes de uma VPS específica
  async getVPSDetails(vpsId: string): Promise<HostingerApiResponse<HostingerVPS>> {
    return this.makeRequest<HostingerVPS>(`/virtual-machines/${vpsId}`);
  }

  // Executar comando na VPS
  async executeCommand(vpsId: string, command: string, description?: string): Promise<HostingerApiResponse<CommandResult>> {
    console.log(`[Hostinger] Executando comando: ${description || command}`);
    
    const payload = {
      command,
      description: description || 'Comando executado via painel administrativo'
    };

    return this.makeRequest<CommandResult>(`/virtual-machines/${vpsId}/execute`, 'POST', payload);
  }

  // Reiniciar VPS
  async restartVPS(vpsId: string): Promise<HostingerApiResponse> {
    console.log(`[Hostinger] Reiniciando VPS: ${vpsId}`);
    return this.makeRequest(`/virtual-machines/${vpsId}/restart`, 'POST');
  }

  // Parar VPS
  async stopVPS(vpsId: string): Promise<HostingerApiResponse> {
    console.log(`[Hostinger] Parando VPS: ${vpsId}`);
    return this.makeRequest(`/virtual-machines/${vpsId}/stop`, 'POST');
  }

  // Iniciar VPS
  async startVPS(vpsId: string): Promise<HostingerApiResponse> {
    console.log(`[Hostinger] Iniciando VPS: ${vpsId}`);
    return this.makeRequest(`/virtual-machines/${vpsId}/start`, 'POST');
  }

  // Obter logs da VPS
  async getVPSLogs(vpsId: string, lines: number = 100): Promise<HostingerApiResponse<string>> {
    const command = `journalctl -n ${lines} --no-pager`;
    const result = await this.executeCommand(vpsId, command, 'Obter logs do sistema');
    
    if (result.success && result.data) {
      return { success: true, data: result.data.output };
    }
    
    return { success: false, error: result.error };
  }

  // Verificar status dos serviços WhatsApp
  async checkWhatsAppStatus(vpsId: string): Promise<HostingerApiResponse<any>> {
    const command = 'pm2 status --no-color';
    const result = await this.executeCommand(vpsId, command, 'Verificar status PM2');
    
    if (result.success && result.data) {
      return { 
        success: true, 
        data: { 
          pm2_status: result.data.output,
          exit_code: result.data.exit_code
        } 
      };
    }
    
    return { success: false, error: result.error };
  }

  // Instalar WhatsApp Web.js automaticamente
  async installWhatsAppServer(vpsId: string): Promise<HostingerApiResponse<any>> {
    const installScript = `
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js se necessário
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Instalar PM2 globalmente
npm install -g pm2

# Criar diretório WhatsApp
mkdir -p /root/whatsapp-web-server
cd /root/whatsapp-web-server

# Criar package.json
cat > package.json << 'PACKAGE_EOF'
{
  "name": "whatsapp-web-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3"
  }
}
PACKAGE_EOF

# Instalar dependências
npm install

# Criar servidor WhatsApp
cat > server.js << 'SERVER_EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const clients = new Map();

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server',
    timestamp: new Date().toISOString(),
    active_instances: clients.size
  });
});

app.post('/create-instance', async (req, res) => {
  const { instanceName } = req.body;
  
  try {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: instanceName }),
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
          '--ignore-ssl-errors=yes',
          '--ignore-certificate-errors'
        ],
        timeout: 60000
      }
    });
    
    clients.set(instanceName, { client, qrCode: null, status: 'initializing' });
    
    client.on('qr', async (qr) => {
      const qrCodeData = await QRCode.toDataURL(qr);
      clients.get(instanceName).qrCode = qrCodeData;
      clients.get(instanceName).status = 'qr_code';
    });
    
    client.on('ready', () => {
      clients.get(instanceName).status = 'ready';
      console.log('Cliente WhatsApp conectado:', instanceName);
    });
    
    client.on('disconnected', () => {
      clients.get(instanceName).status = 'disconnected';
    });
    
    await client.initialize();
    
    res.json({ success: true, instanceName, status: 'created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('WhatsApp Web.js Server rodando na porta 3001');
});
SERVER_EOF

# Iniciar com PM2
pm2 start server.js --name whatsapp-server
pm2 save
pm2 startup

# Verificar se está rodando
sleep 5
curl -s http://localhost:3001/health || echo "Erro ao iniciar servidor"
    `;

    return this.executeCommand(vpsId, installScript, 'Instalação automática WhatsApp Web.js');
  }

  // Aplicar correções SSL e timeout
  async applyWhatsAppFixes(vpsId: string): Promise<HostingerApiResponse<any>> {
    const fixScript = `
cd /root/whatsapp-web-server

# Backup do arquivo atual
cp server.js server.js.backup

# Aplicar correções SSL
npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Reiniciar servidor com correções
pm2 restart whatsapp-server
pm2 logs whatsapp-server --lines 10
    `;

    return this.executeCommand(vpsId, fixScript, 'Aplicar correções SSL e timeout');
  }

  // Fazer backup da VPS
  async createBackup(vpsId: string): Promise<HostingerApiResponse> {
    const backupScript = `
mkdir -p /root/backups
cd /root/backups

# Backup dos projetos
tar -czf whatsapp-backup-$(date +%Y%m%d_%H%M%S).tar.gz /root/whatsapp-web-server /root/vps-api-server

# Listar backups
ls -la /root/backups/
    `;

    return this.executeCommand(vpsId, backupScript, 'Criar backup dos projetos');
  }
}

export const hostingerApi = new HostingerApiService();
export type { HostingerVPS, HostingerApiResponse, CommandResult };
