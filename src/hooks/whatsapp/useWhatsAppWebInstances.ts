
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance, WhatsAppConnectionStatus } from '@/types/whatsapp';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadInstances = useCallback(async () => {
    try {
      console.log('[WhatsApp Web Instances] 🔄 Carregando instâncias...');
      
      if (!user?.id) {
        console.log('[WhatsApp Web Instances] ⚠️ Usuário não autenticado');
        setInstances([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .eq('created_by_user_id', user.id) // 🔒 FILTRO MULTI-TENANT ADICIONADO
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WhatsApp Web Instances] ❌ Erro ao carregar:', error);
        throw error;
      }

      console.log(`[WhatsApp Web Instances] ✅ ${data?.length || 0} instâncias carregadas para usuário: ${user.email}`);
      
      // Converter os dados do banco para o tipo correto
      const typedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        ...instance,
        connection_status: instance.connection_status as WhatsAppConnectionStatus
      }));
      
      setInstances(typedInstances);
    } catch (error: any) {
      console.error('[WhatsApp Web Instances] ❌ Erro geral:', error);
      toast.error(`Erro ao carregar instâncias: ${error.message}`);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log(`[WhatsApp Web Instances] 🗑️ Deletando instância: ${instanceId}`);
      
      // Remover imediatamente da UI para feedback instantâneo
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: { instanceId }
      });

      if (error) throw error;

      if (data?.success) {
        console.log(`[WhatsApp Web Instances] ✅ Instância deletada: ${instanceId}`);
        toast.success('Instância deletada com sucesso!');
        // Recarregar para garantir consistência
        await loadInstances();
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao deletar');
      }
    } catch (error: any) {
      console.error(`[WhatsApp Web Instances] ❌ Erro ao deletar:`, error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
      // Recarregar em caso de erro para restaurar estado
      await loadInstances();
    }
  }, [loadInstances]);

  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log(`[WhatsApp Web Instances] 🔄 Atualizando QR Code: ${instanceId}`);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_qr', {
        body: { instanceId }
      });

      if (error) throw error;

      if (data?.success) {
        console.log(`[WhatsApp Web Instances] ✅ QR Code atualizado: ${instanceId}`);
        toast.success('QR Code atualizado!');
        // Recarregar instâncias para mostrar QR atualizado
        await loadInstances();
        return data;
      } else {
        throw new Error(data?.error || 'Erro ao atualizar QR Code');
      }
    } catch (error: any) {
      console.error(`[WhatsApp Web Instances] ❌ Erro ao atualizar QR:`, error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return null;
    }
  }, [loadInstances]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  return {
    instances,
    isLoading,
    loadInstances,
    deleteInstance,
    refreshQRCode
  };
};
