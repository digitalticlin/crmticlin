
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Terminal, 
  Activity, 
  Bug, 
  Play,
  Settings,
  Monitor
} from "lucide-react";
import { EndpointValidationPanel } from "./EndpointValidationPanel";
import { VPSInstanceManager } from "./vps/VPSInstanceManager";
import { toast } from "sonner";

export const VPSDebugDashboard = () => {
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidationComplete = (result: any) => {
    setValidationResult(result);
    console.log('[VPS Debug Dashboard] 📊 Resultado da validação:', result);
  };

  const executeQRTerminalScript = async () => {
    toast.info("Execute o script QR Terminal na VPS", {
      description: "bash vps-qr-terminal-implementation.sh"
    });
  };

  const getStatusColor = () => {
    if (!validationResult) return "gray";
    if (validationResult.vpsOnline && validationResult.workingEndpoints > 4) return "green";
    if (validationResult.vpsOnline && validationResult.workingEndpoints > 2) return "yellow";
    return "red";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-blue-600" />
            VPS Debug Dashboard
            {validationResult && (
              <Badge 
                variant={getStatusColor() === "green" ? "default" : getStatusColor() === "yellow" ? "secondary" : "destructive"}
                className="ml-2"
              >
                {validationResult.vpsOnline ? "ONLINE" : "OFFLINE"}
              </Badge>
            )}
          </CardTitle>
          <p className="text-gray-600">
            Dashboard completo para diagnóstico e correção de problemas na VPS WhatsApp
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <h3 className="font-medium">Status VPS</h3>
              <p className="text-sm text-gray-600">Monitoramento em tempo real</p>
            </div>
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <h3 className="font-medium">QR Terminal</h3>
              <p className="text-sm text-gray-600">Debug visual do Puppeteer</p>
            </div>
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <h3 className="font-medium">Correção Automática</h3>
              <p className="text-sm text-gray-600">Scripts de recuperação</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Funcionalidades */}
      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Validação
          </TabsTrigger>
          <TabsTrigger value="instance-manager" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Criar Instância
          </TabsTrigger>
          <TabsTrigger value="qr-terminal" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            QR Terminal
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Validação de Endpoints */}
        <TabsContent value="validation" className="space-y-4">
          <EndpointValidationPanel onValidationComplete={handleValidationComplete} />
        </TabsContent>

        {/* Tab 2: Gerenciador de Instâncias */}
        <TabsContent value="instance-manager" className="space-y-4">
          <VPSInstanceManager />
        </TabsContent>

        {/* Tab 3: QR Terminal */}
        <TabsContent value="qr-terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-500" />
                Implementação QR Terminal
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Implementar QR Code visual no terminal da VPS para melhor debug do Puppeteer
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">
                  ✅ Script QR Terminal Criado
                </h4>
                <p className="text-sm text-green-600 mb-3">
                  O script foi gerado e está pronto para execução na VPS. Execute os comandos abaixo:
                </p>
                <div className="space-y-2">
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    cd /root/whatsapp-server<br/>
                    bash vps-qr-terminal-implementation.sh
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Funcionalidades do QR Terminal:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-green-500" />
                    QR Code exibido diretamente no terminal com cores
                  </li>
                  <li className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    Logs detalhados de todas as etapas de conexão
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Debug visual do status do Puppeteer
                  </li>
                  <li className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-orange-500" />
                    Identificação de problemas de estabilidade
                  </li>
                </ul>
              </div>

              <Button onClick={executeQRTerminalScript} className="w-full">
                <Terminal className="h-4 w-4 mr-2" />
                Executar na VPS
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Após executar o script:</p>
                <p>1. O servidor será reiniciado com QR Terminal</p>
                <p>2. Use: pm2 logs whatsapp-main-3002 para ver QR Codes</p>
                <p>3. Teste a criação de instância na aba "Criar Instância"</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumo da Validação */}
      {validationResult && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">Resumo da Última Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.vpsOnline ? "✅" : "❌"}
                </div>
                <div className="text-sm text-gray-600">VPS Status</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.workingEndpoints}
                </div>
                <div className="text-sm text-gray-600">Funcionando</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.failedEndpoints}
                </div>
                <div className="text-sm text-gray-600">Com Falha</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round((validationResult.workingEndpoints / validationResult.totalEndpoints) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Disponibilidade</div>
              </div>
            </div>
            
            {validationResult.recommendation && (
              <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Recomendação:</strong> {validationResult.recommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
