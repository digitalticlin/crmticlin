
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useCompanyResolver() {
  const { user } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Use created_by_user_id for company resolution
  const companyId = userProfile?.created_by_user_id || user?.id;
  const isOwnCompany = userProfile?.created_by_user_id === user?.id || !userProfile?.created_by_user_id;

  return {
    companyId,
    isOwnCompany,
    userProfile
  };
}
