
import { supabase } from "@/integrations/supabase/client";
import { DashboardConfig } from "../types/dashboardConfigTypes";

export class DashboardConfigService {
  static async loadConfig(userId: string, companyId: string): Promise<DashboardConfig | null> {
    console.log("=== LOADING CONFIG ===");
    console.log("User ID:", userId, "Company ID:", companyId);
    
    // First, cleanup duplicates if they exist
    await this.cleanupDuplicateConfigs(userId, companyId);
    
    const { data, error } = await supabase
      .from('dashboard_configs')
      .select('config_data')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      console.log("Config loaded from database:", data.config_data);
      return data.config_data as DashboardConfig;
    }

    console.log("No config found in database");
    return null;
  }

  static async saveConfig(userId: string, companyId: string, config: DashboardConfig): Promise<void> {
    console.log("=== SAVING CONFIG ===", config);
    
    const { error } = await supabase
      .from('dashboard_configs')
      .upsert({
        user_id: userId,
        company_id: companyId,
        config_data: config as any // Cast to any to satisfy Json type requirement
      }, {
        onConflict: 'user_id,company_id'
      });

    if (error) throw error;
    
    console.log("Config saved successfully");
  }

  static async cleanupDuplicateConfigs(userId: string, companyId: string): Promise<void> {
    try {
      const { data: duplicates } = await supabase
        .from('dashboard_configs')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (duplicates && duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicate configs, cleaning up...`);
        const idsToDelete = duplicates.slice(1).map(d => d.id);
        
        await supabase
          .from('dashboard_configs')
          .delete()
          .in('id', idsToDelete);
        
        console.log("Duplicate configs cleaned up");
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
    }
  }
}
