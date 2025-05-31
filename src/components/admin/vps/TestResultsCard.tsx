
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface TestResults {
  success: boolean;
  results?: {
    connectivity?: {
      ping_test: boolean;
      http_test: boolean;
    };
    next_steps?: string[];
  };
  scripts?: {
    install?: string;
    server?: string;
    package?: string;
  };
}

interface VPSConfig {
  host: string;
  port: number;
}

interface TestResultsCardProps {
  testResults: TestResults;
  vpsConfig: VPSConfig;
}

export const TestResultsCard = ({ testResults, vpsConfig }: TestResultsCardProps) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  return (
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
                <span className="text-sm">Ping para {vpsConfig.host}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={testResults.results.connectivity.http_test ? "default" : "destructive"}>
                  {testResults.results.connectivity.http_test ? "SUCESSO" : "FALHOU"}
                </Badge>
                <span className="text-sm">HTTP (porta {vpsConfig.port})</span>
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
          <>
            <div>
              <h4 className="font-medium mb-2">Comandos para executar na VPS:</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono space-y-2">
                <div className="text-yellow-400"># 1. Conectar na VPS:</div>
                <div className="flex items-center gap-2">
                  <span>ssh root@{vpsConfig.host}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`ssh root@${vpsConfig.host}`, 'Comando SSH')}
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
                  <div>ufw allow {vpsConfig.port}</div>
                  <div>ufw --force enable</div>
                </div>
                
                <div className="text-yellow-400 mt-3"># 5. Iniciar servidor:</div>
                <div>cd /root/whatsapp-server && ./start.sh</div>
                
                <div className="text-yellow-400 mt-3"># 6. Verificar status:</div>
                <div className="space-y-1">
                  <div>pm2 status</div>
                  <div>pm2 logs whatsapp-server</div>
                  <div>curl http://localhost:{vpsConfig.port}/health</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">Após a instalação:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Execute novamente o teste de conectividade</li>
                <li>• Verifique se o endpoint /health responde</li>
                <li>• Teste a criação de instâncias WhatsApp</li>
                <li>• Configure webhooks para integração com Supabase</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
