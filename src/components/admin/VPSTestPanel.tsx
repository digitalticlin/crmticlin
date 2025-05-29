
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, Server, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const VPSTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runConnectivityTest = async () => {
    try {
      setTesting(true);
      toast.info("Iniciando teste de conectividade VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setTestResults(data);
      
      if (data.success) {
        toast.success("Teste de conectividade concluído!");
      } else {
        toast.error(`Falha no teste: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro no teste VPS:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copyInstallScript = () => {
    if (testResults?.scripts?.install) {
      navigator.clipboard.writeText(testResults.scripts.install);
      toast.success("Script de instalação copiado!");
    }
  };

  const copyServerScript = () => {
    if (testResults?.scripts?.server) {
      navigator.clipboard.writeText(testResults.scripts.server);
      toast.success("Código do servidor copiado!");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Teste de Conectividade VPS</CardTitle>
          </div>
          <CardDescription>
            Testar conectividade com o servidor VPS Hostinger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Informações da VPS:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">IP:</span> 92.112.178.252
              </div>
              <div>
                <span className="font-medium">Porta:</span> 3001
              </div>
              <div>
                <span className="font-medium">SSH:</span> root@92.112.178.252
              </div>
              <div>
                <span className="font-medium">Tipo:</span> Hostinger VPS
              </div>
            </div>
          </div>

          <Button 
            onClick={runConnectivityTest} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando Conectividade...
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4 mr-2" />
                Testar Conectividade e Gerar Scripts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados do Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.results?.connectivity && (
              <div>
                <h4 className="font-medium mb-2">Conectividade:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={testResults.results.connectivity.ping_test ? "default" : "destructive"}>
                      {testResults.results.connectivity.ping_test ? "SUCESSO" : "FALHOU"}
                    </Badge>
                    <span className="text-sm">Ping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={testResults.results.connectivity.http_test ? "default" : "destructive"}>
                      {testResults.results.connectivity.http_test ? "SUCESSO" : "FALHOU"}
                    </Badge>
                    <span className="text-sm">HTTP (porta 3001)</span>
                  </div>
                </div>
              </div>
            )}

            {testResults.results?.next_steps && (
              <div>
                <h4 className="font-medium mb-2">Próximos Passos:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {testResults.results.next_steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={copyInstallScript} variant="outline" size="sm">
                Copiar Script de Instalação
              </Button>
              <Button onClick={copyServerScript} variant="outline" size="sm">
                Copiar Código do Servidor
              </Button>
            </div>

            {testResults.scripts?.install && (
              <div>
                <h4 className="font-medium mb-2">Comandos para executar na VPS:</h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                  <div className="mb-2"># Conectar na VPS:</div>
                  <div className="mb-4">ssh root@92.112.178.252</div>
                  
                  <div className="mb-2"># Criar e executar o script de instalação:</div>
                  <div className="mb-1">cat &gt; install.sh &lt;&lt; 'EOF'</div>
                  <div className="mb-1"># (colar o script copiado aqui)</div>
                  <div className="mb-1">EOF</div>
                  <div className="mb-4">chmod +x install.sh && ./install.sh</div>
                  
                  <div className="mb-2"># Após a instalação, iniciar o servidor:</div>
                  <div>cd /root/whatsapp-server && ./start.sh</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
