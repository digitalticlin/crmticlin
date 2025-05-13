
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, WhatsAppInstance } from './whatsappInstanceStore';
import { useWhatsAppConnector } from './useWhatsAppConnector';
import { useWhatsAppDisconnector } from './useWhatsAppDisconnector';
import { useCompanyResolver } from './useCompanyResolver';
import { evolutionApiService } from '@/services/evolution-api';

export const useWhatsAppInstances = (userEmail: string) => {
  const { instances, setInstances } = useWhatsAppInstanceState();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  
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
              checkInstanceStatus(instance.id);
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
  }, [companyId, setInstances]);

  // Check instance status and update in database with throttling
  const checkInstanceStatus = async (instanceId: string) => {
    // Prevent concurrent checks for the same instance
    if (instanceCheckInProgress.current[instanceId]) {
      console.log(`Status check already in progress for instance ${instanceId}, skipping`);
      return;
    }
    
    // Throttle requests - only check if 5 seconds have passed since last check
    const now = Date.now();
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    if (now - lastCheck < 5000) {
      console.log(`Throttling status check for instance ${instanceId} - too soon`);
      return;
    }
    
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance || !instance.instanceName) return;
      
      console.log(`Checking status of instance: ${instance.instanceName}`);
      
      // Mark this instance as being checked
      instanceCheckInProgress.current[instanceId] = true;
      lastCheckTime.current[instanceId] = now;
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      
      // Get current instance status via Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      console.log(`Status of instance ${instance.instanceName}: ${status}`);
      
      // Update status in database
      if (instanceId !== "1") {
        const { error } = await supabase
          .from('whatsapp_numbers')
          .update({ status })
          .eq('id', instanceId);
          
        if (error) {
          console.error("Error updating status in database:", error);
        }
        
        // If the instance is now connected, get the phone number
        if (status === 'connected') {
          try {
            // Here we would implement a method to get the phone number from the Evolution API
            // For now we'll just use a placeholder
            const phoneNumber = instance.phoneNumber || "Connected";
            
            // Update phone number in database
            const { error: phoneError } = await supabase
              .from('whatsapp_numbers')
              .update({ phone: phoneNumber })
              .eq('id', instanceId);
              
            if (phoneError) {
              console.error("Error updating phone number in database:", phoneError);
            }
          } catch (phoneError) {
            console.error("Error getting phone number:", phoneError);
          }
        }
      }
      
      // Update local state
      const updatedInstances = instances.map(i => {
        if (i.id === instanceId) {
          return { 
            ...i, 
            connected: status === 'connected'
          };
        }
        return i;
      });
      
      setInstances(updatedInstances);
      
      return status;
    } catch (error) {
      console.error(`Error checking status of instance ${instanceId}:`, error);
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      // Release the lock after a short delay to prevent immediate rechecking
      setTimeout(() => {
        instanceCheckInProgress.current[instanceId] = false;
      }, 500);
    }
  };
  
  // Add new instance function with additional checks to prevent duplicates
  const addNewInstance = async (username: string) => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    
    if (!companyId) {
      toast.error("No company associated with user");
      return;
    }

    // Check if we already have an instance with this name in our local state
    const existingLocalInstance = instances.find(
      i => i.instanceName.toLowerCase() === username.toLowerCase() ||
           i.instanceName.toLowerCase().startsWith(username.toLowerCase())
    );
    
    if (existingLocalInstance) {
      console.log(`Instance with similar name already exists locally: ${existingLocalInstance.instanceName}`);
      toast.info("An instance with this name already exists. Modifying name to create a new one.");
      
      // Append a number to make it unique
      username = `${username}1`;
    }
    
    try {
      // Create new local instance
      const newInstanceId = crypto.randomUUID();
      const newInstance: WhatsAppInstance = {
        id: newInstanceId,
        instanceName: username.trim(),
        connected: false,
      };
      
      // Add to local state
      setInstances([newInstance, ...instances]);
      
      // Connect the instance - this checks if an instance with the same name already exists
      // and will add a sequential number if needed
      const qrCodeUrl = await connectInstance(newInstance);
      
      // Return the instance with QR Code
      return {
        ...newInstance,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Error adding new instance:", error);
      toast.error("Could not add new instance");
      setLastError("Error adding new instance");
      throw error;
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
