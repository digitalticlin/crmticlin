
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "operational" | "manager" | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setRole(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const userRole = profile?.role as "admin" | "operational" | "manager" | null;
        setRole(userRole);
        setIsAdmin(userRole === "admin");
      } catch (error) {
        console.error("Erro ao verificar role do usuário:", error);
        setIsAdmin(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  return { isAdmin, role, loading };
};
