
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserEmail() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };
    getUser();
  }, []);

  return { userEmail };
}
