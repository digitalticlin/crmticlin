
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useCompanyData } from "@/hooks/useCompanyData";

export const useWhatsAppSettingsLogic = () => {
  console.log('[useWhatsAppSettingsLogic] Hook initializing FASE 3 - com controle de estabilidade');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  // Controles de estabilidade para prevenir loops
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
      console.log('[useWhatsAppSettingsLogic] Component unmounting FASE 3');
    };
  }, []);

  // Load user data - APENAS UMA VEZ com controle rigoroso
  useEffect(() => {
    console.log('[useWhatsAppSettingsLogic] User data effect FASE 3');
    
    if (userDataLoadedRef.current || isUnmountedRef.current) {
      console.log('[useWhatsAppSettingsLogic] User data já carregado ou componente desmontado');
      return;
    }
    
    const getUser = async () => {
      try {
        console.log('[useWhatsAppSettingsLogic] Buscando dados do usuário...');
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

          // Verificar se é SuperAdmin
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
  }, []); // Dependency array vazia - executa apenas uma vez

  // Initialize realtime apenas quando userEmail disponível
  console.log('[useWhatsAppSettingsLogic] Configurando realtime para:', userEmail);
  useWhatsAppRealtime(userEmail);

  // WhatsApp instances hook com nova funcionalidade de estabilidade
  console.log('[useWhatsAppSettingsLogic] Inicializando WhatsApp hooks FASE 3 para:', userEmail);
  const whatsAppHooks = useWhatsAppWebInstances(companyId, companyLoading);

  console.log('[useWhatsAppSettingsLogic] WhatsApp instances carregadas:', whatsAppHooks.instances.length);

  // Sync controlado para empresa com proteção anti-loop melhorada
  const handleSyncAllForCompany = useCallback(async () => {
    console.log('[useWhatsAppSettingsLogic] handleSyncAllForCompany FASE 3');
    
    if (!whatsAppHooks.instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }

    // Proteção anti-loop rigorosa
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    const MIN_SYNC_INTERVAL = 30000; // 30 segundos mínimo entre syncs

    if (syncInProgressRef.current) {
      console.log('[useWhatsAppSettingsLogic] Sync já em progresso, ignorando');
      toast.warning("Sincronização já em andamento, aguarde...");
      return;
    }

    if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
      const remainingTime = Math.round((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000);
      console.log(`[useWhatsAppSettingsLogic] Sync throttled - ${remainingTime}s restantes`);
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
      
      console.log('[useWhatsAppSettingsLogic] Executando sync controlado...');
      
      // Usar refetch do hook que já tem controle de estabilidade
      await whatsAppHooks.refetch();
      
      if (!isUnmountedRef.current) {
        toast.success("Status do WhatsApp sincronizado com sucesso!");
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        console.error('[useWhatsAppSettingsLogic] Sync falhou:', error);
        toast.error("Falha ao sincronizar: " + error.message);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsSyncingAll(false);
        syncInProgressRef.current = false;
      }
    }
  }, [whatsAppHooks.instances.length, whatsAppHooks.refetch]);

  // Refresh com throttling
  const refreshUserInstances = useCallback(() => {
    console.log('[useWhatsAppSettingsLogic] refreshUserInstances FASE 3');
    
    if (userEmail && !isUnmountedRef.current && !syncInProgressRef.current) {
      console.log('[useWhatsAppSettingsLogic] Executando refresh controlado');
      whatsAppHooks.refetch();
    } else {
      console.log('[useWhatsAppSettingsLogic] Refresh ignorado - condições não atendidas');
    }
  }, [userEmail, whatsAppHooks.refetch]);

  console.log('[useWhatsAppSettingsLogic] Hook retornando dados FASE 3');

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
