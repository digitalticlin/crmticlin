
import { supabase } from '@/integrations/supabase/client';
import { EDGE_FUNCTION_CONFIG } from '../constants/config';
import type { CreateInstanceParams, CreateInstanceResult } from '../types/instanceTypes';

export class InstanceApi {
  static async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResult> {
    try {
      console.log('[InstanceApi] 🚀 Criando instância:', params);

      const { data, error } = await supabase.functions.invoke(
        EDGE_FUNCTION_CONFIG.name,
        {
          body: {
            action: EDGE_FUNCTION_CONFIG.actions.createInstance,
            instanceName: params.instanceName,
            userEmail: params.userEmail,
            companyId: params.companyId
          }
        }
      );

      if (error) {
        console.error('[InstanceApi] ❌ Erro na Edge Function:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('[InstanceApi] ❌ Falha na criação:', data?.error);
        throw new Error(data?.error || 'Falha ao criar instância');
      }

      console.log('[InstanceApi] ✅ Instância criada:', data.instance?.id);
      
      return {
        success: true,
        instance: data.instance,
        mode: data.mode || 'created'
      };

    } catch (error: any) {
      console.error('[InstanceApi] ❌ Erro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      console.log('[InstanceApi] 📱 Buscando QR Code:', instanceId);

      const { data, error } = await supabase.functions.invoke(
        EDGE_FUNCTION_CONFIG.name,
        {
          body: {
            action: EDGE_FUNCTION_CONFIG.actions.getQRCode,
            instanceId
          }
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'QR Code não disponível');

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[InstanceApi] ❌ Erro ao buscar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
