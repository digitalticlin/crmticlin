import { supabase } from "@/integrations/supabase/client";

export class WhatsAppWebService {
  static async createInstance(instanceName: string): Promise<{
    success: boolean;
    instance?: any;
    qrCode?: string;
    error?: string;
    shouldShowModal?: boolean;
  }> {
    try {
      console.log(`[WhatsApp Web Service] 🚀 HÍBRIDO: Criando instância: ${instanceName}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // HÍBRIDO: Usar whatsapp_instance_manager para criação assíncrona
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      console.log(`[WhatsApp Web Service] 📥 HÍBRIDO: Resposta:`, {
        success: data?.success,
        hasInstance: !!(data?.instance),
        error: data?.error || error?.message
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ HÍBRIDO: Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (data.success && data.instance) {
        console.log(`[WhatsApp Web Service] ✅ HÍBRIDO: Instância criada - iniciando polling:`, data.instance.id);
        
        return {
          success: true,
          instance: data.instance,
          shouldShowModal: true, // HÍBRIDO: Sinalizar para abrir modal
          qrCode: null // QR será obtido via polling
        };
      }

      throw new Error(data.error || 'Erro desconhecido ao criar instância');

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ HÍBRIDO: Erro geral:`, error);
      return {
        success: false,
        error: error.message || 'Erro ao criar instância'
      };
    }
  }

  static async getInstances(): Promise<any[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WhatsApp Web Service] ❌ Erro ao buscar instâncias:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Erro geral ao buscar instâncias:', error);
      return [];
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao deletar instância');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[WhatsApp Web Service] ❌ Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }
}
