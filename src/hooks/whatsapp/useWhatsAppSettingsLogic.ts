
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";
import { useWhatsAppFetcher } from "@/hooks/whatsapp/useWhatsAppFetcher";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";

export const useWhatsAppSettingsLogic = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const userDataLoadedRef = useRef(false);
  const syncExecutedRef = useRef(false);

  // Load current user data
  useEffect(() => {
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
  }, []);

  // Initialize realtime
  useWhatsAppRealtime(userEmail);

  // Get WhatsApp instances and related functions
  const whatsAppHooks = useWhatsAppInstances(userEmail);
  const { syncAllInstances } = useConnectionSynchronizer();
  const { fetchUserInstances } = useWhatsAppFetcher();

  // Sync inicial controlado - executar apenas UMA vez
  useEffect(() => {
    if (whatsAppHooks.instances.length > 0 && !syncExecutedRef.current) {
      console.log('[WhatsAppSettings] Executing SINGLE initial sync');
      syncExecutedRef.current = true;
      
      const instancesForSync = whatsAppHooks.instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      
      syncAllInstances(instancesForSync).then((results) => {
        console.log("[WhatsAppSettings] Initial status sync completed:", results);
      }).catch((error) => {
        console.error("[WhatsAppSettings] Initial sync failed:", error);
      });
    }
  }, [whatsAppHooks.instances.length, syncAllInstances]);

  // Handle sync all for company
  const handleSyncAllForCompany = async () => {
    if (!whatsAppHooks.instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }
    if (isSyncingAll) {
      console.log('[WhatsAppSettings] Sync already in progress, skipping');
      return;
    }
    
    try {
      setIsSyncingAll(true);
      const instancesForSync = whatsAppHooks.instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      await syncAllInstances(instancesForSync);
      toast.success("Status do WhatsApp da empresa sincronizado!");
      refreshUserInstances();
    } catch (e) {
      toast.error("Falha ao sincronizar status das instâncias da empresa.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Refresh user instances
  const refreshUserInstances = () => {
    if (userEmail) {
      fetchUserInstances(userEmail);
    }
  };

  return {
    userEmail,
    isLoading,
    isSuperAdmin,
    isSyncingAll,
    whatsAppHooks,
    handleSyncAllForCompany,
    refreshUserInstances
  };
};
