
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppMessage, WhatsAppContact } from "@/types/whatsapp";
import { toast } from "sonner";

export function useWhatsAppWebChat(instanceId: string) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !instanceId) return;

    const fetchContacts = async () => {
      try {
        // Fetch leads as contacts (since we don't have a separate contacts table)
        const { data: leads, error } = await supabase
          .from("leads")
          .select("*")
          .eq("whatsapp_number_id", instanceId);

        if (error) throw error;

        const transformedContacts: WhatsAppContact[] = (leads || []).map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          profile_pic_url: undefined,
          last_message: lead.last_message,
          last_message_time: lead.last_message_time,
          unread_count: lead.unread_count || 0,
          whatsapp_number_id: lead.whatsapp_number_id,
          created_by_user_id: lead.created_by_user_id,
          created_at: lead.created_at,
          updated_at: lead.updated_at
        }));

        setContacts(transformedContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Erro ao carregar contatos");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user?.id, instanceId]);

  useEffect(() => {
    if (!selectedContact || !user?.id) return;

    const fetchMessages = async () => {
      try {
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
          .eq("lead_id", selectedContact.id)
          .eq("whatsapp_number_id", instanceId)
          .order("timestamp", { ascending: true });

        if (error) throw error;

        setMessages(messagesData || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Erro ao carregar mensagens");
      }
    };

    fetchMessages();
  }, [selectedContact, instanceId, user?.id]);

  const sendMessage = async (text: string) => {
    if (!selectedContact || !user?.id) return;

    try {
      const messageData = {
        whatsapp_number_id: instanceId,
        lead_id: selectedContact.id,
        text,
        from_me: true,
        created_by_user_id: user.id,
        timestamp: new Date().toISOString(),
        status: "sent" as const
      };

      const { error } = await supabase
        .from("messages")
        .insert([messageData]);

      if (error) throw error;

      // Update local messages state
      setMessages(prev => [...prev, {
        id: Date.now().toString(), // Temporary ID
        ...messageData,
        created_at: messageData.timestamp
      }]);

      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  return {
    contacts,
    messages,
    selectedContact,
    setSelectedContact,
    sendMessage,
    loading
  };
}
