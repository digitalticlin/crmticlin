
interface DeployEnvironment {
  name: string;
  domain: string;
  directory: string;
  port: number;
  branch: string;
}

interface DeployResult {
  success: boolean;
  deployId: string;
  logs: string[];
  error?: string;
  timestamp: string;
}

interface DeployStatus {
  environment: string;
  status: 'idle' | 'deploying' | 'success' | 'error';
  lastDeploy?: string;
  version?: string;
  logs: string[];
}

export class DeployService {
  private static readonly ENVIRONMENTS: Record<string, DeployEnvironment> = {
    test: {
      name: 'Teste',
      domain: 'teste-crm.ticlin.com.br',
      directory: '/var/www/teste-crm.ticlin.com.br',
      port: 3000,
      branch: 'main'
    },
    production: {
      name: 'Produção',
      domain: 'crm.ticlin.com.br',
      directory: '/var/www/crm.ticlin.com.br',
      port: 80,
      branch: 'main'
    }
  };

  static async deployToEnvironment(
    environment: 'test' | 'production',
    gitRepository: string
  ): Promise<DeployResult> {
    const env = this.ENVIRONMENTS[environment];
    const deployId = `deploy_${environment}_${Date.now()}`;
    
    console.log(`[Deploy] Iniciando deploy para ${env.name} (${env.domain})`);
    
    try {
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: this.buildDeployScript(environment, gitRepository),
          description: `Deploy automático para ${env.name}`,
          vpsId: 'vps_31_97_24_222'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Salvar log do deploy
        await this.saveDeployLog(deployId, environment, result.data.output);
        
        return {
          success: true,
          deployId,
          logs: result.data.output.split('\n'),
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Falha no deploy');
      }
    } catch (error) {
      console.error(`[Deploy] Erro no deploy ${environment}:`, error);
      return {
        success: false,
        deployId,
        logs: [`Erro: ${error.message}`],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static buildDeployScript(environment: 'test' | 'production', gitRepo: string): string {
    const env = this.ENVIRONMENTS[environment];
    
    return `
#!/bin/bash
set -e

echo "🚀 Iniciando deploy para ${env.name}"
echo "📍 Domínio: ${env.domain}"
echo "📂 Diretório: ${env.directory}"

# Criar backup antes do deploy
if [ -d "${env.directory}" ]; then
  echo "💾 Criando backup..."
  cp -r ${env.directory} ${env.directory}_backup_$(date +%Y%m%d_%H%M%S)
fi

# Criar diretório se não existir
mkdir -p ${env.directory}
cd ${env.directory}

# Clone ou pull do repositório
if [ ! -d ".git" ]; then
  echo "📥 Clonando repositório..."
  git clone ${gitRepo} .
else
  echo "🔄 Atualizando repositório..."
  git pull origin ${env.branch}
fi

# Instalar dependências e fazer build
echo "📦 Instalando dependências..."
npm install

echo "🔨 Fazendo build..."
npm run build

# Configurar nginx se necessário
echo "🌐 Configurando nginx..."
cat > /etc/nginx/sites-available/${env.domain} << 'EOF'
server {
    listen ${env.port === 80 ? '80' : env.port};
    server_name ${env.domain};
    root ${env.directory}/dist;
    index index.html;

    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/${env.domain} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Configurar SSL se for produção
${environment === 'production' ? `
if ! certbot certificates | grep -q "${env.domain}"; then
  echo "🔒 Configurando SSL..."
  certbot --nginx -d ${env.domain} --non-interactive --agree-tos --email admin@ticlin.com.br
fi
` : ''}

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Site disponível em: https://${env.domain}"
    `.trim();
  }

  private static async saveDeployLog(deployId: string, environment: string, logs: string): Promise<void> {
    try {
      // Salvar no localStorage para histórico
      const deployHistory = JSON.parse(localStorage.getItem('deploy_history') || '[]');
      deployHistory.unshift({
        id: deployId,
        environment,
        timestamp: new Date().toISOString(),
        logs: logs.split('\n'),
        status: 'success'
      });
      
      // Manter apenas os últimos 20 deploys
      localStorage.setItem('deploy_history', JSON.stringify(deployHistory.slice(0, 20)));
    } catch (error) {
      console.error('Erro ao salvar log do deploy:', error);
    }
  }

  static async getEnvironmentStatus(environment: 'test' | 'production'): Promise<DeployStatus> {
    const env = this.ENVIRONMENTS[environment];
    
    try {
      // Verificar se o site está acessível
      const healthCheck = await fetch(`https://${env.domain}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const deployHistory = JSON.parse(localStorage.getItem('deploy_history') || '[]');
      const lastDeploy = deployHistory.find(d => d.environment === environment);
      
      return {
        environment,
        status: healthCheck.ok ? 'success' : 'error',
        lastDeploy: lastDeploy?.timestamp,
        version: lastDeploy?.id,
        logs: lastDeploy?.logs || []
      };
    } catch (error) {
      return {
        environment,
        status: 'error',
        logs: [`Erro ao verificar status: ${error.message}`]
      };
    }
  }

  static getDeployHistory(): any[] {
    return JSON.parse(localStorage.getItem('deploy_history') || '[]');
  }

  static async setupVPSInfrastructure(): Promise<boolean> {
    console.log('[Deploy] Configurando infraestrutura base na VPS...');
    
    const setupScript = `
#!/bin/bash
set -e

echo "🏗️ Configurando infraestrutura para deploy automático"

# Instalar dependências necessárias
apt update
apt install -y nginx certbot python3-certbot-nginx git nodejs npm

# Criar estrutura de diretórios
mkdir -p /var/www/teste-crm.ticlin.com.br
mkdir -p /var/www/crm.ticlin.com.br
mkdir -p /var/www/deploy-scripts
mkdir -p /var/www/backups

# Configurar permissões
chown -R www-data:www-data /var/www/
chmod -R 755 /var/www/

# Verificar se nginx está rodando
systemctl enable nginx
systemctl start nginx

echo "✅ Infraestrutura configurada com sucesso!"
    `;

    try {
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: setupScript,
          description: 'Configuração inicial da infraestrutura de deploy',
          vpsId: 'vps_31_97_24_222'
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao configurar infraestrutura:', error);
      return false;
    }
  }
}
