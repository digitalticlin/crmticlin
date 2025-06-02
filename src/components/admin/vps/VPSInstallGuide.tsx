
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Terminal, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const VPSInstallGuide = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const installScript = `#!/bin/bash
# Script de instalação automática do VPS API Server
# Execute como root na sua VPS

echo "🚀 Instalando VPS API Server..."

# Instalar Node.js se necessário
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Criar diretório
mkdir -p /root/vps-api-server
cd /root/vps-api-server

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "description": "API Server para controle remoto da VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Instalar dependências
npm install

echo "✅ Dependências instaladas!"
echo "📝 Agora baixe o arquivo server.js e execute:"
echo "   export VPS_API_TOKEN='seu-token-aqui'"
echo "   node server.js"
echo "🌐 O servidor estará em http://31.97.24.222:3002"`;

  const serverCode = `// VPS API Server - Salvar como server.js
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 3002;
const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  next();
}

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.post('/execute', authenticateToken, async (req, res) => {
  const { command, description, timeout = 60000 } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, error: 'Comando obrigatório' });
  }

  console.log(\`🔧 Executando: \${description || 'Comando'}\`);
  const startTime = Date.now();

  exec(command, { timeout }, (error, stdout, stderr) => {
    const duration = Date.now() - startTime;
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        output: stderr || stdout,
        duration
      });
    }
    res.json({
      success: true,
      output: stdout.trim() || stderr.trim() || 'Sucesso',
      duration,
      timestamp: new Date().toISOString()
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 VPS API Server rodando na porta \${PORT}\`);
  console.log(\`🔑 Token: \${API_TOKEN === 'default-token' ? '⚠️ PADRÃO' : '✅ Configurado'}\`);
});`;

  const startCommand = `# Comando para iniciar o servidor
export VPS_API_TOKEN="vps-api-token-2024"
cd /root/vps-api-server
node server.js`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-600" />
          Guia de Instalação Manual do API Server
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Execute estes passos na sua VPS para instalar o servidor API na porta 3002
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Passo 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">1</Badge>
            <h4 className="font-medium">Executar script de instalação</h4>
          </div>
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs overflow-x-auto">{installScript}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(installScript, 'Script de instalação')}
            >
              {copied === 'Script de instalação' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">2</Badge>
            <h4 className="font-medium">Criar arquivo server.js</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Salve o código abaixo como <code>/root/vps-api-server/server.js</code>
          </p>
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative max-h-96 overflow-y-auto">
            <pre className="text-xs">{serverCode}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(serverCode, 'Código do servidor')}
            >
              {copied === 'Código do servidor' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">3</Badge>
            <h4 className="font-medium">Iniciar o servidor</h4>
          </div>
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs">{startCommand}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(startCommand, 'Comando de inicialização')}
            >
              {copied === 'Comando de inicialização' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Verificação */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Verificação:</h4>
          <p className="text-sm text-green-700">
            Após executar os comandos, teste se o servidor está funcionando:<br/>
            <code>curl http://localhost:3002/status</code>
          </p>
        </div>

        {/* Download alternativo */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Download do arquivo completo</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Você pode baixar o arquivo server.js completo que está disponível no projeto em:
          </p>
          <code className="text-xs bg-white p-2 rounded border">src/utils/vps-api-server.js</code>
        </div>
      </CardContent>
    </Card>
  );
};
