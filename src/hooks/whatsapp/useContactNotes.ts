
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Contact } from '@/types/chat';

/**
 * Hook to manage contact notes
 */
export const useContactNotes = (selectedContact: Contact | null) => {
  const [contactNotes, setContactNotes] = useState("");
  
  // Load contact notes when a contact is selected
  useEffect(() => {
    const loadContactNotes = async () => {
      if (selectedContact) {
        try {
          const { data: lead } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', selectedContact.id)
            .single();
            
          if (lead) {
            setContactNotes(lead.notes || "");
          }
        } catch (error) {
          console.error("Error loading contact notes:", error);
        }
      }
    };
    
    loadContactNotes();
  }, [selectedContact]);

  // Handler for updating contact notes
  const updateContactNotes = async () => {
    if (!selectedContact) return;
    
    try {
      await supabase
        .from('leads')
        .update({ notes: contactNotes })
        .eq('id', selectedContact.id);
        
      return true;
    } catch (error) {
      console.error("Error updating contact notes:", error);
      return false;
    }
  };

  return {
    contactNotes,
    setContactNotes,
    updateContactNotes
  };
};
