
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";
import { dashboardConfigService } from "../services/dashboardConfigService";
import { validateConfig, deepClone } from "../utils/configUtils";

export const configOperations = {
  async loadConfig(userId: string, companyId: string): Promise<DashboardConfig | null> {
    console.log("=== LOADING CONFIG ===");
    
    const loadedConfig = await dashboardConfigService.getDashboardConfig(userId);
    
    if (loadedConfig && validateConfig(loadedConfig)) {
      console.log("✅ Config loaded:", loadedConfig);
      return loadedConfig;
    }
    
    console.log("ℹ️ No valid config found");
    return null;
  },

  async createInitialConfig(userId: string, companyId: string): Promise<DashboardConfig> {
    console.log("🔨 Creating initial config");
    await dashboardConfigService.saveDashboardConfig(userId, defaultConfig);
    console.log("✅ Initial config created");
    return defaultConfig;
  },

  createSaveScheduler(
    userId: string,
    companyId: string,
    setSaving: (saving: boolean) => void,
    lastSaveAtRef?: React.MutableRefObject<number>
  ) {
    return (configToSave: DashboardConfig, saveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          console.log("💾 Saving config");
          await dashboardConfigService.saveDashboardConfig(userId, configToSave);
          console.log("✅ Config saved");
          if (lastSaveAtRef) {
            lastSaveAtRef.current = Date.now();
          }
        } catch (error) {
          console.error("❌ Save error:", error);
        } finally {
          setSaving(false);  
        }
      }, 500);
    };
  }
};
