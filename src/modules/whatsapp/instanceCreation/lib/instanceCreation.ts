
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreateInstanceParams {
  instanceName?: string;
  userEmail?: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
  mode?: string;
}

export class InstanceCreationService {
  static async createInstance(params: CreateInstanceParams = {}): Promise<CreateInstanceResult> {
    try {
      console.log('[InstanceCreation] 🚀 Criando instância via whatsapp_instance_manager');
      
      // Gerar nome inteligente se não fornecido
      let instanceName = params.instanceName;
      if (!instanceName && params.userEmail) {
        instanceName = params.userEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      }
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName || 'default'
        }
      });

      if (error) {
        console.error('[InstanceCreation] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('[InstanceCreation] ❌ Falha na criação:', data?.error);
        throw new Error(data?.error || 'Falha ao criar instância');
      }

      console.log('[InstanceCreation] ✅ Instância criada com sucesso:', data.instance?.id);
      
      return {
        success: true,
        instance: data.instance,
        mode: data.mode || 'created'
      };

    } catch (error: any) {
      console.error('[InstanceCreation] ❌ Erro ao criar instância:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
