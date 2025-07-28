
import { supabase } from "@/integrations/supabase/client";

export class SalesFunnelService {
  static async deleteLead(leadId: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      throw error;
    }
  }
}
