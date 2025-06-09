
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, AlertTriangle, PlayCircle, RefreshCw, Loader2 } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface TestStep {
  description: string;
  status: 'running' | 'success' | 'error' | 'warning';
  details?: any;
}

export const IntegratedFlowTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [testInstanceName, setTestInstanceName] = useState('test-instance-' + Date.now());
  let testInstanceId: string;

  if (isRunning) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Executando Teste Integrado...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Por favor, aguarde...</p>
        </CardContent>
      </Card>
    );
  }

  const addStep = (description: string, status: 'running' | 'success' | 'error' | 'warning', details: any = null) => {
    setSteps(prev => [...prev, { description, status, details }]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const executeTest = async () => {
    setIsRunning(true);
    setResult(null);
    setCurrentStep('Iniciando');
    
    const steps: TestStep[] = [];
    
    try {
      addStep('Verificando conectividade do servidor...', 'running');
      const healthResult = await WhatsAppWebService.checkServerHealth();
      
      if (healthResult.success) {
        addStep('✅ Servidor conectado e funcionando', 'success', healthResult.data);
      } else {
        addStep(`❌ Falha na conectividade: ${healthResult.error}`, 'error');
        return;
      }

      addStep('Criando instância de teste...', 'running');
      const instanceResult = await WhatsAppWebService.createInstance(testInstanceName);
      
      if (instanceResult.success && instanceResult.instance) {
        // Use the correct property name from the interface
        testInstanceId = instanceResult.instance.id || instanceResult.instance.instance_name;
        addStep('✅ Instância criada com sucesso', 'success', instanceResult.instance);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        addStep('Obtendo QR Code...', 'running');
        const qrResult = await WhatsAppWebService.getQRCode(testInstanceId);
        
        if (qrResult.success) {
          addStep('✅ QR Code obtido', 'success', { qrCode: qrResult.qrCode });
        } else {
          addStep(`⚠️ QR Code não disponível: ${qrResult.error}`, 'warning');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addStep('Testando envio de mensagem...', 'running');
        const messageResult = await WhatsAppWebService.sendMessage(
          testInstanceId,
          '5511999999999',
          'Teste automatizado - ' + new Date().toISOString()
        );
        
        if (messageResult.success) {
          addStep('✅ Mensagem enviada', 'success', { messageId: messageResult.messageId });
        } else {
          addStep(`❌ Falha no envio: ${messageResult.error}`, 'error');
        }

        addStep('Limpando instância de teste...', 'running');
        const deleteResult = await WhatsAppWebService.deleteInstance(testInstanceId);
        
        if (deleteResult.success) {
          addStep('✅ Instância removida', 'success');
        } else {
          addStep(`⚠️ Aviso na remoção: ${deleteResult.error}`, 'warning');
        }
        
      } else {
        addStep(`❌ Falha na criação: ${instanceResult.error}`, 'error');
      }
      
    } catch (error: any) {
      addStep(`❌ Erro inesperado: ${error.message}`, 'error');
    } finally {
      setCurrentStep('Finalizado');
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          Teste Integrado do Sistema
        </CardTitle>
        <CardDescription>
          Executa um fluxo completo de criação, uso e exclusão de instância
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Nome da instância de teste"
            value={testInstanceName}
            onChange={(e) => setTestInstanceName(e.target.value)}
            disabled={isRunning}
          />
          <Button
            onClick={executeTest}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Iniciar Teste
              </>
            )}
          </Button>
        </div>

        {steps.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Passos do Teste:</h3>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <Card key={index} className={`border-l-4 ${
                    step.status === 'success' ? 'border-green-500' :
                    step.status === 'error' ? 'border-red-500' :
                    step.status === 'warning' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium">{step.description}</span>
                        </div>
                        {step.status !== 'running' && (
                          <Badge variant="outline">
                            {step.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      {step.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
