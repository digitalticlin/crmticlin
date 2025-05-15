import { useState, useEffect, useRef } from "react";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import PlaceholderInstanceCard from "./whatsapp/PlaceholderInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";

const STATUS_CHECK_INTERVAL = 15000; // Check status every 15 seconds

const WhatsAppSettings = () => {
  // State to store current user's email
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const userDataLoadedRef = useRef(false);
  
  // Load current user data
  useEffect(() => {
    // Evitar múltiplas chamadas carregando os dados apenas uma vez
    if (userDataLoadedRef.current) return;
    
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
          userDataLoadedRef.current = true;
          
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
    
    // O cleanup não deve resetar loadingRef para permitir que o componente
    // evite fazer múltiplas chamadas durante seu ciclo de vida
  }, []);
  
  // Só inicializar o hook quando o email do usuário estiver disponível
  const {
    instances,
    isLoading: instanceLoading,
    lastError,
    connectInstance,
    deleteInstance,
    refreshQrCode,
    checkInstanceStatus,
    addConnectingInstance,
    showQrCode,
    setShowQrCode,
  } = useWhatsAppInstances(userEmail);

  // Add the connection synchronizer
  const { syncAllInstances } = useConnectionSynchronizer();

  // Re-expor função de atualizar as instâncias do usuário
  const { fetchUserInstances } = useWhatsAppInstances;

  // Atualiza as instâncias do usuário (em vez de instâncias da empresa)
  const refreshUserInstances = () => {
    if (userEmail) {
      // Garantia: não altera nenhum layout nem outra API
      fetchUserInstances(userEmail);
    }
  };

  // Handle showing QR code by updating state
  const handleShowQrCode = (instanceId: string) => {
    setShowQrCode(instanceId);
  };
  
  // Modified to handle the Promise<string> return properly
  const handleConnectInstance = async (instanceId: string) => {
    try {
      await connectInstance(instanceId);
      // After connection is initiated, add instance to priority checking
      addConnectingInstance(instanceId);
    } catch (error) {
      console.error("Error in handleConnectInstance:", error);
    }
  };
  
  // Handle explicit status check request from component
  const handleStatusCheck = (instanceId: string) => {
    addConnectingInstance(instanceId);
  };
  
  // Force sync all instances when the component loads or instances change
  useEffect(() => {
    if (instances.length > 0) {
      // Format instances for the sync function
      const instancesForSync = instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      
      // Perform initial sync
      syncAllInstances(instancesForSync).then((results) => {
        console.log("Initial status sync completed:", results);
      });
    }
  }, [instances, syncAllInstances]);
  
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
        {instances.filter(instance => !!instance.id && instance.id !== "1").map(instance =>
            <WhatsAppInstanceCard
              key={instance.id}
              instance={instance}
              isLoading={instanceLoading[instance.id] || false}
              showQrCode={showQrCode === instance.id}
              onConnect={handleConnectInstance}
              onDelete={deleteInstance}
              onRefreshQrCode={refreshQrCode}
              onStatusCheck={handleStatusCheck}
            />
        )}

        {instances.filter(instance => !!instance.id && instance.id !== "1").length === 0 && (
          <PlaceholderInstanceCard
            isSuperAdmin={isSuperAdmin}
            userEmail={userEmail}
            onRefreshInstances={refreshUserInstances}
          />
        )}
      </div>
    </div>
  );
};

export default WhatsAppSettings;
