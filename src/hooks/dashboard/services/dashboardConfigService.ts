import { supabase } from "@/integrations/supabase/client";
import type { DashboardConfig as LayoutConfig } from "../types/dashboardConfigTypes";

export interface DashboardConfigRow {
  user_id: string; // legacy compatibility (equals created_by_user_id)
  created_by_user_id: string;
  layout_config: LayoutConfig;
  updated_at: string;
}

export const dashboardConfigService = {
  async getConfig(userId: string): Promise<{ layoutConfig: LayoutConfig } | null> {
    const { data, error } = await supabase
      .from<DashboardConfigRow>('dashboard_configs')
      .select('layout_config, updated_at, created_by_user_id')
      .eq('created_by_user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[dashboardConfigService] getConfig error:', error.message);
      return null;
    }

    if (!data) return null;

    return { layoutConfig: data.layout_config };
  },

  async saveConfig(userId: string, config: LayoutConfig): Promise<void> {
    const { error } = await supabase
      .from<DashboardConfigRow>('dashboard_configs')
      .upsert({
        user_id: userId,
        created_by_user_id: userId,
        layout_config: config,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' });

    if (error) {
      console.error('[dashboardConfigService] saveConfig error:', error.message);
      throw error;
    }
  }
};
