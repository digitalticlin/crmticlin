
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInstanceActionsV3 = (refreshInstances: () => Promise<void>) => {
  
  const createInstanceV3 = async (instanceName: string) => {
    try {
      console.log('[Instance Actions V3] 🚀 Criando instância V3 - PROCESSO CORRETO:', instanceName);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance_v3',
          instanceData: {
            instanceName,
            companyId: null
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V3] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao criar instância');
      }

      console.log('[Instance Actions V3] ✅ Instância criada com processo correto:', data);
      toast.success(`Instância "${instanceName}" criada com processo correto!`);

      // Refresh da lista de instâncias
      await refreshInstances();

      return {
        success: true,
        instance: data.instance,
        id: data.instance.id,
        instance_name: instanceName,
        vps_instance_id: data.instance.vps_instance_id,
        qr_code: null,
        processCorrect: true
      };

    } catch (error: any) {
      console.error('[Instance Actions V3] ❌ Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      return null;
    }
  };

  const getQRCodeV3 = async (instanceId: string) => {
    try {
      console.log('[Instance Actions V3] 📱 Buscando QR Code V3 - PROCESSO CORRETO:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_v3_async',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[Instance Actions V3] ❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('[Instance Actions V3] 📡 Resposta QR Code V3:', {
        success: data.success,
        hasQrCode: !!data.qrCode,
        source: data.source,
        waiting: data.waiting,
        normalized: data.normalized
      });

      if (data.success && data.qrCode) {
        toast.success('QR Code obtido com processo correto!');
        await refreshInstances();
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source,
          normalized: data.normalized
        };
      } else if (data.waiting) {
        console.log('[Instance Actions V3] ⏳ QR Code ainda sendo gerado');
        return {
          success: false,
          waiting: true,
          error: data.error || 'QR Code sendo gerado'
        };
      } else {
        throw new Error(data.error || 'QR Code não disponível');
      }

    } catch (error: any) {
      console.error('[Instance Actions V3] ❌ Erro ao buscar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    createInstanceV3,
    getQRCodeV3
  };
};
