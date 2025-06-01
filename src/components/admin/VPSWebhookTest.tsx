
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Terminal, CheckCircle, AlertCircle, Copy, Webhook } from "lucide-react";

interface WebhookTestResults {
  success: boolean;
  message: string;
  timestamp: string;
  vps: {
    host: string;
    port: number;
  };
  webhook_test: {
    connectivity: boolean;
    response_time: number;
    status_code: number;
    response_body: any;
  };
  server_test: {
    health_check: boolean;
    instances_active: number;
    server_info: any;
  };
  recommendations: string[];
}

export const VPSWebhookTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<WebhookTestResults | null>(null);

  const runWebhookTest = async () => {
    try {
      setTesting(true);
      toast.info("Testando conectividade do webhook VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      if (data.success) {
        toast.success("Teste de webhook concluído!");
      } else {
        toast.error(`Teste falhou: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro no teste webhook:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copySSHCommand = () => {
    const sshCommand = `ssh root@31.97.24.222`;
    navigator.clipboard.writeText(sshCommand);
    toast.success("Comando SSH copiado para área de transferência!");
  };

  const copyDiagnosticScript = () => {
    const diagnosticScript = `
# Verificar se o servidor Node.js está rodando
echo "=== STATUS DO SERVIDOR ==="
ps aux | grep node
netstat -tlnp | grep :3001

# Testar endpoints do servidor
echo "=== TESTE DE ENDPOINTS ==="
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3001/info | jq .
curl -s http://localhost:3001/instances | jq .

# Testar webhook do Supabase
echo "=== TESTE DE WEBHOOK ==="
curl -X POST "https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A" \\
  -d '{"event":"test","instanceId":"diagnostic","data":{"test":true,"message":"Teste de conectividade"}}'

# Verificar logs recentes
echo "=== LOGS RECENTES ==="
pm2 logs whatsapp-server --lines 10
    `.trim();
    
    navigator.clipboard.writeText(diagnosticScript);
    toast.success("Script de diagnóstico copiado!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-green-600" />
              <CardTitle>Teste de Integração Webhook VPS</CardTitle>
            </div>
            <Button 
              onClick={runWebhookTest} 
              disabled={testing}
              className="flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Testando...
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4" />
                  Executar Teste
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Este teste verifica a conectividade entre a VPS e o webhook do Supabase, 
            além de validar se o servidor WhatsApp Web.js está funcionando corretamente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Comando SSH
              </h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono mb-2">
                ssh root@31.97.24.222
              </div>
              <Button variant="outline" size="sm" onClick={copySSHCommand}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar SSH
              </Button>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Script de Diagnóstico
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Execute este script na VPS para diagnóstico completo
              </p>
              <Button variant="outline" size="sm" onClick={copyDiagnosticScript}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Resultado do Teste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.vps.host}
                  </div>
                  <div className="text-sm text-muted-foreground">Host VPS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.vps.port}
                  </div>
                  <div className="text-sm text-muted-foreground">Porta</div>
                </div>
                <div className="text-center">
                  <Badge variant={results.webhook_test?.connectivity ? "default" : "destructive"}>
                    {results.webhook_test?.connectivity ? "CONECTADO" : "FALHOU"}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Webhook</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.server_test?.instances_active || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Instâncias</div>
                </div>
              </div>

              {results.recommendations && results.recommendations.length > 0 && (
                <div className="border rounded p-4">
                  <h4 className="font-medium mb-3">Recomendações:</h4>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
