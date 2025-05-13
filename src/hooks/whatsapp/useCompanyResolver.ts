
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to resolve the company ID for the current user
 */
export const useCompanyResolver = (userEmail: string): string | null => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Fetch company ID for the current user
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!userEmail) {
        console.error("No user email provided to useCompanyResolver");
        return;
      }
      
      try {
        console.log("useCompanyResolver: Fetching company ID for email:", userEmail);
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user) {
          console.error("No authenticated user found");
          return;
        }
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        if (profile && profile.company_id) {
          console.log("useCompanyResolver: Found company ID:", profile.company_id);
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
