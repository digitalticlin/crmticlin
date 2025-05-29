
import { useState, useEffect, useRef, useCallback } from "react";
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
  
  // Refs para controlar execuções e evitar loops
  const userDataLoadedRef = useRef(false);
  const syncExecutedRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Cleanup no desmonte do componente
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[useWhatsAppSettingsLogic] Component unmounting, cleaning up');
    };
  }, []);

  // Load current user data - APENAS UMA VEZ
  useEffect(() => {
    console.log('[useWhatsAppSettingsLogic] User data effect triggered');
    
    if (userDataLoadedRef.current || isUnmountedRef.current) {
      console.log('[useWhatsAppSettingsLogic] User data already loaded or component unmounted, skipping');
      return;
    }
    
    const getUser = async () => {
      try {
        console.log('[useWhatsAppSettingsLogic] Fetching user data...');
        setIsLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (isUnmountedRef.current) return; // Verificar se ainda está montado
        
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
          
          if (isUnmountedRef.current) return; // Verificar novamente
          
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
            console.log('[useWhatsAppSettingsLogic] SuperAdmin status:', superAdmin);
          }
        }
      } catch (error) {
        if (isUnmountedRef.current) return;
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    getUser();
  }, []); // Empty dependency array - executa apenas uma vez

  // Initialize realtime only when userEmail is available
  console.log('[useWhatsAppSettingsLogic] Setting up realtime for:', userEmail);
  useWhatsAppRealtime(userEmail);

  // Get WhatsApp instances and related functions
  console.log('[useWhatsAppSettingsLogic] Initializing WhatsApp hooks for:', userEmail);
  const whatsAppHooks = useWhatsAppInstances(userEmail);
  const { syncAllInstances } = useConnectionSynchronizer();
  const { fetchUserInstances } = useWhatsAppFetcher();

  console.log('[useWhatsAppSettingsLogic] WhatsApp instances loaded:', whatsAppHooks.instances.length);

  // Sync inicial controlado - executar apenas UMA vez com throttling mais agressivo
  useEffect(() => {
    const now = Date.now();
    const minInterval = 120000; // 2 minutos entre syncs
    
    if (
      whatsAppHooks.instances.length > 0 && 
      !syncExecutedRef.current && 
      !isUnmountedRef.current &&
      (now - lastFetchTimeRef.current > minInterval)
    ) {
      console.log('[useWhatsAppSettingsLogic] Executing SINGLE initial sync for', whatsAppHooks.instances.length, 'instances');
      syncExecutedRef.current = true;
      lastFetchTimeRef.current = now;
      
      const instancesForSync = whatsAppHooks.instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      
      syncAllInstances(instancesForSync).then((results) => {
        if (!isUnmountedRef.current) {
          console.log("[useWhatsAppSettingsLogic] Initial status sync completed:", results);
        }
      }).catch((error) => {
        if (!isUnmountedRef.current) {
          console.error("[useWhatsAppSettingsLogic] Initial sync failed:", error);
        }
      });
    }
  }, [whatsAppHooks.instances.length, syncAllInstances]);

  // Handle sync all for company com proteção contra execução simultânea
  const handleSyncAllForCompany = useCallback(async () => {
    console.log('[useWhatsAppSettingsLogic] handleSyncAllForCompany called');
    
    if (!whatsAppHooks.instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }
    if (isSyncingAll || isUnmountedRef.current) {
      console.log('[useWhatsAppSettingsLogic] Sync already in progress or component unmounted, skipping');
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
      
      if (!isUnmountedRef.current) {
        toast.success("Status do WhatsApp da empresa sincronizado!");
        refreshUserInstances();
      }
    } catch (e) {
      if (!isUnmountedRef.current) {
        console.error('[useWhatsAppSettingsLogic] Sync failed:', e);
        toast.error("Falha ao sincronizar status das instâncias da empresa.");
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsSyncingAll(false);
      }
    }
  }, [whatsAppHooks.instances, isSyncingAll, syncAllInstances]);

  // Refresh user instances com throttling
  const refreshUserInstances = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) { // 5 segundos de throttling
      console.log('[useWhatsAppSettingsLogic] refreshUserInstances throttled');
      return;
    }
    
    console.log('[useWhatsAppSettingsLogic] refreshUserInstances called for:', userEmail);
    if (userEmail && !isUnmountedRef.current) {
      lastFetchTimeRef.current = now;
      fetchUserInstances(userEmail);
    }
  }, [userEmail, fetchUserInstances]);

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
