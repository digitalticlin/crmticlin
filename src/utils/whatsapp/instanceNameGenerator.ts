
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique WhatsApp instance name based on the username
 * with sequential numbering if needed
 */
export const generateUniqueInstanceName = async (baseUsername: string): Promise<string> => {
  try {
    // Fetch existing instances from database
    const { data: existingInstances, error } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .filter('instance_name', 'ilike', `${baseUsername}%`);

    if (error) {
      console.error("Error checking existing instance names:", error);
      return `${baseUsername}1`; // Fallback
    }

    if (!existingInstances || existingInstances.length === 0) {
      return baseUsername; // Use base name if no instances exist
    }

    // Find the highest sequential number
    let highestSeq = 0;
    existingInstances.forEach(instance => {
      const name = instance.instance_name.toLowerCase();
      if (name === baseUsername.toLowerCase()) {
        highestSeq = Math.max(highestSeq, 1);
      } else {
        const regex = new RegExp(`^${baseUsername.toLowerCase()}(\\d+)$`);
        const match = name.match(regex);
        if (match && match[1]) {
          const seq = parseInt(match[1], 10);
          highestSeq = Math.max(highestSeq, seq + 1);
        }
      }
    });

    return highestSeq > 0 ? `${baseUsername}${highestSeq}` : baseUsername;
  } catch (error) {
    console.error("Error generating unique instance name:", error);
    return `${baseUsername}1`; // Fallback in case of error
  }
};
