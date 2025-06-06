
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (instances: WhatsAppWebInstance[], fetchInstances: () => Promise<void>) => {
  // CORREÇÃO CRÍTICA: Função melhorada para refresh de QR Code com validação completa
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Instance QR Code] 🔄 CORREÇÃO CRÍTICA - Atualizando QR Code via backend:', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      console.log('[Instance QR Code] 📋 CORREÇÃO CRÍTICA - Instância encontrada:', {
        instanceId: instance.id,
        vpsInstanceId: instance.vps_instance_id,
        instanceName: instance.instance_name,
        currentQRCode: !!instance.qr_code
      });

      // CORREÇÃO CRÍTICA: Usar get_qr_code_async com logs detalhados
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_async',
          instanceData: {
            instanceId: instanceId
          }
        }
      });

      if (error) {
        console.error('[Instance QR Code] ❌ CORREÇÃO CRÍTICA - Erro do Supabase:', error);
        throw error;
      }

      console.log('[Instance QR Code] 📊 CORREÇÃO CRÍTICA - Resposta do backend:', {
        success: data.success,
        hasQRCode: !!data.qrCode,
        waiting: data.waiting,
        source: data.source,
        savedToDatabase: data.savedToDatabase
      });

      if (!data.success) {
        if (data.waiting) {
          console.log('[Instance QR Code] ⏳ CORREÇÃO CRÍTICA - QR Code ainda sendo gerado');
          toast.info('QR Code ainda está sendo gerado, aguarde...');
          return {
            success: false,
            waiting: true,
            error: 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data.error || 'Falha ao atualizar QR Code');
      }

      // CORREÇÃO CRÍTICA: Verificar se foi salvo no banco
      if (data.savedToDatabase === false) {
        console.warn('[Instance QR Code] ⚠️ CORREÇÃO CRÍTICA - QR Code não foi salvo no banco');
        toast.warning('QR Code obtido mas não foi salvo automaticamente');
      } else {
        console.log('[Instance QR Code] ✅ CORREÇÃO CRÍTICA - QR Code salvo no banco com sucesso');
        toast.success('QR Code atualizado e salvo no banco!');
      }

      // CORREÇÃO CRÍTICA: Sempre recarregar instâncias após obter QR Code
      console.log('[Instance QR Code] 🔄 CORREÇÃO CRÍTICA - Recarregando lista de instâncias...');
      await fetchInstances();

      return {
        success: true,
        qrCode: data.qrCode,
        savedToDatabase: data.savedToDatabase
      };

    } catch (error: any) {
      console.error('[Instance QR Code] ❌ CORREÇÃO CRÍTICA - Erro ao atualizar QR Code:', error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }, [instances, fetchInstances]);

  return {
    refreshInstanceQRCode
  };
};
