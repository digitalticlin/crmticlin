
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Terminal, Shield, Database } from "lucide-react";
import { toast } from "sonner";

export const VPSPersistentServerInstallGuide = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  // Script para backup do servidor atual
  const backupScript = `#!/bin/bash
# Backup do servidor atual (SEGURANÇA)
echo "🔒 Fazendo backup do servidor atual..."

# Criar diretório de backup
mkdir -p /root/whatsapp-backup-$(date +%Y%m%d-%H%M%S)
cd /root/whatsapp-backup-$(date +%Y%m%d-%H%M%S)

# Backup dos arquivos do servidor atual
if [ -f "/root/whatsapp-server.js" ]; then
    cp /root/whatsapp-server.js ./whatsapp-server-backup.js
    echo "✅ Backup do whatsapp-server.js criado"
fi

# Backup das sessões WhatsApp
if [ -d "/root/.wwebjs_auth" ]; then
    cp -r /root/.wwebjs_auth ./wwebjs_auth_backup
    echo "✅ Backup das sessões WhatsApp criado"
fi

# Backup do PM2
pm2 list > pm2-processes-backup.txt
echo "✅ Backup da lista PM2 criado"

echo "📂 Backup salvo em: $(pwd)"
echo "🔒 IMPORTANTE: Guarde este caminho para restaurar se necessário!"`;

  // Script de instalação do servidor persistente
  const installScript = `#!/bin/bash
# Instalação do Servidor WhatsApp com Persistência
echo "🚀 Instalando servidor WhatsApp com persistência..."

# Parar servidor atual se estiver rodando
echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

# Aguardar um momento
sleep 3

# Criar diretório para o novo servidor
mkdir -p /root/whatsapp-persistent
cd /root/whatsapp-persistent

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "whatsapp-persistent-server",
  "version": "2.0.0",
  "description": "WhatsApp Web.js Server com Persistência",
  "main": "whatsapp-server-persistent.js",
  "scripts": {
    "start": "node whatsapp-server-persistent.js"
  },
  "dependencies": {
    "whatsapp-web.js": "^1.21.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-fetch": "^3.3.0"
  }
}
EOF

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

echo "✅ Dependências instaladas!"
echo "📝 Agora você precisa criar o arquivo whatsapp-server-persistent.js"
echo "📋 Use o código fornecido no painel administrativo"`;

  // Script para iniciar o servidor
  const startScript = `#!/bin/bash
# Iniciar o servidor persistente
echo "🚀 Iniciando servidor WhatsApp com persistência..."

cd /root/whatsapp-persistent

# Configurar variável de ambiente do token
export AUTH_TOKEN="default-token"

# Iniciar com PM2
pm2 start whatsapp-server-persistent.js --name "whatsapp-persistent" --time

# Salvar configuração PM2
pm2 save

echo "✅ Servidor iniciado com PM2!"
echo "📊 Use 'pm2 logs whatsapp-persistent' para ver os logs"
echo "📈 Use 'pm2 monit' para monitorar o servidor"`;

  // Verificação pós-instalação
  const verifyScript = `#!/bin/bash
# Verificar se o servidor está funcionando
echo "🔍 Verificando servidor..."

# Testar conectividade
curl -s http://localhost:3001/health || echo "❌ Servidor não está respondendo"

# Verificar PM2
pm2 list | grep whatsapp-persistent

# Verificar logs
echo "📋 Últimas 10 linhas dos logs:"
pm2 logs whatsapp-persistent --lines 10`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Instalação do Servidor Persistente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>IMPORTANTE:</strong> Este guia preserva todas as funcionalidades existentes 
              (criação de instâncias, QR codes, etc.) e adiciona persistência automática.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 1: Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">1</Badge>
            <Shield className="h-5 w-5 text-orange-600" />
            Backup de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Primeiro, vamos fazer backup do servidor atual para garantir que nada seja perdido.
          </p>
          
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{backupScript}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(backupScript, 'Script de backup')}
            >
              {copied === 'Script de backup' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              Execute este script via SSH para fazer backup completo do servidor atual.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 2: Instalação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">2</Badge>
            <Terminal className="h-5 w-5 text-blue-600" />
            Instalação das Dependências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Instalar as dependências necessárias para o servidor persistente.
          </p>
          
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{installScript}</pre>
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
        </CardContent>
      </Card>

      {/* Passo 3: Código do Servidor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">3</Badge>
            <Database className="h-5 w-5 text-green-600" />
            Arquivo do Servidor Persistente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O código do servidor persistente está disponível em: 
            <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">
              src/utils/vps-server-persistent.js
            </code>
          </p>
          
          <Alert>
            <AlertDescription>
              <strong>Ação necessária:</strong> Copie o conteúdo do arquivo 
              <code>src/utils/vps-server-persistent.js</code> e salve como 
              <code>/root/whatsapp-persistent/whatsapp-server-persistent.js</code> na VPS.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 4: Inicialização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">4</Badge>
            <Terminal className="h-5 w-5 text-purple-600" />
            Iniciar o Servidor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Iniciar o servidor persistente com PM2 para gerenciamento automático.
          </p>
          
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{startScript}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(startScript, 'Script de inicialização')}
            >
              {copied === 'Script de inicialização' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Passo 5: Verificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">5</Badge>
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verificar se o servidor está funcionando corretamente.
          </p>
          
          <div className="p-3 bg-gray-900 text-gray-100 rounded relative">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{verifyScript}</pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(verifyScript, 'Script de verificação')}
            >
              {copied === 'Script de verificação' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Preservadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Funcionalidades Preservadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Criação de instâncias</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Geração de QR codes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Autenticação de instâncias</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Envio de mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Webhooks de mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Persistência automática</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
