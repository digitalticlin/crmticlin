
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { extractUsernameFromEmail, generateSequentialInstanceName } from '@/utils/instanceNaming';

export const useIntelligentNaming = () => {
  const { companyId } = useCompanyData();

  // Generate intelligent instance name based on user email
  const generateIntelligentInstanceName = useCallback(async (userEmail: string): Promise<string> => {
    try {
      console.log('[Intelligent Naming] 🎯 Generating intelligent name for:', userEmail);
      
      if (!userEmail) {
        console.log('[Intelligent Naming] ⚠️ No email provided, using fallback');
        return `whatsapp_${Date.now()}`;
      }

      // Extract username from email (digitalticlin@gmail.com → digitalticlin)
      const username = extractUsernameFromEmail(userEmail);
      console.log('[Intelligent Naming] 📧 Username extracted:', username);

      // Get existing instance names (search broadly first, we can filter later if needed)
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('connection_type', 'web');

      if (error) {
        console.error('[Intelligent Naming] ❌ Error fetching existing instances:', error);
        return `${username}_${Date.now()}`;
      }

      const existingNames = existingInstances?.map(i => i.instance_name) || [];
      console.log('[Intelligent Naming] 📋 Existing names found:', existingNames.length);

      // Generate sequential name (digitalticlin, digitalticlin1, digitalticlin2...)
      const intelligentName = generateSequentialInstanceName(username, existingNames);
      console.log('[Intelligent Naming] ✅ Intelligent name generated:', intelligentName);

      return intelligentName;

    } catch (error) {
      console.error('[Intelligent Naming] ❌ Error in intelligent naming:', error);
      // Fallback to timestamp-based name
      const fallbackName = `whatsapp_${Date.now()}`;
      console.log('[Intelligent Naming] 🔄 Using fallback name:', fallbackName);
      return fallbackName;
    }
  }, [companyId]);

  return {
    generateIntelligentInstanceName
  };
};
