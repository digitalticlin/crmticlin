
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, Server, Terminal, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const VPSTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const VPS_CONFIG = {
    host: '31.97.24.222',
    port: 3001,
    sshPort: 22,
    type: 'Ubuntu 4GB VPS'
  };

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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  const openSSH = () => {
    const sshCommand = `ssh root@${VPS_CONFIG.host}`;
    copyToClipboard(sshCommand, "Comando SSH");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Configuração VPS Ubuntu 4GB</CardTitle>
          </div>
          <CardDescription>
            Teste de conectividade e instalação do servidor WhatsApp Web.js
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Informações da VPS:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">IP:</span> {VPS_CONFIG.host}
              </div>
              <div>
                <span className="font-medium">Porta:</span> {VPS_CONFIG.port}
              </div>
              <div>
                <span className="font-medium">SSH:</span> root@{VPS_CONFIG.host}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {VPS_CONFIG.type}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runConnectivityTest} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando Conectividade...
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4 mr-2" />
                  Testar Conectividade
                </>
              )}
            </Button>
            
            <Button 
              onClick={openSSH} 
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              SSH
            </Button>
          </div>
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
                    <span className="text-sm">Ping para {VPS_CONFIG.host}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={testResults.results.connectivity.http_test ? "default" : "destructive"}>
                      {testResults.results.connectivity.http_test ? "SUCESSO" : "FALHOU"}
                    </Badge>
                    <span className="text-sm">HTTP (porta {VPS_CONFIG.port})</span>
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

            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => copyToClipboard(testResults.scripts?.install || '', 'Script de instalação')} 
                variant="outline" 
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script de Instalação
              </Button>
              <Button 
                onClick={() => copyToClipboard(testResults.scripts?.server || '', 'Código do servidor')} 
                variant="outline" 
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código do Servidor
              </Button>
              <Button 
                onClick={() => copyToClipboard(testResults.scripts?.package || '', 'Package.json')} 
                variant="outline" 
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Package.json
              </Button>
            </div>

            {testResults.scripts?.install && (
              <div>
                <h4 className="font-medium mb-2">Comandos para executar na VPS:</h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono space-y-2">
                  <div className="text-yellow-400"># 1. Conectar na VPS:</div>
                  <div className="flex items-center gap-2">
                    <span>ssh root@{VPS_CONFIG.host}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(`ssh root@${VPS_CONFIG.host}`, 'Comando SSH')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-yellow-400 mt-3"># 2. Atualizar sistema e instalar dependências:</div>
                  <div className="space-y-1">
                    <div>apt update && apt upgrade -y</div>
                    <div>curl -fsSL https://deb.nodesource.com/setup_18.x | bash -</div>
                    <div>apt-get install -y nodejs</div>
                    <div>npm install -g pm2</div>
                  </div>
                  
                  <div className="text-yellow-400 mt-3"># 3. Criar projeto e instalar:</div>
                  <div className="space-y-1">
                    <div>mkdir -p /root/whatsapp-server && cd /root/whatsapp-server</div>
                    <div># (Colar e executar o script de instalação copiado)</div>
                    <div>chmod +x install.sh && ./install.sh</div>
                  </div>
                  
                  <div className="text-yellow-400 mt-3"># 4. Configurar firewall:</div>
                  <div className="space-y-1">
                    <div>ufw allow ssh</div>
                    <div>ufw allow {VPS_CONFIG.port}</div>
                    <div>ufw --force enable</div>
                  </div>
                  
                  <div className="text-yellow-400 mt-3"># 5. Iniciar servidor:</div>
                  <div>cd /root/whatsapp-server && ./start.sh</div>
                  
                  <div className="text-yellow-400 mt-3"># 6. Verificar status:</div>
                  <div className="space-y-1">
                    <div>pm2 status</div>
                    <div>pm2 logs whatsapp-server</div>
                    <div>curl http://localhost:{VPS_CONFIG.port}/health</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">Após a instalação:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Execute novamente o teste de conectividade</li>
                <li>• Verifique se o endpoint /health responde</li>
                <li>• Teste a criação de instâncias WhatsApp</li>
                <li>• Configure webhooks para integração com Supabase</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
