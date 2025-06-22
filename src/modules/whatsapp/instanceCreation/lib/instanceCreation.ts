
import { supabase } from '@/integrations/supabase/client';

export interface CreateInstanceParams {
  instanceName?: string;
  userEmail: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
}

export class InstanceCreationService {
  static async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResult> {
    try {
      console.log('[InstanceCreationService] 🚀 Criando instância:', params);
      
      // Gerar nome inteligente se não fornecido
      const intelligentName = params.instanceName || 
        params.userEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      
      // Chamar edge function para criar instância
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: intelligentName
        }
      });

      if (error) {
        console.error('[InstanceCreationService] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('[InstanceCreationService] ❌ Falha na criação:', data?.error);
        throw new Error(data?.error || 'Falha ao criar instância');
      }

      console.log('[InstanceCreationService] ✅ Instância criada:', {
        instanceName: intelligentName,
        instanceId: data.instance?.id
      });

      return {
        success: true,
        instance: data.instance
      };

    } catch (error: any) {
      console.error('[InstanceCreationService] ❌ Erro:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }
}
