
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
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { checkInstanceStatus, setupPeriodicStatusCheck } = useWhatsAppStatusMonitor();
  const { fetchInstances } = useWhatsAppFetcher();
  const { addNewInstance } = useWhatsAppCreator(companyId);
  
  // Load WhatsApp instances when company ID is available
  useEffect(() => {
    if (!companyId) return;
    
    const loadInstances = async () => {
      try {
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

  // Initial status check for all instances after loading
  useEffect(() => {
    if (!instances.length) return;
    
    // Create cleanup function for periodic status check
    const cleanupStatusCheck = setupPeriodicStatusCheck(instances);
    
    return () => {
      if (cleanupStatusCheck) cleanupStatusCheck();
    };
  }, [instances, setupPeriodicStatusCheck]);
  
  return {
    instances,
    isLoading,
    lastError,
    showQrCode,
    setShowQrCode,
    
    // Functions
    checkInstanceStatus,
    connectInstance: async (instanceId: string | WhatsAppInstance) => {
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
        return qrCodeUrl;
      } catch (error: any) {
        console.error("Error connecting instance:", error);
        setLastError(error?.message || "Error connecting WhatsApp instance");
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
        
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          throw new Error("Instance not found");
        }
        
        await deleteInstance(instance);
        
        // Remove from local state after success
        setInstances(instances.filter(i => i.id !== instanceId));
        toast.success("WhatsApp successfully disconnected!");
      } catch (error: any) {
        console.error("Error deleting instance:", error);
        setLastError(error?.message || "Error deleting WhatsApp instance");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    addNewInstance
  };
};
