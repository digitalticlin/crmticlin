
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AsyncStatusResult {
  success: boolean;
  instance_exists: boolean;
  status_updated: boolean;
  current_status?: string;
  error?: string;
}

export class AsyncStatusService {
  
  static async syncInstanceStatus(instanceId: string): Promise<AsyncStatusResult> {
    try {
      console.log('[Async Status] 🔄 Sincronizando status para:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'sync_instance_status',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao sincronizar status');
      }

      console.log('[Async Status] ✅ Status sincronizado:', data);
      
      return {
        success: true,
        instance_exists: true,
        status_updated: data.updated,
        current_status: data.status
      };

    } catch (error: any) {
      console.error('[Async Status] ❌ Erro na sincronização:', error);
      return {
        success: false,
        instance_exists: false,
        status_updated: false,
        error: error.message
      };
    }
  }

  static async checkVPSInstanceExists(instanceId: string): Promise<boolean> {
    try {
      console.log('[Async Status] 🔍 Verificando existência na VPS:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'check_vps_status',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Async Status] ❌ Erro ao verificar VPS:', error);
        return false;
      }

      const exists = data?.exists_in_vps || false;
      console.log('[Async Status] 📡 Instância existe na VPS:', exists);
      
      return exists;

    } catch (error: any) {
      console.error('[Async Status] ❌ Erro na verificação VPS:', error);
      return false;
    }
  }

  static async startPollingForInstance(instanceId: string, maxAttempts: number = 10): Promise<boolean> {
    console.log(`[Async Status] ⏰ Iniciando polling para ${instanceId} (máximo ${maxAttempts} tentativas)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Async Status] 🔄 Polling tentativa ${attempt}/${maxAttempts}`);
      
      try {
        const result = await this.syncInstanceStatus(instanceId);
        
        if (result.success && result.status_updated) {
          console.log(`[Async Status] ✅ Status atualizado na tentativa ${attempt}`);
          toast.success(`Status da instância sincronizado!`);
          return true;
        }
        
        if (result.current_status === 'ready' || result.current_status === 'waiting_qr') {
          console.log(`[Async Status] ✅ Instância está pronta na tentativa ${attempt}`);
          return true;
        }
        
      } catch (error) {
        console.log(`[Async Status] ⚠️ Erro na tentativa ${attempt}:`, error);
      }
      
      // Aguardar antes da próxima tentativa (com backoff exponencial)
      if (attempt < maxAttempts) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 10000); // Max 10s
        console.log(`[Async Status] ⏳ Aguardando ${delay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`[Async Status] ❌ Polling falhou após ${maxAttempts} tentativas`);
    toast.warning(`Não foi possível sincronizar o status após ${maxAttempts} tentativas`);
    return false;
  }

  static async recoverPendingInstances(): Promise<{ recovered: number; errors: string[] }> {
    try {
      console.log('[Async Status] 🔧 Iniciando recuperação de instâncias pendentes');
      
      // Buscar instâncias com status 'vps_pending' ou 'initializing'
      const { data: pendingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .in('connection_status', ['vps_pending', 'initializing'])
        .eq('connection_type', 'web');

      if (error) {
        throw new Error(`Erro ao buscar instâncias pendentes: ${error.message}`);
      }

      if (!pendingInstances || pendingInstances.length === 0) {
        console.log('[Async Status] ℹ️ Nenhuma instância pendente encontrada');
        return { recovered: 0, errors: [] };
      }

      console.log(`[Async Status] 📋 Encontradas ${pendingInstances.length} instâncias pendentes`);
      
      let recovered = 0;
      const errors: string[] = [];

      // Verificar cada instância pendente
      for (const instance of pendingInstances) {
        try {
          console.log(`[Async Status] 🔄 Recuperando ${instance.instance_name}`);
          
          const result = await this.syncInstanceStatus(instance.id);
          
          if (result.success && result.status_updated) {
            recovered++;
            console.log(`[Async Status] ✅ ${instance.instance_name} recuperada`);
          } else {
            errors.push(`${instance.instance_name}: ${result.error || 'Falha na sincronização'}`);
          }
          
        } catch (instanceError: any) {
          errors.push(`${instance.instance_name}: ${instanceError.message}`);
        }
      }

      console.log(`[Async Status] 📊 Recuperação concluída: ${recovered} recuperadas, ${errors.length} erros`);
      
      if (recovered > 0) {
        toast.success(`${recovered} instâncias recuperadas com sucesso!`);
      }
      
      if (errors.length > 0) {
        console.warn('[Async Status] ⚠️ Erros na recuperação:', errors);
      }

      return { recovered, errors };

    } catch (error: any) {
      console.error('[Async Status] ❌ Erro na recuperação:', error);
      return { recovered: 0, errors: [error.message] };
    }
  }

  static async schedulePeriodicSync(intervalMs: number = 120000): Promise<() => void> {
    console.log(`[Async Status] ⏰ Agendando sincronização periódica a cada ${intervalMs}ms`);
    
    const intervalId = setInterval(async () => {
      try {
        await this.recoverPendingInstances();
      } catch (error) {
        console.error('[Async Status] ❌ Erro na sincronização periódica:', error);
      }
    }, intervalMs);

    // Retornar função para parar o agendamento
    return () => {
      console.log('[Async Status] 🛑 Parando sincronização periódica');
      clearInterval(intervalId);
    };
  }
}
