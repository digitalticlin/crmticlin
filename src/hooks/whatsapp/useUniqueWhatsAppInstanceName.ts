
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useUniqueWhatsAppInstanceName = (companyId: string) => {
  const [uniqueName, setUniqueName] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  const generateUniqueName = async (baseName: string = "whatsapp"): Promise<string> => {
    setIsChecking(true);
    
    try {
      // Get existing instance names for the company
      const { data: existingInstances } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('company_id', companyId);

      const existingNames = existingInstances?.map(i => i.instance_name.toLowerCase()) || [];
      
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
