
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types/chat";

interface UseContactNotesManagerProps {
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
}

export function useContactNotesManager({ selectedContact, setSelectedContact }: UseContactNotesManagerProps) {
  const [contactNotes, setContactNotes] = useState("");

  useEffect(() => {
    const loadContactNotes = async () => {
      if (selectedContact) {
        setContactNotes(""); // Reset notes before loading
        try {
          const { data: lead, error } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', selectedContact.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: "Searched for a single row, but found no rows"
            throw error;
          }
          if (lead) {
            setContactNotes(lead.notes || "");
          } else {
             setContactNotes(""); // No notes found or lead doesn't exist
          }
        } catch (error) {
          console.error("Error loading contact notes:", error);
          setContactNotes(""); // Clear notes on error
        }
      } else {
        setContactNotes(""); // No contact selected, clear notes
      }
    };

    loadContactNotes();
  }, [selectedContact]);

  const handleUpdateContactNotes = async () => {
    if (!selectedContact) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: contactNotes })
        .eq('id', selectedContact.id);

      if (error) throw error;

      // Update the selectedContact object with the new notes
      setSelectedContact({
        ...selectedContact,
        notes: contactNotes,
      });
      // console.log("Contact notes updated successfully in Supabase.");
    } catch (error) {
      console.error("Error updating contact notes:", error);
    }
  };

  return {
    contactNotes,
    setContactNotes, // To bind to textarea
    handleUpdateContactNotes, // To save notes
  };
}
