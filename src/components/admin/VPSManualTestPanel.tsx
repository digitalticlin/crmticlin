
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal,
  Send,
  Copy,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface TestCommand {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  body?: string;
  expectedResult: string;
}

const TEST_COMMANDS: TestCommand[] = [
  {
    name: "Health Check",
    description: "Verifica se o servidor está rodando",
    endpoint: "/health",
    method: "GET",
    expectedResult: "{ status: 'ok', service: 'whatsapp-web-server' }"
  },
  {
    name: "Lista Instâncias",
    description: "Lista todas as instâncias ativas",
    endpoint: "/instances",
    method: "GET",
    expectedResult: "Array de instâncias ativas"
  },
  {
    name: "Verificar Dependências",
    description: "Verifica dependências Node.js instaladas",
    endpoint: "/debug/dependencies",
    method: "GET",
    expectedResult: "Lista de dependências com versões"
  },
  {
    name: "Estrutura de Arquivos",
    description: "Verifica estrutura de diretórios",
    endpoint: "/debug/structure",
    method: "GET",
    expectedResult: "Estrutura de diretórios do projeto"
  },
  {
    name: "Configuração WhatsApp",
    description: "Verifica configuração do WhatsApp Web.js",
    endpoint: "/debug/whatsapp-config",
    method: "GET",
    expectedResult: "Configurações de sessão e persistência"
  },
  {
    name: "Status Sessões",
    description: "Verifica configuração de persistência",
    endpoint: "/debug/session-config",
    method: "GET",
    expectedResult: "Configurações de persistência de sessão"
  },
  {
    name: "Webhook Config",
    description: "Verifica configuração de webhooks",
    endpoint: "/debug/webhook-config",
    method: "GET",
    expectedResult: "URLs e configurações de webhook"
  },
  {
    name: "Logs Sistema",
    description: "Obtém logs recentes do sistema",
    endpoint: "/debug/logs",
    method: "GET",
    expectedResult: "Logs recentes do servidor"
  },
  {
    name: "Recursos Sistema",
    description: "Verifica uso de CPU/Memória",
    endpoint: "/debug/system-resources",
    method: "GET",
    expectedResult: "Uso de recursos do sistema"
  },
  {
    name: "Teste Criação",
    description: "Testa criação de instância",
    endpoint: "/test-create",
    method: "POST",
    body: '{"instanceId": "test_manual", "testMode": true}',
    expectedResult: "Sucesso na criação de instância teste"
  }
];

const VPS_BASE_URL = 'http://31.97.24.222:3001';

export const VPSManualTestPanel = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customBody, setCustomBody] = useState('');

  const executeTest = async (command: TestCommand) => {
    const key = command.name;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const url = `${VPS_BASE_URL}${command.endpoint}`;
      const options: RequestInit = {
        method: command.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (command.body) {
        options.body = command.body;
      }
      
      console.log(`Executando teste: ${command.name}`, { url, options });
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [key]: {
          success: response.ok,
          status: response.status,
          data,
          timestamp: new Date().toISOString()
        }
      }));
      
      if (response.ok) {
        toast.success(`✅ ${command.name} - Sucesso`);
      } else {
        toast.error(`❌ ${command.name} - Erro ${response.status}`);
      }
      
    } catch (error) {
      console.error(`Erro no teste ${command.name}:`, error);
      
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast.error(`❌ ${command.name} - ${error instanceof Error ? error.message : 'Erro'}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const executeCustomTest = async () => {
    if (!customEndpoint) {
      toast.error("Digite um endpoint para testar");
      return;
    }
    
    const key = 'custom';
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const url = `${VPS_BASE_URL}${customEndpoint}`;
      const options: RequestInit = {
        method: customBody ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (customBody) {
        options.body = customBody;
      }
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [key]: {
          success: response.ok,
          status: response.status,
          data,
          endpoint: customEndpoint,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast.success(`✅ Teste customizado executado`);
      
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          endpoint: customEndpoint,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast.error(`❌ Erro no teste customizado`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência");
  };

  const executeAllTests = async () => {
    for (const command of TEST_COMMANDS) {
      await executeTest(command);
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            Testes Manuais da VPS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Execute testes individuais para diagnosticar problemas específicos
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button onClick={executeAllTests} className="w-full" size="lg">
            <Terminal className="h-4 w-4 mr-2" />
            Executar Todos os Testes
          </Button>
          
          <div className="grid gap-4">
            {TEST_COMMANDS.map((command) => (
              <Card key={command.name} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{command.name}</h4>
                    <p className="text-sm text-muted-foreground">{command.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {command.method}
                    </Badge>
                    <Button
                      onClick={() => executeTest(command)}
                      disabled={loading[command.name]}
                      size="sm"
                    >
                      {loading[command.name] ? (
                        'Executando...'
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Testar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2">
                  <code>{command.method} {command.endpoint}</code>
                  {command.body && (
                    <div className="mt-1">
                      <strong>Body:</strong> <code>{command.body}</code>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <strong>Resultado esperado:</strong> {command.expectedResult}
                </div>
                
                {results[command.name] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      {results[command.name].success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {results[command.name].success ? 'Sucesso' : 'Erro'}
                      </span>
                      {results[command.name].status && (
                        <Badge variant="outline">
                          {results[command.name].status}
                        </Badge>
                      )}
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(results[command.name], null, 2))}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(results[command.name], null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teste Customizado */}
      <Card>
        <CardHeader>
          <CardTitle>Teste Customizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Endpoint</label>
            <Input
              placeholder="/debug/custom-endpoint"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Body (opcional - para POST)</label>
            <Textarea
              placeholder='{"key": "value"}'
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button
            onClick={executeCustomTest}
            disabled={loading.custom || !customEndpoint}
            className="w-full"
          >
            {loading.custom ? 'Executando...' : 'Executar Teste Customizado'}
          </Button>
          
          {results.custom && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                {results.custom.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {results.custom.success ? 'Sucesso' : 'Erro'}
                </span>
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(results.custom, null, 2))}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(results.custom, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
