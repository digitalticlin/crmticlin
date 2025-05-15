import { useState, useEffect, useCallback } from "react";
import { useWhatsAppChat } from "./useWhatsAppChat";
import { Contact } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { FIXED_COLUMN_IDS } from "@/types/kanban";
import { useSalesFunnel } from "./useSalesFunnel";

export function useChat() {
  // State for user email
  const [userEmail, setUserEmail] = useState<string>("");

  // State for contact details drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);

  // State for contact notes
  const [contactNotes, setContactNotes] = useState("");

  // Estado para controle do loading manual do botão de atualizar
  const [manualLoading, setManualLoading] = useState(false);

  // Get receiveNewLead from useSalesFunnel
  const { receiveNewLead } = useSalesFunnel();

  // WhatsApp chat integration
  const {
    contacts: whatsappContacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    fetchContacts,
    isLoadingContacts,
    isLoadingMessages,
    fetchMessages // adicionado para usar na chamada manual
  } = useWhatsAppChat(userEmail);

  // Use only real WhatsApp contacts
  const contacts = whatsappContacts;

  // Load user email on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };

    getUser();
  }, []);

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

  // Set up realtime subscription for new messages
  useEffect(() => {
    // Listen for new or updated leads
    const leadsChannel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        async (payload) => {
          console.log('Novo lead recebido:', payload);
          
          // Se houver uma nova inserção, adicionar aos contatos e ao funil de vendas
          // Explicitly type newLead from payload to ensure properties are checked
          const newLeadData = payload.new as { 
            id: string; 
            name: string; 
            phone: string; 
            last_message: string | null; 
            last_message_time: string | null;
            // Add other relevant fields from the 'leads' table if needed for context
          };
          
          if (newLeadData && newLeadData.phone) {
            try {
              // Adicionar lead ao funil de vendas
              // The 'name' property is removed from this object to match the expected type
              // Omit<KanbanLead, "id" | "name" | "columnId">
              receiveNewLead({
                phone: newLeadData.phone,
                lastMessage: newLeadData.last_message || "",
                lastMessageTime: newLeadData.last_message_time ? 
                  new Date(newLeadData.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  "Agora",
                tags: [] // Assuming KanbanLead expects tags and it's not in the Omit type
              });
              
              // Atualizar lista de contatos no chat
              await fetchContacts();
            } catch (error) {
              console.error("Erro ao processar novo lead:", error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        async (payload) => {
          console.log('Lead atualizado:', payload);
          
          // Se o lead selecionado for atualizado, atualizar conteúdo
          if (selectedContact && payload.new.id === selectedContact.id) {
            // Atualizar mensagens se o lead selecionado receber uma nova mensagem
            // Ensure payload.new.last_message and payload.old.last_message exist if accessed
            const newLastMessage = (payload.new as { last_message?: string }).last_message;
            const oldLastMessage = (payload.old as { last_message?: string }).last_message;
            if (newLastMessage !== oldLastMessage) {
              await fetchMessages();
            }
          }
          
          // Atualizar lista de contatos independente do lead atualizado
          await fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [fetchContacts, fetchMessages, selectedContact, receiveNewLead]);

  // Handler for updating contact notes
  const handleUpdateContactNotes = async () => {
    if (!selectedContact) return;

    try {
      await supabase
        .from('leads')
        .update({ notes: contactNotes })
        .eq('id', selectedContact.id);

      setSelectedContact({
        ...selectedContact,
        notes: contactNotes
      });
    } catch (error) {
      console.error("Error updating contact notes:", error);
    }
  };

  // Handler for sending a message
  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage(text);
  };

  // Handler para atualização manual (botão "Atualizar" no chat)
  const handleManualRefresh = useCallback(async () => {
    setManualLoading(true);
    try {
      await fetchContacts();
      // Se algum contato está selecionado, atualiza os messages dele também
      if (selectedContact && fetchMessages) {
        await fetchMessages();
      }
    } finally {
      setManualLoading(false);
    }
  }, [fetchContacts, fetchMessages, selectedContact]);

  // O loading do botão/área é considerado loading aut/polling OU loading manual
  return {
    contacts: whatsappContacts,
    setContacts: () => {},
    selectedContact,
    setSelectedContact,
    messages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes,
    updateContactNotes: handleUpdateContactNotes,
    sendMessage: handleSendMessage,
    isLoadingContacts: isLoadingContacts || manualLoading,
    isLoadingMessages,
    handleManualRefresh
  };
}
