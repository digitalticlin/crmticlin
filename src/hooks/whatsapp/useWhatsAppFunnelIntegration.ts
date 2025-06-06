
import { useState, useEffect } from 'react';
import { useWhatsAppDatabase } from './useWhatsAppDatabase';
import { useFunnelManagement } from '@/hooks/salesFunnel/useFunnelManagement';
import { useWhatsAppLeadSync } from './useWhatsAppLeadSync';
import { toast } from 'sonner';

export const useWhatsAppFunnelIntegration = () => {
  const [isIntegrationActive, setIsIntegrationActive] = useState(false);
  
  // Obter instância ativa do WhatsApp
  const { getActiveInstance, isHealthy } = useWhatsAppDatabase();
  const activeInstance = getActiveInstance();
  
  // Obter funil selecionado
  const { selectedFunnel } = useFunnelManagement();
  
  // Hook de sincronização de leads
  const {
    isSyncing,
    lastSyncTime,
    syncedLeadsCount,
    forceSyncLeads,
    isPollingActive
  } = useWhatsAppLeadSync({
    activeInstance,
    funnelId: selectedFunnel?.id,
    pollingInterval: 30000, // 30 segundos
    messagesLimit: 30 // 30 mensagens por chat
  });

  // Verificar se a integração pode ser ativada
  useEffect(() => {
    const canActivate = !!(
      activeInstance && 
      selectedFunnel && 
      activeInstance.connection_status === 'connected' &&
      isHealthy
    );

    if (canActivate !== isIntegrationActive) {
      setIsIntegrationActive(canActivate);
      
      if (canActivate) {
        console.log('[WhatsApp Funnel Integration] ✅ Integração ativada:', {
          instance: activeInstance.instance_name,
          funnel: selectedFunnel.name
        });
        
        toast.success(`Integração WhatsApp ↔ Funil ativada! (${activeInstance.instance_name} → ${selectedFunnel.name})`);
      } else {
        console.log('[WhatsApp Funnel Integration] ⚠️ Integração desativada');
      }
    }
  }, [activeInstance, selectedFunnel, isHealthy, isIntegrationActive]);

  return {
    // Estado da integração
    isIntegrationActive,
    isPollingActive,
    isSyncing,
    isHealthy,
    
    // Dados da sincronização
    lastSyncTime,
    syncedLeadsCount,
    
    // Instância e funil ativos
    activeInstance,
    selectedFunnel,
    
    // Ações
    forceSyncLeads
  };
};
