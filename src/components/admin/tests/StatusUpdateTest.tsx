
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface StatusUpdateTestProps {
  onResult: (result: TestResult) => void;
}

export const StatusUpdateTest = ({ onResult }: StatusUpdateTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [instanceId, setInstanceId] = useState('');

  const runTest = async () => {
    setIsRunning(true);
    onResult({ status: 'running', message: 'Testando atualização de status via webhook...' });

    try {
      const startTime = Date.now();

      // ETAPA 1: Verificar estado inicial
      onResult({ status: 'running', message: 'Verificando estado inicial...' });
      
      const { data: initialInstance, error: initialError } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, web_status, updated_at')
        .eq('id', instanceId)
        .single();

      if (initialError || !initialInstance) {
        throw new Error('Instância não encontrada no Supabase');
      }

      const initialStatus = {
        connection_status: initialInstance.connection_status,
        web_status: initialInstance.web_status,
        updated_at: initialInstance.updated_at
      };

      // ETAPA 2: Simular webhook de atualização de status
      onResult({ status: 'running', message: 'Simulando atualização via webhook...' });
      
      // Simular payload de webhook
      const webhookPayload = {
        instanceId: instanceId, // Deve ser o vps_instance_id
        event: 'connection.update',
        data: {
          status: 'ready',
          state: 'open',
          user: {
            id: '5511999999999@c.us',
            jid: '5511999999999@c.us'
          }
        }
      };

      // Chamar o webhook diretamente
      const webhookResponse = await supabase.functions.invoke('webhook_whatsapp_web', {
        body: webhookPayload
      });

      if (webhookResponse.error) {
        throw new Error(`Erro no webhook: ${webhookResponse.error.message}`);
      }

      // ETAPA 3: Aguardar processamento
      onResult({ status: 'running', message: 'Aguardando processamento...' });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // ETAPA 4: Verificar se status foi atualizado
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, web_status, updated_at, phone')
        .eq('id', instanceId)
        .single();

      if (updateError) {
        throw new Error('Erro ao consultar instância atualizada');
      }

      // ETAPA 5: Comparar estados
      const statusChanged = (
        updatedInstance.connection_status !== initialStatus.connection_status ||
        updatedInstance.web_status !== initialStatus.web_status ||
        updatedInstance.updated_at !== initialStatus.updated_at
      );

      if (!statusChanged) {
        onResult({
          status: 'warning',
          message: 'Webhook executado mas status não foi atualizado',
          details: {
            processingTime: Date.now() - startTime,
            initialStatus,
            finalStatus: {
              connection_status: updatedInstance.connection_status,
              web_status: updatedInstance.web_status,
              updated_at: updatedInstance.updated_at
            },
            webhookResponse: webhookResponse.data
          }
        });
        return;
      }

      // SUCESSO
      onResult({
        status: 'success',
        message: `Status atualizado via webhook em ${Date.now() - startTime}ms`,
        details: {
          processingTime: Date.now() - startTime,
          initialStatus,
          finalStatus: {
            connection_status: updatedInstance.connection_status,
            web_status: updatedInstance.web_status,
            phone: updatedInstance.phone,
            updated_at: updatedInstance.updated_at
          },
          changes: {
            connection_status: initialStatus.connection_status !== updatedInstance.connection_status,
            web_status: initialStatus.web_status !== updatedInstance.web_status,
            phone_updated: !!updatedInstance.phone
          },
          webhookResponse: webhookResponse.data
        }
      });

    } catch (error: any) {
      onResult({
        status: 'error',
        message: `Erro no teste de webhook: ${error.message}`,
        details: {
          error: error.message,
          instanceId,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status-instance-id">ID da Instância</Label>
        <Input
          id="status-instance-id"
          value={instanceId}
          onChange={(e) => setInstanceId(e.target.value)}
          placeholder="UUID da instância"
          disabled={isRunning}
        />
      </div>
      
      <Button 
        onClick={runTest} 
        disabled={isRunning || !instanceId.trim()}
        className="w-full gap-2"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Testando Webhook...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Testar Atualização de Status
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Verificar estado inicial da instância</li>
          <li>Simular webhook de atualização</li>
          <li>Verificar se status foi atualizado</li>
          <li>Comparar antes e depois</li>
        </ul>
      </div>
    </div>
  );
};
