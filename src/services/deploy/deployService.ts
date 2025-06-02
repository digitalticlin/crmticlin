
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
    console.log('[Deploy] Configurando infraestrutura completa na VPS...');
    
    const setupScript = `
#!/bin/bash
set -e

echo "🏗️ Configurando infraestrutura completa para deploy automático"
echo "📍 Domínios: teste-crm.ticlin.com.br | crm.ticlin.com.br"

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências necessárias
apt install -y nginx certbot python3-certbot-nginx git nodejs npm

# Instalar Node.js mais recente se necessário
if ! node --version | grep -q "v2"; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Criar estrutura de diretórios para ambos os domínios
echo "📁 Criando estrutura de diretórios..."
mkdir -p /var/www/teste-crm.ticlin.com.br
mkdir -p /var/www/crm.ticlin.com.br
mkdir -p /var/www/deploy-scripts
mkdir -p /var/www/backups

# Configurar permissões
chown -R www-data:www-data /var/www/
chmod -R 755 /var/www/

# Configurar nginx para TESTE
echo "🌐 Configurando nginx para TESTE (teste-crm.ticlin.com.br)..."
cat > /etc/nginx/sites-available/teste-crm.ticlin.com.br << 'EOF'
server {
    listen 80;
    server_name teste-crm.ticlin.com.br;
    root /var/www/teste-crm.ticlin.com.br/dist;
    index index.html;

    # Configuração para SPA (Single Page Application)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para API WhatsApp (se existir)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Headers de segurança básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Configurar nginx para PRODUÇÃO
echo "🌐 Configurando nginx para PRODUÇÃO (crm.ticlin.com.br)..."
cat > /etc/nginx/sites-available/crm.ticlin.com.br << 'EOF'
server {
    listen 80;
    server_name crm.ticlin.com.br;
    root /var/www/crm.ticlin.com.br/dist;
    index index.html;

    # Configuração para SPA (Single Page Application)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para API WhatsApp (se existir)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Ativar os sites
echo "✅ Ativando sites no nginx..."
ln -sf /etc/nginx/sites-available/teste-crm.ticlin.com.br /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/crm.ticlin.com.br /etc/nginx/sites-enabled/

# Remover site padrão se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do nginx
echo "🧪 Testando configuração do nginx..."
nginx -t

# Reiniciar nginx
echo "🔄 Reiniciando nginx..."
systemctl restart nginx
systemctl enable nginx

# Configurar SSL automático para ambos os domínios
echo "🔒 Configurando SSL automático..."
certbot --nginx -d teste-crm.ticlin.com.br -d crm.ticlin.com.br --non-interactive --agree-tos --email admin@ticlin.com.br --redirect

# Configurar renovação automática do SSL
echo "⏰ Configurando renovação automática do SSL..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Criar página de manutenção padrão para teste
echo "📄 Criando página temporária para teste..."
mkdir -p /var/www/teste-crm.ticlin.com.br/dist
cat > /var/www/teste-crm.ticlin.com.br/dist/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Ticlin CRM - Teste</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { color: #28a745; font-weight: bold; }
        .info { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Ticlin CRM - Ambiente de Teste</h1>
        <p class="status">✅ Infraestrutura configurada com sucesso!</p>
        <p class="info">Este é o ambiente de teste. Aguardando primeiro deploy...</p>
        <p class="info">Domínio: teste-crm.ticlin.com.br</p>
    </div>
</body>
</html>
HTML_EOF

# Criar página de manutenção padrão para produção
echo "📄 Criando página temporária para produção..."
mkdir -p /var/www/crm.ticlin.com.br/dist
cat > /var/www/crm.ticlin.com.br/dist/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Ticlin CRM</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { color: #28a745; font-weight: bold; }
        .info { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Ticlin CRM</h1>
        <p class="status">✅ Infraestrutura configurada com sucesso!</p>
        <p class="info">Sistema em configuração. Aguardando deploy...</p>
        <p class="info">Domínio: crm.ticlin.com.br</p>
    </div>
</body>
</html>
HTML_EOF

# Ajustar permissões finais
chown -R www-data:www-data /var/www/
chmod -R 755 /var/www/

# Verificar status final
echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📊 Status dos serviços:"
systemctl status nginx --no-pager -l
echo ""
echo "🌐 Domínios configurados:"
echo "- Teste: https://teste-crm.ticlin.com.br"
echo "- Produção: https://crm.ticlin.com.br"
echo ""
echo "📁 Estrutura criada:"
ls -la /var/www/
echo ""
echo "🔒 Certificados SSL:"
certbot certificates
echo ""
echo "🎉 Pronto para receber deploys!"
    `;

    try {
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: setupScript,
          description: 'Configuração completa da infraestrutura de deploy com domínios',
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
