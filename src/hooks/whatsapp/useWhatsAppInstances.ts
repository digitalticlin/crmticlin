
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppInstanceState, WhatsAppInstance } from "./whatsappInstanceStore";
import { useWhatsAppConnector } from "./useWhatsAppConnector";
import { useWhatsAppDisconnector } from "./useWhatsAppDisconnector";
import { useCompanyResolver } from "./useCompanyResolver";
import { useWhatsAppStatusMonitor } from "./useWhatsAppStatusMonitor";
import { useWhatsAppCreator } from "./useWhatsAppCreator";

const STATUS_CHECK_INTERVAL = 15000; // Check status every 15 seconds

export const useWhatsAppInstances = (userEmail: string) => {
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { instances, setInstances } = useWhatsAppInstanceState();
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { checkInstanceStatus, setupPeriodicStatusCheck } = useWhatsAppStatusMonitor();
  const { 
    instanceName, 
    setInstanceName,
    lastError, 
    setLastError,
    addNewInstance
  } = useWhatsAppCreator(companyId);

  // Load WhatsApp instances
  useEffect(() => {
    const fetchWhatsAppInstances = async () => {
      if (!companyId) return;
      
      try {
        setIsLoading(prev => ({ ...prev, fetch: true }));
        
        // Fetch WhatsApp numbers for company
        const { data: whatsappNumbers, error } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching WhatsApp numbers:", error);
          toast.error("Could not load WhatsApp numbers");
          return;
        }
        
        // Convert to instance format
        const fetchedInstances: WhatsAppInstance[] = whatsappNumbers.map(item => ({
          id: item.id,
          instanceName: item.instance_name,
          connected: item.status === 'connected',
          qrCodeUrl: item.qr_code || undefined,
          phoneNumber: item.phone || undefined,
        }));
        
        setInstances(fetchedInstances);
        
        // Check status of all instances after loading once, not repeatedly
        if (fetchedInstances.length > 0) {
          // Initial status check with a small delay between each instance
          fetchedInstances.forEach((instance, index) => {
            setTimeout(() => {
              checkInstanceStatus(instance.id, instance.instanceName);
            }, index * 1000); // 1 second delay between each instance check
          });
        }
      } catch (error) {
        console.error("Error fetching WhatsApp instances:", error);
        toast.error("An error occurred while loading WhatsApp instances");
      } finally {
        setIsLoading(prev => ({ ...prev, fetch: false }));
      }
    };
    
    fetchWhatsAppInstances();
  }, [companyId, setInstances, checkInstanceStatus]);

  // Periodically check instance status
  useEffect(() => {
    if (!instances.length) return;
    
    // Setup periodic checks and store cleanup function
    const cleanup = setupPeriodicStatusCheck(instances, STATUS_CHECK_INTERVAL);
    
    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, [instances, setupPeriodicStatusCheck]);
  
  // Handle connecting to an instance with proper type checks
  const handleConnectInstance = async (instanceId: string) => {
    try {
      // Find the instance from the instances array
      const instanceToConnect = instances.find(instance => instance.id === instanceId);
      if (!instanceToConnect) {
        throw new Error("Instance not found");
      }
      
      await connectInstance(instanceToConnect);
    } catch (error) {
      console.error("Error connecting instance:", error);
    }
  };

  return {
    instances,
    isLoading,
    instanceName,
    setInstanceName,
    showQrCode,
    setShowQrCode,
    lastError,
    setLastError,
    
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
        await refreshQrCode(instance);
        setShowQrCode(instanceId);
      } catch (error: any) {
        console.error("Error updating QR code:", error);
        setLastError(error?.message || "Error updating QR code");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    deleteInstance,
    addNewInstance,
    handleConnectInstance
  };
};
