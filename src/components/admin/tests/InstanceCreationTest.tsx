
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface InstanceCreationTestProps {
  onResult: (result: TestResult) => void;
}

export const InstanceCreationTest = ({ onResult }: InstanceCreationTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [instanceName, setInstanceName] = useState(`teste_${Date.now()}`);

  const runTest = async () => {
    setIsRunning(true);
    onResult({ status: 'running', message: 'Iniciando teste de criação de instância...' });

    try {
      const startTime = Date.now();
      
      // ETAPA 1: Tentar criar instância via WhatsApp Service
      onResult({ status: 'running', message: 'Criando instância via API...' });
      
      const creationResult = await WhatsAppWebService.createInstance(instanceName);
      
      if (!creationResult.success) {
        throw new Error(`Falha na criação: ${creationResult.error}`);
      }

      // ETAPA 2: Verificar se foi salva no Supabase
      onResult({ status: 'running', message: 'Verificando salvamento no Supabase...' });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar sincronização
      
      const { data: supabaseInstance, error: supabaseError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (supabaseError || !supabaseInstance) {
        throw new Error('Instância não encontrada no Supabase após criação');
      }

      // ETAPA 3: Verificar se tem VPS Instance ID
      if (!supabaseInstance.vps_instance_id) {
        throw new Error('VPS Instance ID não foi definido');
      }

      // ETAPA 4: Verificar integridade dos dados
      const requiredFields = ['id', 'instance_name', 'vps_instance_id', 'company_id'];
      const missingFields = requiredFields.filter(field => !supabaseInstance[field]);
      
      if (missingFields.length > 0) {
        onResult({
          status: 'warning',
          message: `Instância criada mas com campos ausentes: ${missingFields.join(', ')}`,
          details: {
            creationTime: Date.now() - startTime,
            instance: supabaseInstance,
            vpsResult: creationResult,
            missingFields
          }
        });
        return;
      }

      // SUCESSO
      onResult({
        status: 'success',
        message: `Instância "${instanceName}" criada com sucesso em ${Date.now() - startTime}ms`,
        details: {
          creationTime: Date.now() - startTime,
          supabaseInstance,
          vpsResult: creationResult,
          verification: 'Todos os campos obrigatórios presentes'
        }
      });

    } catch (error: any) {
      onResult({
        status: 'error',
        message: `Erro na criação: ${error.message}`,
        details: {
          error: error.message,
          instanceName,
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
        <Label htmlFor="instance-name">Nome da Instância de Teste</Label>
        <Input
          id="instance-name"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
          placeholder="teste_instancia"
          disabled={isRunning}
        />
      </div>
      
      <Button 
        onClick={runTest} 
        disabled={isRunning || !instanceName.trim()}
        className="w-full gap-2"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Testando Criação...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Testar Criação de Instância
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Criar instância via WhatsApp Web Service</li>
          <li>Verificar se foi salva corretamente no Supabase</li>
          <li>Validar campos obrigatórios</li>
          <li>Medir tempo de execução</li>
        </ul>
      </div>
    </div>
  );
};
