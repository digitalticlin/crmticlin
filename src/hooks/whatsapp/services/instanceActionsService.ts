
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { InstanceService } from '@/services/whatsapp/instanceService';
import { QRCodeService } from '@/services/whatsapp/qrCodeService';
import { StatusSyncService } from '@/services/whatsapp/statusSyncService';

export const useInstanceActions = (refreshInstances: () => Promise<void>) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createInstance = async (instanceName: string) => {
    setIsCreating(true);
    try {
      console.log(`[Instance Actions] 🚀 Criando instância: ${instanceName}`);
      
      const result = await InstanceService.createInstance(instanceName);
      
      if (result.success) {
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        await refreshInstances();
        return result;
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error(`[Instance Actions] ❌ Erro ao criar instância:`, error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    setIsDeleting(true);
    try {
      console.log(`[Instance Actions] 🗑️ Deletando instância: ${instanceId}`);
      
      const result = await InstanceService.deleteInstance(instanceId);
      
      if (result.success) {
        toast.success('Instância removida com sucesso!');
        await refreshInstances();
      } else {
        throw new Error(result.error || 'Erro ao deletar instância');
      }
    } catch (error: any) {
      console.error(`[Instance Actions] ❌ Erro ao deletar instância:`, error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log(`[Instance Actions] 🔄 Atualizando QR Code: ${instanceId}`);
      
      // CORREÇÃO: Primeiro sincronizar status com VPS
      const syncSuccess = await StatusSyncService.syncInstanceStatus(instanceId);
      
      if (syncSuccess) {
        // Recarregar dados atualizados
        await refreshInstances();
        
        // Verificar status atual no banco após sincronização
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('connection_status, web_status, vps_instance_id')
          .eq('id', instanceId)
          .single();

        // Se já está conectado, não precisa de QR Code
        if (instance?.connection_status === 'ready') {
          console.log(`[Instance Actions] ℹ️ Instância já conectada, QR Code não necessário`);
          return {
            success: true,
            qrCode: null,
            message: 'Instância já está conectada'
          };
        }
      }
      
      // Se não está conectado, tentar gerar QR Code
      const result = await QRCodeService.generateQRCode(instanceId);
      
      if (result.success) {
        await refreshInstances();
        return result;
      } else {
        throw new Error(result.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error(`[Instance Actions] ❌ Erro ao atualizar QR Code:`, error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    isCreating,
    isDeleting,
    createInstance,
    deleteInstance,
    refreshQRCode
  };
};
