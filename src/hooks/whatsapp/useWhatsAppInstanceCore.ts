
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, WhatsAppInstance } from './whatsappInstanceStore';
import { useWhatsAppConnector } from './useWhatsAppConnector';
import { useWhatsAppDisconnector } from './useWhatsAppDisconnector';
import { useWhatsAppStatusMonitor } from './useWhatsAppStatusMonitor';
import { useCompanyResolver } from './useCompanyResolver';
import { useWhatsAppCreator } from './useWhatsAppCreator';
import { useWhatsAppFetcher } from './useWhatsAppFetcher';

export const useWhatsAppInstances = (userEmail: string) => {
  console.log('[useWhatsAppInstanceCore] Hook initializing for:', userEmail);
  
  const { instances, setInstances } = useWhatsAppInstanceState();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Refs para controlar execuções e evitar loops
  const loadingRef = useRef(false);
  const statusCheckExecutedRef = useRef(false);
  const lastStatusCheckRef = useRef<number>(0);
  const isUnmountedRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  
  // Cleanup no desmonte
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[useWhatsAppInstanceCore] Component unmounting, cleaning up');
    };
  }, []);
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { checkInstanceStatus, setupPeriodicStatusCheck, addConnectingInstance } = useWhatsAppStatusMonitor();
  const { fetchInstances } = useWhatsAppFetcher();
  const { addNewInstance } = useWhatsAppCreator(companyId);
  
  console.log('[useWhatsAppInstanceCore] Company ID resolved:', companyId);
  
  // Load WhatsApp instances when company ID is available, only once with aggressive throttling
  useEffect(() => {
    const now = Date.now();
    const minInterval = 60000; // 1 minuto entre fetches
    
    if (
      !companyId || 
      loadingRef.current || 
      isUnmountedRef.current ||
      (now - lastFetchRef.current < minInterval)
    ) {
      console.log('[useWhatsAppInstanceCore] Skipping fetch - conditions not met');
      return;
    }

    const loadInstances = async () => {
      try {
        console.log('[useWhatsAppInstanceCore] Loading instances for company:', companyId);
        loadingRef.current = true;
        lastFetchRef.current = now;
        setIsLoading(prev => ({ ...prev, fetch: true }));
        
        if (!isUnmountedRef.current) {
          await fetchInstances(companyId);
          console.log('[useWhatsAppInstanceCore] Instances loaded successfully');
        }
      } catch (error) {
        if (!isUnmountedRef.current) {
          console.error("Error fetching WhatsApp instances:", error);
          toast.error("Could not load WhatsApp instances");
        }
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(prev => ({ ...prev, fetch: false }));
        }
        loadingRef.current = false;
      }
    };

    loadInstances();
  }, [companyId, fetchInstances]);

  // Verificação de status DESABILITADA temporariamente para debug
  useEffect(() => {
    console.log('[useWhatsAppInstanceCore] Status check effect - DISABLED for debugging');
    
    // TEMPORARIAMENTE DESABILITADO
    return;
    
    /*
    if (!instances.length || statusCheckExecutedRef.current || isUnmountedRef.current) {
      console.log('[useWhatsAppInstanceCore] Skipping status check - conditions not met');
      return;
    }
    
    // Evitar múltiplas execuções em curto período
    const now = Date.now();
    const minInterval = 300000; // 5 minutos
    if (now - lastStatusCheckRef.current < minInterval) {
      console.log('[useWhatsAppInstanceCore] Status check throttled');
      return;
    }

    console.log('[useWhatsAppInstanceCore] Executing SINGLE status check for all instances');
    
    // Marcar como executado para evitar re-execução
    statusCheckExecutedRef.current = true;
    lastStatusCheckRef.current = now;

    // Reset do flag após um tempo para permitir verificações futuras se necessário
    setTimeout(() => {
      if (!isUnmountedRef.current) {
        statusCheckExecutedRef.current = false;
      }
    }, 600000); // 10 minutos
    */

  }, [instances.length, checkInstanceStatus]);

  console.log('[useWhatsAppInstanceCore] Returning hook interface with', instances.length, 'instances');

  return {
    instances,
    isLoading,
    lastError,
    showQrCode,
    setShowQrCode,
    
    // Functions with additional safety checks
    checkInstanceStatus: (instanceId: string, forceFresh?: boolean) => {
      if (isUnmountedRef.current) return;
      console.log('[useWhatsAppInstanceCore] Manual status check requested for:', instanceId);
      const now = Date.now();
      if (!forceFresh && now - lastStatusCheckRef.current < 15000) {
        console.log('[useWhatsAppInstanceCore] Manual status check throttled');
        return;
      }
      lastStatusCheckRef.current = now;
      return checkInstanceStatus(instanceId, forceFresh);
    },
    
    addConnectingInstance: (instanceId: string) => {
      if (!isUnmountedRef.current) {
        addConnectingInstance(instanceId);
      }
    },
    
    connectInstance: async (instanceId: string | WhatsAppInstance): Promise<string | undefined> => {
      if (isUnmountedRef.current) return;
      
      try {
        console.log('[useWhatsAppInstanceCore] Connect instance requested:', typeof instanceId === 'string' ? instanceId : instanceId.id);
        
        // Check if instanceId is a string or a WhatsAppInstance object
        const instanceToConnect = typeof instanceId === 'string' 
          ? instances.find(i => i.id === instanceId) 
          : instanceId;
          
        if (!instanceToConnect) {
          throw new Error("Instance not found");
        }
        
        setIsLoading(prev => ({ ...prev, [instanceToConnect.id]: true }));
        setLastError(null);
        
        const qrCodeUrl = await connectInstance(instanceToConnect);
        
        if (!isUnmountedRef.current) {
          setShowQrCode(instanceToConnect.id);
          // Mark this instance as connecting to trigger more frequent status checks
          addConnectingInstance(instanceToConnect.id);
        }
        
        return qrCodeUrl;
      } catch (error: any) {
        if (!isUnmountedRef.current) {
          console.error("Error connecting instance:", error);
          setLastError(error?.message || "Error connecting WhatsApp instance");
        }
        return undefined;
      } finally {
        if (!isUnmountedRef.current) {
          if (typeof instanceId === 'string') {
            setIsLoading(prev => ({ ...prev, [instanceId]: false }));
          } else {
            setIsLoading(prev => ({ ...prev, [instanceId.id]: false }));
          }
        }
      }
    },
    
    refreshQrCode: async (instanceId: string) => {
      if (isUnmountedRef.current) return;
      
      try {
        console.log('[useWhatsAppInstanceCore] Refresh QR code requested for:', instanceId);
        setIsLoading(prev => ({ ...prev, [instanceId]: true }));
        setLastError(null);
        
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          throw new Error("Instance not found");
        }
        
        // Using connectInstance instead of refreshQrCode to get a completely new code
        await connectInstance(instance);
        
        if (!isUnmountedRef.current) {
          setShowQrCode(instanceId);
          // Mark this instance for priority status checking
          addConnectingInstance(instanceId);
        }
      } catch (error: any) {
        if (!isUnmountedRef.current) {
          console.error("Error updating QR code:", error);
          setLastError(error?.message || "Error updating QR code");
        }
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(prev => ({ ...prev, [instanceId]: false }));
        }
      }
    },
    
    deleteInstance: async (instanceId: string) => {
      if (isUnmountedRef.current) return;
      
      try {
        console.log('[useWhatsAppInstanceCore] Delete instance requested for:', instanceId);
        setIsLoading(prev => ({ ...prev, [instanceId]: true }));
        setLastError(null);

        // Remove imediatamente do estado local antes de qualquer requisição
        setInstances(instances.filter(i => i.id !== instanceId));

        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          // Caso não exista mais, já retorna
          return;
        }

        // Tenta apagar na Evolution e Supabase
        await deleteInstance(instance);

        // Força refetch para garantir sync do backend
        if (companyId && !isUnmountedRef.current) {
          await fetchInstances(companyId);
        }

        if (!isUnmountedRef.current) {
          toast.success("WhatsApp successfully disconnected!");
        }
      } catch (error: any) {
        // Mesmo se ocorrer erro, NÃO repopula o card no estado/local.
        if (!isUnmountedRef.current) {
          console.error("Error deleting instance:", error);
          setLastError(error?.message || "Error deleting WhatsApp instance");
        }
        // Não faz mais nada: o card já saiu da interface
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(prev => ({ ...prev, [instanceId]: false }));
        }
      }
    },
    
    addNewInstance
  };
};
