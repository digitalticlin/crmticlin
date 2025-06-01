
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "./whatsappWebService";
import { toast } from "sonner";

export interface RecoveryStatus {
  phase: string;
  step: string;
  progress: number;
  success: boolean;
  error?: string;
  instanceId?: string;
  qrCode?: string;
}

export class WhatsAppRecoveryService {
  static async executeFullRecovery(): Promise<RecoveryStatus> {
    console.log('[Recovery] Iniciando recuperação completa do sistema WhatsApp');
    
    try {
      // Fase 1: Verificar conectividade
      const connectivityStatus = await this.checkConnectivity();
      if (!connectivityStatus.success) {
        return connectivityStatus;
      }

      // Fase 2: Obter dados da empresa
      const companyData = await this.getCompanyData();
      if (!companyData.success) {
        return companyData;
      }

      // Fase 3: Criar nova instância
      const instanceCreation = await this.createNewInstance(companyData.companyId!);
      if (!instanceCreation.success) {
        return instanceCreation;
      }

      // Fase 4: Configurar monitoramento
      await this.setupMonitoring(instanceCreation.instanceId!);

      return {
        phase: "Concluído",
        step: "Sistema restaurado com sucesso",
        progress: 100,
        success: true,
        instanceId: instanceCreation.instanceId,
        qrCode: instanceCreation.qrCode
      };

    } catch (error) {
      console.error('[Recovery] Erro na recuperação:', error);
      return {
        phase: "Erro",
        step: "Falha na recuperação",
        progress: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private static async checkConnectivity(): Promise<RecoveryStatus> {
    console.log('[Recovery] Fase 1: Verificando conectividade');
    
    try {
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (!result.success) {
        return {
          phase: "Conectividade",
          step: "Servidor VPS inacessível",
          progress: 10,
          success: false,
          error: "VPS não está respondendo"
        };
      }

      return {
        phase: "Conectividade",
        step: "VPS online e funcional",
        progress: 25,
        success: true
      };

    } catch (error) {
      return {
        phase: "Conectividade",
        step: "Erro ao verificar VPS",
        progress: 10,
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conectividade'
      };
    }
  }

  private static async getCompanyData(): Promise<RecoveryStatus & { companyId?: string }> {
    console.log('[Recovery] Fase 2: Obtendo dados da empresa');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return {
          phase: "Autenticação",
          step: "Usuário não autenticado",
          progress: 25,
          success: false,
          error: "Falha na autenticação"
        };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profile?.company_id) {
        return {
          phase: "Empresa",
          step: "Empresa não encontrada",
          progress: 30,
          success: false,
          error: "Usuário não está associado a uma empresa"
        };
      }

      return {
        phase: "Empresa",
        step: "Dados da empresa obtidos",
        progress: 50,
        success: true,
        companyId: profile.company_id
      };

    } catch (error) {
      return {
        phase: "Empresa",
        step: "Erro ao obter dados",
        progress: 30,
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno'
      };
    }
  }

  private static async createNewInstance(companyId: string): Promise<RecoveryStatus & { instanceId?: string; qrCode?: string }> {
    console.log('[Recovery] Fase 3: Criando nova instância WhatsApp');

    try {
      // Gerar nome único para instância
      const instanceName = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      console.log('[Recovery] Criando instância com nome:', instanceName);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName,
            serverUrl: 'http://31.97.24.222:3001'
          }
        }
      });

      if (error) {
        console.error('[Recovery] Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('[Recovery] Falha na criação:', data.error);
        throw new Error(data.error || 'Falha ao criar instância');
      }

      console.log('[Recovery] Instância criada com sucesso:', data.instance);

      return {
        phase: "Criação",
        step: "Instância criada com sucesso",
        progress: 75,
        success: true,
        instanceId: data.instance.id,
        qrCode: data.instance.qr_code
      };

    } catch (error) {
      console.error('[Recovery] Erro na criação da instância:', error);
      return {
        phase: "Criação",
        step: "Falha ao criar instância",
        progress: 60,
        success: false,
        error: error instanceof Error ? error.message : 'Erro na criação'
      };
    }
  }

  private static async setupMonitoring(instanceId: string): Promise<void> {
    console.log('[Recovery] Fase 4: Configurando monitoramento para instância:', instanceId);

    // Configurar monitoramento em tempo real
    const channel = supabase
      .channel(`recovery-monitoring-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${instanceId}`
        },
        (payload) => {
          console.log('[Recovery] Mudança detectada na instância:', payload);
          
          const newData = payload.new as any;
          if (newData?.web_status === 'ready' || newData?.web_status === 'open') {
            toast.success('🎉 WhatsApp conectado com sucesso!');
          }
        }
      )
      .subscribe();

    // Cleanup após 10 minutos
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('[Recovery] Monitoramento finalizado');
    }, 600000);
  }

  static async quickSync(): Promise<boolean> {
    console.log('[Recovery] Executando sincronização rápida');

    try {
      const { data, error } = await supabase.functions.invoke('sync_all_whatsapp_instances', {
        body: {}
      });

      if (error) {
        console.error('[Recovery] Erro na sincronização:', error);
        return false;
      }

      if (data?.success) {
        console.log('[Recovery] Sincronização concluída:', data.summary);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Recovery] Erro na sincronização rápida:', error);
      return false;
    }
  }
}
