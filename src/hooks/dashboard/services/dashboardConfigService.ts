import { supabase } from "@/lib/supabaseClient";

export interface DashboardConfig {
  id: string;
  created_by_user_id: string;
  period_filter: string;
  ai_agent_prompts: any;
  created_at: string;
  updated_at: string;
}

// Fix the generic type arguments:
export const getDashboardConfig = async (userId: string): Promise<DashboardConfig | null> => {
  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('created_by_user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching dashboard config:', error);
    return null;
  }

  return data;
};

export const updateDashboardConfig = async (
  userId: string,
  updates: Partial<DashboardConfig>
): Promise<DashboardConfig | null> => {
  const { data, error } = await supabase
    .from('dashboard_configs')
    .update(updates)
    .eq('created_by_user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating dashboard config:', error);
    return null;
  }

  return data;
};
