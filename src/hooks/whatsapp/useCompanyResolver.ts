
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to resolve the company ID for the current user
 */
export const useCompanyResolver = (userEmail: string) => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Fetch company ID for the current user
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!userEmail) return;
      
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user) {
          console.error("No authenticated user found");
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();
        
        if (profile && profile.company_id) {
          setCompanyId(profile.company_id);
        } else {
          console.error("User has no associated company");
        }
      } catch (error) {
        console.error("Error fetching company ID:", error);
      }
    };
    
    fetchCompanyId();
  }, [userEmail]);

  return companyId;
};
