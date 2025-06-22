
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
  operationId?: string;
  intelligent_name?: string;
  fallback_used?: boolean;
  mode?: string;
}

export const useWhatsAppWebInstances = () => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInstances = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('[Hook] ⚠️ Usuário não autenticado');
        setInstances([]);
        return;
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Hook] ❌ Erro ao carregar instâncias:', error);
        toast.error('Erro ao carregar instâncias');
        return;
      }

      console.log('[Hook] ✅ Instâncias carregadas:', data?.length || 0);
      setInstances(data || []);
    } catch (error: any) {
      console.error('[Hook] ❌ Erro geral:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ Deletando instância:', instanceId);
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId)
        .eq('created_by_user_id', user?.id);

      if (error) throw error;

      toast.success('Instância deletada com sucesso!');
      await loadInstances();
    } catch (error: any) {
      console.error('[Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 Refresh QR via QRCodeApi:', instanceId);
      
      // Esta função será integrada com o novo sistema QR
      return {
        success: false,
        waiting: true,
        message: 'Use o novo sistema QR Code'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao buscar QR Code'
      };
    }
  };

  return {
    instances,
    isLoading,
    deleteInstance,
    refreshQRCode,
    loadInstances
  };
};
