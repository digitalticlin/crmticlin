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
  const { instances, setInstances } = useWhatsAppInstanceState();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { checkInstanceStatus, setupPeriodicStatusCheck, addConnectingInstance } = useWhatsAppStatusMonitor();
  const { fetchInstances } = useWhatsAppFetcher();
  const { addNewInstance } = useWhatsAppCreator(companyId);
  
  // Load WhatsApp instances when company ID is available, only once
  useEffect(() => {
    if (!companyId || loadingRef.current) return;

    const loadInstances = async () => {
      try {
        loadingRef.current = true;
        setIsLoading(prev => ({ ...prev, fetch: true }));
        await fetchInstances(companyId);
      } catch (error) {
        console.error("Error fetching WhatsApp instances:", error);
        toast.error("Could not load WhatsApp instances");
      } finally {
        setIsLoading(prev => ({ ...prev, fetch: false }));
      }
    };

    loadInstances();
  }, [companyId, fetchInstances]);

  // Checagem única do status das instâncias logo após carregá-las
  useEffect(() => {
    if (!instances.length) return;

    // Checar status de cada instância apenas uma vez ao abrir a página
    instances.forEach((instance) => {
      checkInstanceStatus(instance.id, true);
    });

    // Não retorna cleanup — nenhuma checagem periódica!
  }, [instances, checkInstanceStatus]);

  return {
    instances,
    isLoading,
    lastError,
    showQrCode,
    setShowQrCode,
    
    // Functions
    checkInstanceStatus,
    addConnectingInstance,
    connectInstance: async (instanceId: string | WhatsAppInstance): Promise<string | undefined> => {
      try {
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
