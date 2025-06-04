
// FASE 3: Hook para gerenciar notas de contatos
import { useState, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";

export const useContactNotes = (selectedContact: Contact | null) => {
  const [contactNotes, setContactNotes] = useState<string>('');

  // Update contact notes in database
  const updateContactNotes = useCallback(async (notes: string) => {
    if (!selectedContact) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', selectedContact.id);

      if (error) throw error;
      
      setContactNotes(notes);
      console.log('[Contact Notes FASE 3] ✅ Notes updated successfully');
    } catch (error) {
      console.error('[Contact Notes FASE 3] ❌ Error updating notes:', error);
    }
  }, [selectedContact]);

  // Load notes when contact changes
  React.useEffect(() => {
    if (selectedContact?.notes) {
      setContactNotes(selectedContact.notes);
    } else {
      setContactNotes('');
    }
  }, [selectedContact]);

  return {
    contactNotes,
    setContactNotes,
    updateContactNotes
  };
};
