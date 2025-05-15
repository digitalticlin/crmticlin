
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types/chat";
import { KanbanLead } from "@/types/kanban";

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages: () => Promise<void>; // fetchMessages can be undefined
  receiveNewLead: (leadData: Omit<KanbanLead, "id" | "name" | "columnId">) => void;
}

/**
 * Garante que, ao receber insert/update do lead selecionado, o chat busque imediatamente as novas mensagens.
 */
export function useRealtimeLeads({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
}: UseRealtimeLeadsProps) {
  useEffect(() => {
    const leadsChannel = supabase
      .channel('public:leads:chat_subscription')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        async (payload) => {
          console.log('Novo lead recebido (realtime):', payload);
          const newLeadData = payload.new as {
            id: string;
            name: string;
            phone: string;
            last_message: string | null;
            last_message_time: string | null;
          };

          if (newLeadData && newLeadData.phone) {
            try {
              receiveNewLead({
                phone: newLeadData.phone,
                lastMessage: newLeadData.last_message || "",
                lastMessageTime: newLeadData.last_message_time
                  ? new Date(newLeadData.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "Agora",
                tags: [],
              });
              await fetchContacts();
            } catch (error) {
              console.error("Erro ao processar novo lead (realtime):", error);
            }
          }

          // Traga mensagens imediatamente se esse contato estiver selecionado (caso o contato recém-criado corresponda)
          if (selectedContact && newLeadData.id === selectedContact.id && fetchMessages) {
            await fetchMessages();
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
          console.log('Lead atualizado (realtime):', payload);
          if (selectedContact && payload.new.id === selectedContact.id) {
            // Se o lead selecionado foi alterado, busque as mensagens
            if (fetchMessages) {
              await fetchMessages();
            }
          }
          // Sempre faça refresh dos contatos no update
          await fetchContacts();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to leads changes for chat.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
          console.error('Realtime leads subscription error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [fetchContacts, fetchMessages, selectedContact, receiveNewLead]);
}

