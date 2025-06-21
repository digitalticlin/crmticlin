
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance, WhatsAppConnectionStatus } from "@/types/whatsapp";
import { useAuth } from "@/contexts/AuthContext";

export function useInstancesData() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('⚠️ Usuário não autenticado');
        setInstances([]);
        return;
      }

      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("created_by_user_id", user.id);

      if (error) throw error;

      // Transform data to match WhatsAppWebInstance interface with proper type casting
      const transformedData: WhatsAppWebInstance[] = (data || []).map(instance => ({
        ...instance,
        connection_status: (instance.connection_status || 'disconnected') as WhatsAppConnectionStatus,
        created_by_user_id: instance.created_by_user_id,
        created_at: instance.created_at || new Date().toISOString(),
        updated_at: instance.updated_at || new Date().toISOString(),
        history_imported: instance.history_imported || false,
      }));

      setInstances(transformedData);
    } catch (error) {
      console.error("Error fetching instances:", error);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchInstances();
  }, [user?.id]);

  return { 
    instances, 
    loading,
    isLoading: loading, 
    setInstances,
    refetch: fetchInstances
  };
}
