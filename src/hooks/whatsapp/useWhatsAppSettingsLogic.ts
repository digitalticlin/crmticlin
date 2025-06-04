
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useCompanyData } from "@/hooks/useCompanyData";

export const useWhatsAppSettingsLogic = () => {
  console.log('[useWhatsAppSettingsLogic] Hook inicializando (CORREÇÕES ANTI-LOOP)');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  // CORREÇÃO 11: Controles rigorosos anti-loop
  const userDataLoadedRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const syncInProgressRef = useRef(false);

  const { companyId, loading: companyLoading } = useCompanyData();

  // Cleanup melhorado
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      syncInProgressRef.current = false;
      console.log('[useWhatsAppSettingsLogic] Cleanup executado (anti-loop)');
    };
  }, []);

  // CORREÇÃO 12: Load user data - APENAS UMA VEZ
  useEffect(() => {
    if (userDataLoadedRef.current || isUnmountedRef.current) {
      console.log('[useWhatsAppSettingsLogic] User data já carregado ou desmontado');
      return;
    }
    
    const getUser = async () => {
      try {
        console.log('[useWhatsAppSettingsLogic] Carregando dados do usuário...');
        setIsLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (isUnmountedRef.current) return;
        
        if (error) {
          console.error("Erro ao obter usuário:", error);
          toast.error("Não foi possível carregar dados do usuário");
          return;
        }
        
        if (user) {
          console.log('[useWhatsAppSettingsLogic] Usuário encontrado:', user.email);
          setUserEmail(user.email || "");
          userDataLoadedRef.current = true;

          // Verificar SuperAdmin apenas uma vez
          const { data: superAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
          
          if (isUnmountedRef.current) return;
          
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
            console.log('[useWhatsAppSettingsLogic] Status SuperAdmin:', superAdmin);
          }
        }
      } catch (error) {
        if (isUnmountedRef.current) return;
        console.error("Erro ao buscar usuário:", error);
        toast.error("Erro ao carregar dados do usuário");
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    getUser();
  }, []);

  // Initialize realtime com proteções
  console.log('[useWhatsAppSettingsLogic] Configurando realtime otimizado para:', userEmail);
  const realtimeHook = useWhatsAppRealtime(userEmail);

  // WhatsApp instances hook otimizado
  const whatsAppHooks = useWhatsAppWebInstances();

  // CORREÇÃO 13: Sync controlado com proteção anti-loop RIGOROSA
  const handleSyncAllForCompany = useCallback(async () => {
    console.log('[useWhatsAppSettingsLogic] Sync solicitado (verificando proteções)');
    
    if (!whatsAppHooks.instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    const MIN_SYNC_INTERVAL = 60000; // AUMENTADO: 60 segundos mínimo

    if (syncInProgressRef.current) {
      console.log('[useWhatsAppSettingsLogic] ⚠️ Sync já em progresso, bloqueado');
      toast.warning("Sincronização já em andamento, aguarde...");
      return;
    }

    if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
      const remainingTime = Math.round((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000);
      console.log(`[useWhatsAppSettingsLogic] ⏸️ Sync throttled - ${remainingTime}s restantes`);
      toast.warning(`Aguarde ${remainingTime}s antes de sincronizar novamente`);
      return;
    }

    if (isUnmountedRef.current) {
      console.log('[useWhatsAppSettingsLogic] Componente desmontado, cancelando sync');
      return;
    }
    
    try {
      syncInProgressRef.current = true;
      setIsSyncingAll(true);
      lastSyncTimeRef.current = now;
      
      console.log('[useWhatsAppSettingsLogic] ✅ Executando sync controlado...');
      
      await whatsAppHooks.refetch();
      
      if (!isUnmountedRef.current) {
        toast.success("Status do WhatsApp sincronizado com sucesso!");
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        console.error('[useWhatsAppSettingsLogic] ❌ Sync falhou:', error);
        toast.error("Falha ao sincronizar: " + error.message);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsSyncingAll(false);
        syncInProgressRef.current = false;
      }
    }
  }, [whatsAppHooks.instances.length, whatsAppHooks.refetch]);

  // CORREÇÃO 14: Refresh throttled
  const refreshUserInstances = useCallback(() => {
    console.log('[useWhatsAppSettingsLogic] Refresh solicitado');
    
    if (userEmail && !isUnmountedRef.current && !syncInProgressRef.current) {
      console.log('[useWhatsAppSettingsLogic] ✅ Executando refresh controlado');
      whatsAppHooks.refetch();
    } else {
      console.log('[useWhatsAppSettingsLogic] ⏸️ Refresh ignorado - condições de proteção');
    }
  }, [userEmail, whatsAppHooks.refetch]);

  console.log('[useWhatsAppSettingsLogic] Hook retornando dados otimizados');

  return {
    userEmail,
    isLoading,
    isSuperAdmin,
    isSyncingAll,
    whatsAppHooks,
    handleSyncAllForCompany,
    refreshUserInstances,
    // NOVO: Estatísticas para debug
    debugInfo: {
      activeChannels: realtimeHook.activeChannels,
      lastSync: new Date(lastSyncTimeRef.current).toLocaleTimeString(),
      syncInProgress: syncInProgressRef.current
    }
  };
};
