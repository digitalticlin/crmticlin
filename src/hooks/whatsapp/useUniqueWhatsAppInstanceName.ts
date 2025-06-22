
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useUniqueWhatsAppInstanceName = (companyId: string) => {
  const [uniqueName, setUniqueName] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  const generateUniqueName = async (baseName: string = "whatsapp"): Promise<string> => {
    setIsChecking(true);
    
    try {
      // Fix: Use created_by_user_id instead of company_id and add explicit typing
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('created_by_user_id', companyId) as { 
          data: Array<{ instance_name: string }> | null; 
          error: any 
        };

      if (error) {
        console.error('Error fetching instances:', error);
        return `${baseName}_${Date.now()}`;
      }

      // Extract names with safe type handling
      const existingNames: string[] = (existingInstances || [])
        .map(instance => instance.instance_name?.toLowerCase() || '')
        .filter(name => name.length > 0);
      
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
