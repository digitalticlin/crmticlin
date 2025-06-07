
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface IntegratedFlowTestProps {
  onResult: (result: TestResult) => void;
}

export const IntegratedFlowTest = ({ onResult }: IntegratedFlowTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    'Criação de Instância',
    'Verificação de Existência',
    'Geração de QR Code',
    'Atualização de Status',
    'Teste de Mensagem',
    'Limpeza'
  ];

  const runIntegratedTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setProgress(0);
    
    const testInstanceName = `integrated_test_${Date.now()}`;
    let createdInstanceId: string | null = null;
    const results: any[] = [];
    const overallStartTime = Date.now();

    try {
      onResult({ status: 'running', message: 'Iniciando teste de fluxo integrado...' });

      // ETAPA 1: Criação de Instância
      setCurrentStep(1);
      setProgress(16);
      onResult({ status: 'running', message: 'Etapa 1/6: Criando instância...' });
      
      const creationResult = await WhatsAppWebService.createInstance(testInstanceName);
      
      if (!creationResult.success) {
        throw new Error(`Falha na criação: ${creationResult.error}`);
      }

      // Aguardar sincronização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: createdInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', testInstanceName)
        .single();

      if (!createdInstance) {
        throw new Error('Instância não encontrada após criação');
      }

      createdInstanceId = createdInstance.id;
      results.push({
        step: 'creation',
        success: true,
        data: { instanceId: createdInstanceId, vpsInstanceId: createdInstance.vps_instance_id }
      });

      // ETAPA 2: Verificação de Existência
      setCurrentStep(2);
      setProgress(33);
      onResult({ status: 'running', message: 'Etapa 2/6: Verificando existência...' });
      
      const serverInfo = await WhatsAppWebService.getServerInfo();
      
      results.push({
        step: 'existence',
        success: serverInfo.success,
        data: { serverOnline: serverInfo.success, instanceExists: !!createdInstance.vps_instance_id }
      });

      // ETAPA 3: Geração de QR Code
      setCurrentStep(3);
      setProgress(50);
      onResult({ status: 'running', message: 'Etapa 3/6: Gerando QR Code...' });
      
      const qrResult = await WhatsAppWebService.getQRCode(createdInstanceId);
      
      results.push({
        step: 'qr_generation',
        success: qrResult.success,
        data: { 
          hasQR: !!qrResult.qrCode, 
          waiting: qrResult.waiting,
          source: qrResult.source 
        }
      });

      // ETAPA 4: Atualização de Status (simulação)
      setCurrentStep(4);
      setProgress(66);
      onResult({ status: 'running', message: 'Etapa 4/6: Testando webhook...' });
      
      const webhookPayload = {
        instanceId: createdInstance.vps_instance_id,
        event: 'connection.update',
        data: { status: 'ready', state: 'open' }
      };

      const webhookResult = await supabase.functions.invoke('webhook_whatsapp_web', {
        body: webhookPayload
      });

      results.push({
        step: 'status_update',
        success: !webhookResult.error,
        data: { webhookProcessed: !webhookResult.error }
      });

      // ETAPA 5: Teste de Mensagem (se instância estiver pronta)
      setCurrentStep(5);
      setProgress(83);
      onResult({ status: 'running', message: 'Etapa 5/6: Testando mensagem...' });
      
      // Verificar status da instância
      const { data: instanceCheck } = await supabase
        .from('whatsapp_instances')
        .select('connection_status')
        .eq('id', createdInstanceId)
        .single();

      let messageResult;
      if (instanceCheck?.connection_status === 'ready') {
        messageResult = await WhatsAppWebService.sendMessage(
          createdInstanceId, 
          '5511999999999', 
          'Teste integrado automático'
        );
      } else {
        messageResult = { success: false, error: 'Instância não está pronta' };
      }

      results.push({
        step: 'message_test',
        success: messageResult.success,
        data: { 
          sent: messageResult.success, 
          instanceReady: instanceCheck?.connection_status === 'ready' 
        }
      });

      // ETAPA 6: Limpeza
      setCurrentStep(6);
      setProgress(100);
      onResult({ status: 'running', message: 'Etapa 6/6: Limpando instância de teste...' });
      
      const deleteResult = await WhatsAppWebService.deleteInstance(createdInstanceId);
      
      results.push({
        step: 'cleanup',
        success: deleteResult.success,
        data: { deleted: deleteResult.success }
      });

      // RESULTADO FINAL
      const totalTime = Date.now() - overallStartTime;
      const successfulSteps = results.filter(r => r.success).length;
      const totalSteps = results.length;

      const overallSuccess = successfulSteps === totalSteps;

      onResult({
        status: overallSuccess ? 'success' : 'warning',
        message: `Fluxo integrado concluído: ${successfulSteps}/${totalSteps} etapas com sucesso em ${totalTime}ms`,
        details: {
          totalTime,
          successfulSteps,
          totalSteps,
          successRate: (successfulSteps / totalSteps * 100).toFixed(1),
          stepResults: results,
          testInstance: {
            name: testInstanceName,
            id: createdInstanceId
          }
        }
      });

    } catch (error: any) {
      // Tentar limpar instância mesmo se houver erro
      if (createdInstanceId) {
        try {
          await WhatsAppWebService.deleteInstance(createdInstanceId);
        } catch (cleanupError) {
          console.error('Erro na limpeza:', cleanupError);
        }
      }

      onResult({
        status: 'error',
        message: `Erro no fluxo integrado: ${error.message}`,
        details: {
          error: error.message,
          currentStep: steps[currentStep - 1],
          stepResults: results,
          testInstance: testInstanceName
        }
      });
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Teste Integrado</span>
            <span>{currentStep}/6 etapas</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentStep > 0 && (
            <p className="text-sm text-muted-foreground">
              Executando: {steps[currentStep - 1]}
            </p>
          )}
        </div>
      )}
      
      <Button 
        onClick={runIntegratedTest} 
        disabled={isRunning}
        className="w-full gap-2"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Executando Fluxo Integrado...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            Executar Teste de Fluxo Completo
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai executar em sequência:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          {steps.map((step, index) => (
            <li key={index} className={currentStep === index + 1 ? 'font-medium text-blue-600' : ''}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
