
import type { DashboardConfig as LayoutConfig } from "../types/dashboardConfigTypes";

export interface DashboardConfigRow {
  user_id: string;
  created_by_user_id: string;
  layout_config: LayoutConfig;
  updated_at: string;
}

// Since dashboard_configs table doesn't exist in Supabase, we'll use localStorage
export const dashboardConfigService = {
  async getConfig(userId: string): Promise<{ layoutConfig: LayoutConfig } | null> {
    try {
      const stored = localStorage.getItem(`dashboard_config_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { layoutConfig: parsed };
      }
      return null;
    } catch (error) {
      console.warn('[dashboardConfigService] getConfig error:', error);
      return null;
    }
  },

  async saveConfig(userId: string, config: LayoutConfig): Promise<void> {
    try {
      localStorage.setItem(`dashboard_config_${userId}`, JSON.stringify(config));
    } catch (error) {
      console.error('[dashboardConfigService] saveConfig error:', error);
      throw error;
    }
  }
};
