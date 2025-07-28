
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseNewLeadIntegrationProps {
  funnelId: string;
  onNewLead: (lead: any) => void;
}

export const useNewLeadIntegration = ({
  funnelId,
  onNewLead
}: UseNewLeadIntegrationProps) => {
  const { user } = useAuth();

  const handleNewLead = useCallback((payload: any) => {
    console.log('[New Lead Integration] 📨 Novo lead recebido:', payload);
    
    const lead = payload.new;
    
    // Verificar se o lead pertence ao funil correto
    if (lead.funnel_id === funnelId) {
      onNewLead(lead);
    }
  }, [funnelId, onNewLead]);

  useEffect(() => {
    if (!user?.id || !funnelId) return;

    console.log('[New Lead Integration] 🔌 Configurando escuta para novos leads');

    const channel = supabase
      .channel(`new-leads-${funnelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `funnel_id=eq.${funnelId}`
        },
        handleNewLead
      )
      .subscribe();

    return () => {
      console.log('[New Lead Integration] 🧹 Limpando escuta de novos leads');
      supabase.removeChannel(channel);
    };
  }, [user?.id, funnelId, handleNewLead]);

  return {
    // Pode retornar status ou métodos se necessário
  };
};
