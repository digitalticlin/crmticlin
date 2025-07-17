import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // 🚀 IMPORTAR CONTEXTO DE AUTH

export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url?: string;
  vps_instance_id?: string;
  web_status?: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  profile_pic_url?: string;
  date_connected?: string;
  date_disconnected?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  created_by_user_id?: string;
}

export const useWhatsAppDatabase = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🚀 CORREÇÃO CRÍTICA: Obter usuário autenticado
  const { user } = useAuth();

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 🚨 CORREÇÃO CRÍTICA: Só buscar instâncias do usuário logado
      if (!user?.id) {
        console.warn('[WhatsApp Database] ⚠️ Usuário não autenticado, não buscando instâncias');
        setInstances([]);
        return;
      }

      console.log('[WhatsApp Database] 🔍 Buscando instâncias para usuário:', {
        userId: user.id,
        userEmail: user.email
      });

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .eq('created_by_user_id', user.id) // 🚀 CORREÇÃO CRÍTICA: Filtrar por usuário
        .in('connection_status', ['connected', 'ready', 'connecting', 'disconnected'])
        .order('connection_status', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const instancesData = data || [];
      
      console.log('[WhatsApp Database] ✅ Instâncias carregadas:', {
        userId: user.id,
        userEmail: user.email,
        totalInstances: instancesData.length,
        connectedInstances: instancesData.filter(i => 
          i.connection_status === 'connected' || i.connection_status === 'ready'
        ).length,
        instances: instancesData.map(i => ({
          id: i.id,
          name: i.instance_name,
          status: i.connection_status,
          owner: i.created_by_user_id
        }))
      });
      
      setInstances(instancesData);
      
    } catch (error: any) {
      console.error('[WhatsApp Database] ❌ Erro ao carregar instâncias:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 CORREÇÃO: getActiveInstance agora só retorna instâncias do usuário logado
  const getActiveInstance = useMemo(() => {
    return (): WhatsAppInstance | null => {
      const activeInstance = instances.find(i => 
        i.connection_status === 'connected' || 
        i.connection_status === 'ready'
      );
      
      if (activeInstance && user?.id) {
        console.log('[WhatsApp Database] 🎯 Instância ativa encontrada:', {
          instanceId: activeInstance.id,
          instanceName: activeInstance.instance_name,
          status: activeInstance.connection_status,
          owner: activeInstance.created_by_user_id,
          currentUser: user.id,
          isCorrectOwner: activeInstance.created_by_user_id === user.id
        });
        
        // 🚀 SEGURANÇA EXTRA: Verificar se a instância pertence ao usuário
        if (activeInstance.created_by_user_id !== user.id) {
          console.error('[WhatsApp Database] 🚨 ERRO DE SEGURANÇA: Instância não pertence ao usuário!', {
            instanceOwner: activeInstance.created_by_user_id,
            currentUser: user.id,
            instanceName: activeInstance.instance_name
          });
          return null;
        }
      }
      
      return activeInstance || null;
    };
  }, [instances, user?.id]);

  // 🚀 NOVA FUNÇÃO: Buscar instância específica de um lead
  const getInstanceForLead = useMemo(() => {
    return (leadId: string, whatsappNumberId?: string): WhatsAppInstance | null => {
      if (!user?.id) return null;
      
      // Se leadId tem whatsappNumberId, buscar instância específica
      if (whatsappNumberId) {
        const specificInstance = instances.find(i => 
          i.id === whatsappNumberId && 
          i.created_by_user_id === user.id &&
          (i.connection_status === 'connected' || i.connection_status === 'ready')
        );
        
        if (specificInstance) {
          console.log('[WhatsApp Database] 🎯 Instância específica para lead:', {
            leadId,
            instanceId: specificInstance.id,
            instanceName: specificInstance.instance_name,
            status: specificInstance.connection_status
          });
          return specificInstance;
        }
      }
      
      // Fallback: usar instância ativa do usuário
      return getActiveInstance();
    };
  }, [instances, user?.id, getActiveInstance]);

  const { connectedInstances, totalInstances, healthScore, isHealthy } = useMemo(() => {
    const connected = instances.filter(i => 
      i.connection_status === 'connected' || i.connection_status === 'ready'
    ).length;
    
    const total = instances.length;
    const score = total === 0 ? 0 : Math.round((connected / total) * 100);
    const healthy = score >= 70;

    return {
      connectedInstances: connected,
      totalInstances: total,
      healthScore: score,
      isHealthy: healthy
    };
  }, [instances]);

  const refetch = () => {
    fetchInstances();
  };

  // 🚀 CORREÇÃO: Só buscar quando há usuário autenticado
  useEffect(() => {
    if (user?.id) {
      fetchInstances();
    } else {
      setInstances([]);
      setIsLoading(false);
    }
  }, [user?.id]); // 🚀 Recarregar quando usuário mudar

  // 🚀 CORREÇÃO: Subscription filtrada por usuário
  useEffect(() => {
    if (!user?.id) return;

    console.log('[WhatsApp Database] 📡 Configurando realtime para usuário:', user.id);

    const channel = supabase
      .channel(`whatsapp_instances_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro por usuário
        },
        (payload) => {
          console.log('[WhatsApp Database] 📱 Realtime update para usuário:', {
            userId: user.id,
            event: payload.eventType,
            instanceId: (payload.new as any)?.id || (payload.old as any)?.id
          });
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Database] 🔌 Removendo subscription para usuário:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // 🚀 Reconfigurar quando usuário mudar

  return {
    instances,
    isLoading,
    error,
    getActiveInstance,
    getInstanceForLead, // 🚀 NOVA FUNÇÃO para leads específicos
    connectedInstances,
    totalInstances,
    healthScore,
    isHealthy,
    refetch
  };
};
