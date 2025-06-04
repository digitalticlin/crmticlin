
import { supabase } from "@/integrations/supabase/client";
import { DashboardConfig } from "../types/dashboardConfigTypes";

export class DashboardConfigService {
  static async loadConfig(userId: string, companyId: string): Promise<DashboardConfig | null> {
    console.log("=== LOADING CONFIG FROM DATABASE ===");
    console.log("User ID:", userId, "Company ID:", companyId);
    
    const { data, error } = await supabase
      .from('dashboard_configs')
      .select('config_data')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error loading config:", error);
      throw error;
    }

    if (data) {
      console.log("✅ Config loaded from database:", data.config_data);
      return data.config_data as unknown as DashboardConfig;
    }

    console.log("ℹ️ No config found in database");
    return null;
  }

  static async saveConfig(userId: string, companyId: string, config: DashboardConfig): Promise<void> {
    console.log("=== SAVING CONFIG TO DATABASE ===");
    console.log("User ID:", userId, "Company ID:", companyId);
    console.log("Config:", config);
    
    // Tentar upsert primeiro
    const { error: upsertError } = await supabase
      .from('dashboard_configs')
      .upsert({
        user_id: userId,
        company_id: companyId,
        config_data: config as any,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,company_id'
      });

    if (!upsertError) {
      console.log("✅ Config saved successfully with upsert");
      return;
    }

    console.warn("⚠️ Upsert failed, trying insert:", upsertError);

    // Se upsert falhou, tentar insert direto
    const { error: insertError } = await supabase
      .from('dashboard_configs')
      .insert({
        user_id: userId,
        company_id: companyId,
        config_data: config as any
      });

    if (insertError) {
      console.error("❌ Insert failed:", insertError);
      
      // Se insert também falhou, tentar update
      const { error: updateError } = await supabase
        .from('dashboard_configs')
        .update({
          config_data: config as any,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (updateError) {
        console.error("❌ All save attempts failed:", updateError);
        throw updateError;
      }
      
      console.log("✅ Config updated successfully with fallback");
    } else {
      console.log("✅ Config inserted successfully");
    }
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 500
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const waitTime = delay * attempt;
          console.log(`⏳ Waiting ${waitTime}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }
}
