
import { useState, useEffect } from 'react';
import { useWhatsAppInstanceState } from './whatsappInstanceStore';
import { useCompanyResolver } from './useCompanyResolver';
import { useWhatsAppCreator } from './useWhatsAppCreator';
import { useInstanceLoadingState } from './core/useInstanceLoadingState';
import { useInstanceLoader } from './core/useInstanceLoader';
import { useInstanceActions } from './core/useInstanceActions';
import { useInstanceStatusCheck } from './core/useInstanceStatusCheck';

export const useWhatsAppInstances = (userEmail: string) => {
  console.log('[useWhatsAppInstanceCore] Hook initializing for:', userEmail);
  
  const { instances } = useWhatsAppInstanceState();
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  
  // Initialize loading state management
  const loadingState = useInstanceLoadingState();
  
  // Cleanup no desmonte
  useEffect(() => {
    loadingState.resetUnmounted();
    return () => {
      loadingState.markUnmounted();
      console.log('[useWhatsAppInstanceCore] Component unmounting, cleaning up');
    };
  }, []);
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { addNewInstance } = useWhatsAppCreator(companyId);
  
  console.log('[useWhatsAppInstanceCore] Company ID resolved:', companyId);
  
  // Initialize instance loader
  useInstanceLoader({ companyId, loadingState });
  
  // Initialize instance actions
  const instanceActions = useInstanceActions({ 
    instances, 
    companyId, 
    loadingState 
  });
  
  // Initialize status checking
  const statusCheck = useInstanceStatusCheck({ 
    isUnmountedRef: loadingState.isUnmountedRef 
  });

  console.log('[useWhatsAppInstanceCore] Returning hook interface with', instances.length, 'instances');

  return {
    instances,
    isLoading: loadingState.isLoading,
    lastError: loadingState.lastError,
    showQrCode,
    setShowQrCode,
    
    // Functions with additional safety checks
    checkInstanceStatus: statusCheck.checkInstanceStatus,
    addConnectingInstance: statusCheck.addConnectingInstance,
    connectInstance: instanceActions.connectInstance,
    refreshQrCode: instanceActions.refreshQrCode,
    deleteInstance: instanceActions.deleteInstance,
    addNewInstance
  };
};
