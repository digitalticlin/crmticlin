
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInstanceActionsV2 = (refreshInstances: () => Promise<void>) => {
  
  const createInstanceV2 = async (instanceName: string) => {
    try {
      console.log('[Instance Actions V2] 🚀 Criando instância V2:', instanceName);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance_v2',
          instanceData: {
            instanceName,
            companyId: null // Pode ser definido depois se necessário
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V2] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao criar instância');
      }

      console.log('[Instance Actions V2] ✅ Instância criada:', data);
      toast.success(`Instância "${instanceName}" criada com sucesso!`);

      // Refresh da lista de instâncias
      await refreshInstances();

      return {
        success: true,
        instance: data.instance,
        id: data.instance.id,
        instance_name: instanceName,
        vps_instance_id: data.instance.vps_instance_id,
        qr_code: null // Será gerado posteriormente
      };

    } catch (error: any) {
      console.error('[Instance Actions V2] ❌ Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      return null;
    }
  };

  const getQRCodeV2 = async (instanceId: string) => {
    try {
      console.log('[Instance Actions V2] 📱 Buscando QR Code V2:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_v2_async',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V2] ❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('[Instance Actions V2] 📡 Resposta QR Code V2:', {
        success: data.success,
        hasQrCode: !!data.qrCode,
        source: data.source,
        waiting: data.waiting
      });

      if (data.success && data.qrCode) {
        toast.success('QR Code obtido com sucesso!');
        await refreshInstances(); // Refresh para atualizar o estado
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source
        };
      } else if (data.waiting) {
        console.log('[Instance Actions V2] ⏳ QR Code ainda sendo gerado');
        return {
          success: false,
          waiting: true,
          error: data.error || 'QR Code sendo gerado'
        };
      } else {
        throw new Error(data.error || 'QR Code não disponível');
      }

    } catch (error: any) {
      console.error('[Instance Actions V2] ❌ Erro ao buscar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const regenerateQRCodeV2 = async (instanceId: string) => {
    try {
      console.log('[Instance Actions V2] 🔄 Regenerando QR Code V2:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'regenerate_qr_code_v2',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V2] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao regenerar QR Code');
      }

      console.log('[Instance Actions V2] ✅ QR Code sendo regenerado:', data);
      toast.success('QR Code sendo regenerado...');

      await refreshInstances();

      return {
        success: true,
        message: data.message
      };

    } catch (error: any) {
      console.error('[Instance Actions V2] ❌ Erro ao regenerar QR Code:', error);
      toast.error(`Erro ao regenerar QR Code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const configureWebhookV2 = async (instanceId: string, vpsInstanceId: string) => {
    try {
      console.log('[Instance Actions V2] 🔧 Configurando webhook V2:', { instanceId, vpsInstanceId });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'configure_webhook_v2',
          instanceData: {
            instanceId,
            vpsInstanceId
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V2] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao configurar webhook');
      }

      console.log('[Instance Actions V2] ✅ Webhook configurado:', data);
      toast.success('Webhook configurado com sucesso!');

      return {
        success: true,
        data
      };

    } catch (error: any) {
      console.error('[Instance Actions V2] ❌ Erro ao configurar webhook:', error);
      toast.error(`Erro ao configurar webhook: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    createInstanceV2,
    getQRCodeV2,
    regenerateQRCodeV2,
    configureWebhookV2
  };
};
