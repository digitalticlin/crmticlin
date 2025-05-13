
import { useState, useEffect, useRef } from "react";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import PlaceholderInstanceCard from "./whatsapp/PlaceholderInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_CHECK_INTERVAL = 15000; // Check status every 15 seconds

const WhatsAppSettings = () => {
  // State to store current user's email
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load current user data
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        
        if (user) {
          setUserEmail(user.email || "");
          
          // Check if user is a SuperAdmin
          const { data: superAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      } finally {
        setIsLoading(false);
      }
    };
    
    getUser();
  }, []);
  
  const {
    instances,
    isLoading: instanceLoading,
    lastError,
    connectInstance,
    deleteInstance,
    refreshQrCode,
    checkInstanceStatus,
    showQrCode,
    setShowQrCode,
  } = useWhatsAppInstances(userEmail);

  // Periodically check instance status with a more efficient approach
  useEffect(() => {
    if (!instances.length) return;

    console.log("Starting periodic status check for", instances.length, "instances");
    
    // First immediate check with staggered timing to prevent API flooding
    const checkAllInstances = async () => {
      console.log("Checking status of all instances...");
      
      // Check instances that are not connected first
      const disconnectedInstances = instances.filter(instance => !instance.connected);
      
      // Stagger the checks to avoid hammering the API
      for (let i = 0; i < disconnectedInstances.length; i++) {
        const instance = disconnectedInstances[i];
        // Add a delay between each check to prevent API flooding
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, i * 1000); // Stagger by 1 second per instance
      }
      
      // Only periodically check connected instances to make sure they're still connected
      const connectedInstances = instances.filter(instance => instance.connected);
      for (let i = 0; i < connectedInstances.length; i++) {
        const instance = connectedInstances[i];
        // Check connected instances less frequently
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (disconnectedInstances.length * 1000) + (i * 1000)); // Check after disconnected instances
      }
    };
    
    // Run the first check immediately
    checkAllInstances();
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up periodic check
    intervalRef.current = setInterval(checkAllInstances, STATUS_CHECK_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [instances, checkInstanceStatus]);
  
  // Handle showing QR code by updating state
  const handleShowQrCode = async (instanceId: string) => {
    setShowQrCode(instanceId);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-xl font-semibold">WhatsApp Management</h3>
        <p className="text-sm text-muted-foreground">
          Connect and manage your WhatsApp instances
        </p>
      </div>
      
      <WhatsAppInfoAlert />
      
      {lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lastError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        {instances.map(instance => (
          <WhatsAppInstanceCard 
            key={instance.id}
            instance={instance}
            isLoading={instanceLoading[instance.id] || false}
            showQrCode={showQrCode === instance.id}
            onConnect={() => connectInstance(instance.id)}
            onDelete={deleteInstance}
            onRefreshQrCode={refreshQrCode}
          />
        ))}
        
        {/* Placeholder for adding new instance - shown for SuperAdmin or users with appropriate plan */}
        <PlaceholderInstanceCard 
          isSuperAdmin={isSuperAdmin} 
          userEmail={userEmail}
        />
      </div>
    </div>
  );
};

export default WhatsAppSettings;
