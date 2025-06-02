
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Terminal, CheckCircle, AlertCircle, Copy, Wrench, Play, RefreshCw, Server, Globe } from "lucide-react";

interface AutoFixResults {
  success: boolean;
  message: string;
  timestamp: string;
  steps: Array<{
    step: string;
    status: 'pending' | 'running' | 'success' | 'error';
    details: string;
    duration?: number;
    command?: string;
    output?: string;
  }>;
  api_connection?: {
    host: string;
    port: number;
    connected: boolean;
  };
  final_verification?: {
    server_version: string;
    ssl_fix_enabled: boolean;
    timeout_fix_enabled: boolean;
    webhook_test_available: boolean;
  };
}

export const VPSAutoFixPanel = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [fixResults, setFixResults] = useState<AutoFixResults | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const runDiagnostic = async () => {
    try {
      setIsDiagnosing(true);
      toast.info("Executando diagnóstico VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setDiagnosticResults(data);
      
      if (data.success) {
        toast.success("Diagnóstico concluído!");
      } else {
        toast.error(`Diagnóstico falhou: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const applyAutoFixes = async () => {
    try {
      setIsFixing(true);
      toast.info("Aplicando correções via API HTTP...");

      const { data, error } = await supabase.functions.invoke('apply_vps_fixes', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setFixResults(data);
      
      if (data.success) {
        toast.success("Correções aplicadas com sucesso via API!");
        // Executar diagnóstico novamente para verificar as mudanças
        setTimeout(() => runDiagnostic(), 2000);
      } else {
        if (data.message?.includes('API Server')) {
          toast.error("API Server não está respondendo. Instale primeiro o servidor API na VPS.");
        } else {
          toast.error(`Falha ao aplicar correções: ${data.message}`);
        }
      }

    } catch (error: any) {
      console.error('Erro ao aplicar correções:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const copyInstallScript = () => {
    const installScript = `# Script de instalação do API Server na VPS
# Execute estes comandos na sua VPS como root:

# 1. Instalar Node.js (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 2. Criar diretório e baixar o servidor API
mkdir -p /root/vps-api-server
cd /root/vps-api-server

# 3. Baixar o arquivo do servidor API
# (Copie o código do arquivo vps-api-server.js para o servidor)

# 4. Instalar dependências
npm init -y
npm install express cors

# 5. Configurar token de segurança
export VPS_API_TOKEN="vps-api-token-2024"

# 6. Iniciar o servidor
node server.js

# O servidor estará rodando na porta 3002
# Teste: curl http://localhost:3002/status`;

    navigator.clipboard.writeText(installScript);
    toast.success("Script de instalação copiado para a área de transferência!");
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <CardTitle>Instalação Automática VPS</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runDiagnostic} 
                disabled={isDiagnosing || isFixing}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isDiagnosing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Diagnosticando...
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4" />
                    Executar Diagnóstico
                  </>
                )}
              </Button>
              
              <Button 
                onClick={applyAutoFixes} 
                disabled={isFixing || isDiagnosing}
                className="flex items-center gap-2"
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Aplicando via API...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4" />
                    Aplicar Correções
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Nova Arquitetura HTTP API</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Agora usamos um servidor API HTTP na VPS (porta 3002) em vez de SSH direto. 
                Isso é mais estável e seguro. O processo instala automaticamente ambos os servidores.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyInstallScript}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar Script de Instalação VPS
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>Processo completo:</strong> Verifica conexão → Faz backup → Instala API Server (porta 3002) → 
              Instala WhatsApp Server corrigido (porta 3001) → Configura dependências → Inicia serviços → Verifica funcionamento
            </p>
          </div>

          {diagnosticResults && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Último Diagnóstico:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Status Servidor:</span> {diagnosticResults.summary?.server_status || 'N/A'}</div>
                <div><span className="font-medium">Problemas Críticos:</span> {diagnosticResults.summary?.total_issues || 0}</div>
                <div><span className="font-medium">Avisos:</span> {diagnosticResults.summary?.total_warnings || 0}</div>
                <div><span className="font-medium">Timestamp:</span> {new Date(diagnosticResults.timestamp).toLocaleString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {fixResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {fixResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado da Instalação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <span className="font-medium">Status:</span> {fixResults.message}
            </div>

            {fixResults.api_connection && (
              <div className="p-3 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Conexão API Server:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Host:</span> {fixResults.api_connection.host}:{fixResults.api_connection.port}</div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge variant={fixResults.api_connection.connected ? 'default' : 'destructive'} className="ml-2">
                      {fixResults.api_connection.connected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {fixResults.steps && fixResults.steps.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Etapas Executadas:</h4>
                {fixResults.steps.map((step, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex items-start gap-3 mb-2">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="font-medium">{step.step}</div>
                        <div className="text-sm text-muted-foreground">{step.details}</div>
                      </div>
                      <Badge variant={step.status === 'success' ? 'default' : step.status === 'error' ? 'destructive' : 'secondary'}>
                        {step.status}
                      </Badge>
                    </div>
                    
                    {step.command && (
                      <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs font-mono">
                        <div className="text-gray-400 mb-1">Comando API:</div>
                        {step.command}
                      </div>
                    )}
                    
                    {step.output && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <div className="text-green-700 font-medium mb-1">Output:</div>
                        <pre className="text-green-600">{step.output}</pre>
                      </div>
                    )}
                    
                    {step.duration && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Duração: {step.duration}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {fixResults.final_verification && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Verificação Final:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Versão do Servidor:</span> {fixResults.final_verification.server_version}
                  </div>
                  <div>
                    <span className="font-medium">SSL Fix:</span> 
                    <Badge variant={fixResults.final_verification.ssl_fix_enabled ? 'default' : 'destructive'} className="ml-2">
                      {fixResults.final_verification.ssl_fix_enabled ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Timeout Fix:</span> 
                    <Badge variant={fixResults.final_verification.timeout_fix_enabled ? 'default' : 'destructive'} className="ml-2">
                      {fixResults.final_verification.timeout_fix_enabled ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Webhook Test:</span> 
                    <Badge variant={fixResults.final_verification.webhook_test_available ? 'default' : 'destructive'} className="ml-2">
                      {fixResults.final_verification.webhook_test_available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Instalação executada em: {new Date(fixResults.timestamp).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
