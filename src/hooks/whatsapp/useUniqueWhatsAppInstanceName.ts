
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useUniqueWhatsAppInstanceName = (companyId: string) => {
  const [uniqueName, setUniqueName] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  const generateUniqueName = async (baseName: string = "whatsapp"): Promise<string> => {
    setIsChecking(true);
    
    try {
      // Get existing instance names for the company - using explicit typing
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching instances:', error);
        return `${baseName}_${Date.now()}`;
      }

      // Extract names with explicit typing to avoid type recursion
      const existingNames: string[] = (existingInstances || []).map((instance: any) => 
        instance.instance_name?.toLowerCase() || ''
      ).filter(Boolean);
      
      // Generate unique name
      let counter = 1;
      let candidateName = baseName.toLowerCase();
      
      while (existingNames.includes(candidateName)) {
        candidateName = `${baseName.toLowerCase()}_${counter}`;
        counter++;
      }
      
      setUniqueName(candidateName);
      return candidateName;
    } catch (error) {
      console.error('Error generating unique name:', error);
      return `${baseName}_${Date.now()}`;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    uniqueName,
    generateUniqueName,
    isChecking
  };
};
