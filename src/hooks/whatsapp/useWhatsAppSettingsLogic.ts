
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "@/types/whatsapp";

export function useWhatsAppSettingsLogic() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchInstances = async () => {
      try {
        console.log("🔄 Fetching WhatsApp instances for user:", user.id);
        
        const { data, error } = await supabase
          .from("whatsapp_instances")
          .select("*")
          .eq("created_by_user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching instances:", error);
          throw error;
        }

        console.log("✅ Fetched instances:", data?.length || 0);
        
        // Transform data to match interface
        const transformedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
          ...instance,
          created_by_user_id: instance.created_by_user_id
        }));

        setInstances(transformedInstances);
      } catch (error) {
        console.error("💥 Error in fetchInstances:", error);
        setInstances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();

    // Set up real-time subscription
    const subscription = supabase
      .channel('whatsapp_instances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log("📡 Real-time update received:", payload);
          fetchInstances(); // Refetch all instances on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    instances,
    loading,
    setInstances
  };
}
