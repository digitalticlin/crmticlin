
import { useEffect } from "react";
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
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

  useEffect(() => {
    if (user && companyId && !isInitializedRef.current) {
      console.log("🔄 Loading config for user:", user.id, "company:", companyId);
      loadConfig();
    }
  }, [user, companyId]);

  const loadConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      setLoading(true);
      
      const loadedConfig = await configOperations.loadConfig(user.id, companyId);
      
      if (loadedConfig && isMountedRef.current) {
        setConfig(loadedConfig);
        triggerForceUpdate();
        isInitializedRef.current = true;
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
    }
  };

  const createInitialConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      const initialConfig = await configOperations.createInitialConfig(user.id, companyId);
      setConfig(initialConfig);
      triggerForceUpdate();
      isInitializedRef.current = true;
    } catch (error) {
      console.error("❌ Error creating initial config:", error);
      toast.error("Erro ao criar configuração inicial");
      // Set default config as fallback
      setConfig(require("../types/dashboardConfigTypes").defaultConfig);
      triggerForceUpdate();
      isInitializedRef.current = true;
    }
  };
};
