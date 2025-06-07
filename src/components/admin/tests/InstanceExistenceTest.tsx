
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface InstanceExistenceTestProps {
  onResult: (result: TestResult) => void;
}

export const InstanceExistenceTest = ({ onResult }: InstanceExistenceTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [instanceId, setInstanceId] = useState('');

  const runTest = async () => {
    setIsRunning(true);
    onResult({ status: 'running', message: 'Verificando existência da instância...' });

    try {
      // ETAPA 1: Buscar no Supabase
      onResult({ status: 'running', message: 'Consultando Supabase...' });
      
      const { data: supabaseInstance, error: supabaseError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (supabaseError || !supabaseInstance) {
        throw new Error('Instância não encontrada no Supabase');
      }

      // ETAPA 2: Verificar informações do servidor
      onResult({ status: 'running', message: 'Consultando informações do servidor VPS...' });
      
      const serverInfo = await WhatsAppWebService.getServerInfo();
      
      if (!serverInfo.success) {
        throw new Error(`Erro ao consultar servidor: ${serverInfo.error}`);
      }

      // ETAPA 3: Comparar dados
      const analysis = {
        supabaseData: {
          id: supabaseInstance.id,
          instanceName: supabaseInstance.instance_name,
          vpsInstanceId: supabaseInstance.vps_instance_id,
          connectionStatus: supabaseInstance.connection_status,
          createdAt: supabaseInstance.created_at
        },
        serverData: serverInfo.data,
        sync: {
          hasVpsId: !!supabaseInstance.vps_instance_id,
          serverOnline: serverInfo.success
        }
      };

      // ETAPA 4: Verificar estado de sincronização
      let syncStatus = 'success';
      let syncMessage = 'Instância sincronizada corretamente';
      
      if (!supabaseInstance.vps_instance_id) {
        syncStatus = 'warning';
        syncMessage = 'Instância existe no Supabase mas sem VPS Instance ID';
      }

      onResult({
        status: syncStatus as any,
        message: syncMessage,
        details: analysis
      });

    } catch (error: any) {
      onResult({
        status: 'error',
        message: `Erro na verificação: ${error.message}`,
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
        <Label htmlFor="instance-id">ID da Instância</Label>
        <Input
          id="instance-id"
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
            Verificando...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Verificar Existência
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Buscar instância no Supabase</li>
          <li>Consultar informações do servidor VPS</li>
          <li>Comparar dados entre os sistemas</li>
          <li>Verificar sincronização</li>
        </ul>
      </div>
    </div>
  );
};
