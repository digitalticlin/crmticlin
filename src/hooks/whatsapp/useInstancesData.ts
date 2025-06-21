
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { useAuth } from "@/contexts/AuthContext";

export function useInstancesData() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchInstances = async () => {
      try {
        const { data, error } = await supabase
          .from("whatsapp_instances")
          .select("*")
          .eq("created_by_user_id", user.id);

        if (error) throw error;

        // Transform data to match WhatsAppWebInstance interface
        const transformedData: WhatsAppWebInstance[] = (data || []).map(instance => ({
          ...instance,
          created_by_user_id: instance.created_by_user_id,
        }));

        setInstances(transformedData);
      } catch (error) {
        console.error("Error fetching instances:", error);
        setInstances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, [user?.id]);

  return { instances, loading, setInstances };
}
