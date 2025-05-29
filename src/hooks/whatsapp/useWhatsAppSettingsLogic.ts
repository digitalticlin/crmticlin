
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";
import { useWhatsAppFetcher } from "@/hooks/whatsapp/useWhatsAppFetcher";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";

export const useWhatsAppSettingsLogic = () => {
  console.log('[useWhatsAppSettingsLogic] Hook initializing');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const userDataLoadedRef = useRef(false);
  const syncExecutedRef = useRef(false);

  // Load current user data
  useEffect(() => {
    console.log('[useWhatsAppSettingsLogic] User data effect triggered');
    
    if (userDataLoadedRef.current) {
      console.log('[useWhatsAppSettingsLogic] User data already loaded, skipping');
      return;
    }
    
    const getUser = async () => {
      try {
        console.log('[useWhatsAppSettingsLogic] Fetching user data...');
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        if (user) {
          console.log('[useWhatsAppSettingsLogic] User found:', user.email);
          setUserEmail(user.email || "");
          userDataLoadedRef.current = true;

          // Check if user is a SuperAdmin
          const { data: superAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
            console.log('[useWhatsAppSettingsLogic] SuperAdmin status:', superAdmin);
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

  // Initialize realtime only when userEmail is available
  console.log('[useWhatsAppSettingsLogic] Setting up realtime for:', userEmail);
  useWhatsAppRealtime(userEmail);

  // Get WhatsApp instances and related functions
  console.log('[useWhatsAppSettingsLogic] Initializing WhatsApp hooks for:', userEmail);
  const whatsAppHooks = useWhatsAppInstances(userEmail);
  const { syncAllInstances } = useConnectionSynchronizer();
  const { fetchUserInstances } = useWhatsAppFetcher();

  console.log('[useWhatsAppSettingsLogic] WhatsApp instances loaded:', whatsAppHooks.instances.length);

  // Sync inicial controlado - executar apenas UMA vez
  useEffect(() => {
    if (whatsAppHooks.instances.length > 0 && !syncExecutedRef.current) {
      console.log('[useWhatsAppSettingsLogic] Executing SINGLE initial sync for', whatsAppHooks.instances.length, 'instances');
      syncExecutedRef.current = true;
      
      const instancesForSync = whatsAppHooks.instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      
      syncAllInstances(instancesForSync).then((results) => {
        console.log("[useWhatsAppSettingsLogic] Initial status sync completed:", results);
      }).catch((error) => {
        console.error("[useWhatsAppSettingsLogic] Initial sync failed:", error);
      });
    }
  }, [whatsAppHooks.instances.length, syncAllInstances]);

  // Handle sync all for company
  const handleSyncAllForCompany = async () => {
    console.log('[useWhatsAppSettingsLogic] handleSyncAllForCompany called');
    
    if (!whatsAppHooks.instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }
    if (isSyncingAll) {
      console.log('[useWhatsAppSettingsLogic] Sync already in progress, skipping');
      return;
    }
    
    try {
      setIsSyncingAll(true);
      const instancesForSync = whatsAppHooks.instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      console.log('[useWhatsAppSettingsLogic] Syncing instances:', instancesForSync.length);
      await syncAllInstances(instancesForSync);
      toast.success("Status do WhatsApp da empresa sincronizado!");
      refreshUserInstances();
    } catch (e) {
      console.error('[useWhatsAppSettingsLogic] Sync failed:', e);
      toast.error("Falha ao sincronizar status das instâncias da empresa.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Refresh user instances
  const refreshUserInstances = () => {
    console.log('[useWhatsAppSettingsLogic] refreshUserInstances called for:', userEmail);
    if (userEmail) {
      fetchUserInstances(userEmail);
    }
  };

  console.log('[useWhatsAppSettingsLogic] Hook returning data');

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
