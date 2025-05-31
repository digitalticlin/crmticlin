
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useCompanyData } from "@/hooks/useCompanyData";

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

  const { companyId } = useCompanyData();

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
  const whatsAppHooks = useWhatsAppWebInstances(companyId);

  console.log('[useWhatsAppSettingsLogic] WhatsApp instances loaded:', whatsAppHooks.instances.length);

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
        instance_name: instance.instance_name
      }));
      console.log('[useWhatsAppSettingsLogic] Syncing instances:', instancesForSync.length);
      
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
  }, [whatsAppHooks.instances, isSyncingAll]);

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
      whatsAppHooks.refetch();
    }
  }, [userEmail, whatsAppHooks.refetch]);

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
