
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
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { checkInstanceStatus, setupPeriodicStatusCheck, addConnectingInstance } = useWhatsAppStatusMonitor();
  const { fetchInstances } = useWhatsAppFetcher();
  const { addNewInstance } = useWhatsAppCreator(companyId);
  
  console.log('[useWhatsAppInstanceCore] Company ID resolved:', companyId);
  
  // Load WhatsApp instances when company ID is available, only once
  useEffect(() => {
    if (!companyId || loadingRef.current) {
      console.log('[useWhatsAppInstanceCore] Skipping fetch - no companyId or already loading');
      return;
    }

    const loadInstances = async () => {
      try {
        console.log('[useWhatsAppInstanceCore] Loading instances for company:', companyId);
        loadingRef.current = true;
        setIsLoading(prev => ({ ...prev, fetch: true }));
        await fetchInstances(companyId);
        console.log('[useWhatsAppInstanceCore] Instances loaded successfully');
      } catch (error) {
        console.error("Error fetching WhatsApp instances:", error);
        toast.error("Could not load WhatsApp instances");
      } finally {
        setIsLoading(prev => ({ ...prev, fetch: false }));
      }
    };

    loadInstances();
  }, [companyId, fetchInstances]);

  // Verificação de status ÚNICA e controlada - DESABILITADA temporariamente para debug
  useEffect(() => {
    if (!instances.length || statusCheckExecutedRef.current) {
      console.log('[useWhatsAppInstanceCore] Skipping status check - no instances or already executed');
      return;
    }
    
    // Evitar múltiplas execuções em curto período
    const now = Date.now();
    const minInterval = 60000; // Aumentado para 1 minuto
    if (now - lastStatusCheckRef.current < minInterval) {
      console.log('[useWhatsAppInstanceCore] Status check throttled - too soon:', now - lastStatusCheckRef.current, 'ms ago');
      return;
    }

    console.log('[useWhatsAppInstanceCore] TEMPORARY: Status check DISABLED for debugging');
    
    // TEMPORARIAMENTE DESABILITADO PARA DEBUG
    // console.log('[useWhatsAppInstanceCore] Executing SINGLE status check for all instances');
    
    // Marcar como executado para evitar re-execução
    statusCheckExecutedRef.current = true;
    lastStatusCheckRef.current = now;

    // Reset do flag após um tempo para permitir verificações futuras se necessário
    setTimeout(() => {
      statusCheckExecutedRef.current = false;
    }, 600000); // 10 minutos

  }, [instances.length, checkInstanceStatus]);

  console.log('[useWhatsAppInstanceCore] Returning hook interface with', instances.length, 'instances');

  return {
    instances,
    isLoading,
    lastError,
    showQrCode,
    setShowQrCode,
    
    // Functions
    checkInstanceStatus: (instanceId: string, forceFresh?: boolean) => {
      console.log('[useWhatsAppInstanceCore] Manual status check requested for:', instanceId);
      const now = Date.now();
      if (!forceFresh && now - lastStatusCheckRef.current < 15000) {
        console.log('[useWhatsAppInstanceCore] Manual status check throttled');
        return;
      }
      lastStatusCheckRef.current = now;
      return checkInstanceStatus(instanceId, forceFresh);
    },
    addConnectingInstance,
    connectInstance: async (instanceId: string | WhatsAppInstance): Promise<string | undefined> => {
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
        setShowQrCode(instanceToConnect.id);
        
        // Mark this instance as connecting to trigger more frequent status checks
        addConnectingInstance(instanceToConnect.id);
        
        return qrCodeUrl;
      } catch (error: any) {
        console.error("Error connecting instance:", error);
        setLastError(error?.message || "Error connecting WhatsApp instance");
        return undefined;
      } finally {
        if (typeof instanceId === 'string') {
          setIsLoading(prev => ({ ...prev, [instanceId]: false }));
        } else {
          setIsLoading(prev => ({ ...prev, [instanceId.id]: false }));
        }
      }
    },
    
    refreshQrCode: async (instanceId: string) => {
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
        setShowQrCode(instanceId);
        
        // Mark this instance for priority status checking
        addConnectingInstance(instanceId);
      } catch (error: any) {
        console.error("Error updating QR code:", error);
        setLastError(error?.message || "Error updating QR code");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    deleteInstance: async (instanceId: string) => {
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
        if (companyId) {
          await fetchInstances(companyId);
        }

        toast.success("WhatsApp successfully disconnected!");
      } catch (error: any) {
        // Mesmo se ocorrer erro, NÃO repopula o card no estado/local.
        console.error("Error deleting instance:", error);
        setLastError(error?.message || "Error deleting WhatsApp instance");
        // Não faz mais nada: o card já saiu da interface
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    addNewInstance
  };
};
