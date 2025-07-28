
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { configOperations } from "../operations/configOperations";
import { DashboardConfig } from "../types/dashboardConfigTypes";

export const useConfigInitialization = (
  user: any,
  companyId: string,
  setConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>,
  setLoading: (loading: boolean) => void,
  triggerForceUpdate: () => void,
  isMountedRef: React.MutableRefObject<boolean>,
  isInitializedRef: React.MutableRefObject<boolean>
) => {
  // ✅ ANTI-LOOP: Controle de execução melhorado
  const lastInitParams = useRef<string>('');
  const initInProgress = useRef<boolean>(false);
  const initAttempts = useRef<number>(0);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isMountedRef]);

  useEffect(() => {
    // ✅ VERIFICAR PARÂMETROS
    if (!user || !companyId) {
      console.log("⚠️ Dashboard init: aguardando user e companyId");
      return;
    }
    
    // ✅ VERIFICAR SE JÁ FOI INICIALIZADO
    if (isInitializedRef.current) {
      console.log("⚠️ Dashboard init: já inicializado");
      return;
    }
    
    // ✅ ANTI-LOOP: Verificar se parâmetros mudaram
    const currentParams = `${user.id}-${companyId}`;
    if (currentParams === lastInitParams.current && initInProgress.current) {
      console.log("⚠️ Dashboard init: já em progresso para os mesmos parâmetros");
      return;
    }
    
    // ✅ LIMITE DE TENTATIVAS
    if (initAttempts.current >= 2) {
      console.error("🚨 Dashboard init: muitas tentativas, parando");
      return;
    }
    
    lastInitParams.current = currentParams;
    initAttempts.current++;
    
    console.log(`🔄 Loading config for user: ${user.id}, company: ${companyId} (tentativa ${initAttempts.current})`);
    
    // ✅ DEBOUNCE: Adicionar pequeno delay para evitar execução imediata
    initTimeoutRef.current = setTimeout(loadConfig, 100);
  }, [user, companyId]);

  const loadConfig = async () => {
    if (!user?.id || !companyId) return;
    
    // ✅ EVITAR EXECUÇÃO CONCORRENTE
    if (initInProgress.current) {
      console.log("⚠️ Dashboard init: já em progresso");
      return;
    }
    
    initInProgress.current = true;
    
    try {
      setLoading(true);
      
      const loadedConfig = await configOperations.loadConfig(user.id, companyId);
      
      if (loadedConfig && isMountedRef.current) {
        setConfig(loadedConfig);
        triggerForceUpdate();
        isInitializedRef.current = true;
        initAttempts.current = 0; // Reset tentativas em caso de sucesso
        console.log("✅ Dashboard config carregado com sucesso");
      } else if (isMountedRef.current) {
        await createInitialConfig();
      }
    } catch (error) {
      console.error("❌ Error loading config:", error);
      if (isMountedRef.current) {
        await createInitialConfig();
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      initInProgress.current = false;
    }
  };

  const createInitialConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      const initialConfig = await configOperations.createInitialConfig(user.id, companyId);
      setConfig(initialConfig);
      triggerForceUpdate();
      isInitializedRef.current = true;
      initAttempts.current = 0; // Reset tentativas em caso de sucesso
      console.log("✅ Dashboard config inicial criado com sucesso");
    } catch (error) {
      console.error("❌ Error creating initial config:", error);
      toast.error("Erro ao criar configuração inicial");
      // Set default config as fallback
      setConfig(require("../types/dashboardConfigTypes").defaultConfig);
      triggerForceUpdate();
      isInitializedRef.current = true;
      initAttempts.current = 0; // Reset tentativas mesmo com fallback
    }
  };
};
