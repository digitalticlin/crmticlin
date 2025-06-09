
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { MessageSendingService } from "@/services/whatsapp/services/messageSendingService";
import { MessageSendResponse } from "@/services/whatsapp/types/whatsappWebTypes";
import { PlayCircle, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
}

export const IntegratedFlowTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'health', name: 'Verificar saúde do servidor', status: 'pending' },
    { id: 'create', name: 'Criar instância de teste', status: 'pending' },
    { id: 'qr', name: 'Obter QR Code', status: 'pending' },
    { id: 'message', name: 'Enviar mensagem de teste', status: 'pending' },
    { id: 'delete', name: 'Deletar instância de teste', status: 'pending' },
  ]);

  const updateStep = (stepId: string, status: TestStep['status'], result?: any, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result, error } : step
    ));
  };

  const runIntegratedTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', result: undefined, error: undefined })));

    try {
      // Step 1: Health Check
      setCurrentStep(1);
      updateStep('health', 'running');
      const healthResult = await WhatsAppWebService.checkServerHealth();
      updateStep('health', healthResult.success ? 'success' : 'error', healthResult, healthResult.error);

      if (!healthResult.success) {
        throw new Error('Servidor não está saudável');
      }

      // Step 2: Create Instance
      setCurrentStep(2);
      updateStep('create', 'running');
      const instanceName = `test_${Date.now()}`;
      const createResult = await WhatsAppWebService.createInstance(instanceName);
      updateStep('create', createResult.success ? 'success' : 'error', createResult, createResult.error);

      if (!createResult.success || !createResult.instance) {
        throw new Error('Falha ao criar instância');
      }

      const instanceId = createResult.instance.id;

      // Step 3: Get QR Code (with retries)
      setCurrentStep(3);
      updateStep('qr', 'running');
      let qrResult;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        qrResult = await WhatsAppWebService.getQRCode(instanceId);
        
        if (qrResult.success && qrResult.qrCode) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('QR Code não foi gerado após múltiplas tentativas');
        }
      } while (attempts < maxAttempts);

      updateStep('qr', qrResult.success ? 'success' : 'error', qrResult, qrResult.error);

      // Step 4: Send Test Message
      setCurrentStep(4);
      updateStep('message', 'running');
      
      // CORREÇÃO: Aguardar resultado tipado com messageId
      const messageResult: MessageSendResponse = await MessageSendingService.sendMessage(
        instanceId,
        '5511999999999',
        'Mensagem de teste do sistema integrado'
      );
      
      updateStep('message', messageResult.success ? 'success' : 'error', messageResult, messageResult.error);

      // Step 5: Delete Instance
      setCurrentStep(5);
      updateStep('delete', 'running');
      const deleteResult = await WhatsAppWebService.deleteInstance(instanceId);
      updateStep('delete', deleteResult.success ? 'success' : 'error', deleteResult, deleteResult.error);

      setCurrentStep(6); // Complete

    } catch (error: any) {
      console.error('[IntegratedFlowTest] ❌ Erro no teste:', error);
      // Mark current step as error
      const currentStepId = steps[currentStep - 1]?.id;
      if (currentStepId) {
        updateStep(currentStepId, 'error', undefined, error.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Teste de Fluxo Integrado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso do teste</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Button 
          onClick={runIntegratedTest}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executando teste...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Executar Teste Completo
            </div>
          )}
        </Button>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {step.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                {step.status === 'running' && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {step.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{step.name}</div>
                {step.error && (
                  <div className="text-sm text-red-600">{step.error}</div>
                )}
                {step.result && step.status === 'success' && (
                  <div className="text-sm text-gray-600">
                    {/* CORREÇÃO: Verificar se result.messageId existe */}
                    {step.result.messageId && `ID: ${step.result.messageId}`}
                    {step.result.instance && `Instância: ${step.result.instance.instance_name}`}
                    {step.result.qrCode && 'QR Code gerado'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isRunning && steps.some(s => s.status !== 'pending') && (
          <Alert className={steps.every(s => s.status === 'success') ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <AlertDescription>
              {steps.every(s => s.status === 'success') ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-900">✅ Todos os testes passaram! Sistema funcionando corretamente.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-900">⚠️ Alguns testes falharam. Verifique os detalhes acima.</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
