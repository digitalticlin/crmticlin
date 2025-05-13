
import { supabase } from "@/integrations/supabase/client";
import { Contact, Message } from "@/types/chat";

interface WhatsAppChat {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl: string | null;
  updatedAt: string;
}

interface WhatsAppMessage {
  id: string;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  pushName: string;
  messageType: string;
  message: any;
  messageTimestamp: number;
  status?: string;
  MessageUpdate?: Array<{status: string}>;
}

/**
 * Hook for chat database operations
 */
export const useChatDatabase = () => {
  /**
   * Saves WhatsApp chats as leads in the database
   */
  const saveChatsAsLeads = async (
    companyId: string,
    whatsappNumberId: string,
    chats: WhatsAppChat[]
  ) => {
    if (!chats.length) return [];

    try {
      const savedLeads: Contact[] = [];
      
      for (const chat of chats) {
        // Skip group chats
        if (chat.remoteJid.includes('@g.us')) continue;
        
        // Extract phone number from JID
        const phone = extractPhoneFromJid(chat.remoteJid);
        if (!phone) continue;
        
        // Check if lead already exists
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', phone)
          .eq('company_id', companyId)
          .limit(1);
        
        if (existingLeads && existingLeads.length > 0) {
          // Update existing lead with last activity
          const { data: updatedLead } = await supabase
            .from('leads')
            .update({
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLeads[0].id)
            .select()
            .single();
            
          if (updatedLead) {
            savedLeads.push(mapLeadToContact(updatedLead));
          }
        } else {
          // Create new lead
          const { data: newLead } = await supabase
            .from('leads')
            .insert({
              name: chat.pushName || `Contato: ${formatPhoneNumber(phone)}`,
              phone,
              company_id: companyId,
              whatsapp_number_id: whatsappNumberId
            })
            .select()
            .single();
            
          if (newLead) {
            savedLeads.push(mapLeadToContact(newLead));
          }
        }
      }
      
      return savedLeads;
    } catch (error) {
      console.error("Error saving chats as leads:", error);
      return [];
    }
  };

  /**
   * Saves WhatsApp messages to the database
   */
  const saveMessages = async (
    leadId: string,
    whatsappNumberId: string,
    messages: WhatsAppMessage[]
  ) => {
    if (!messages.length) return [];

    try {
      const savedMessages: Message[] = [];
      
      for (const msg of messages) {
        // Skip non-text messages for now
        if (!msg.message || (!msg.message.conversation && !msg.message.extendedTextMessage)) {
          continue;
        }
        
        const text = msg.message.conversation || 
                     (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || 
                     "";
        
        if (!text) continue;
        
        // Get message status from MessageUpdate if available
        let status = "sent";
        if (msg.MessageUpdate && msg.MessageUpdate.length > 0) {
          const lastUpdate = msg.MessageUpdate[msg.MessageUpdate.length - 1];
          if (lastUpdate.status === "READ") {
            status = "read";
          } else if (lastUpdate.status === "DELIVERY_ACK") {
            status = "delivered";
          }
        }
        
        // Check if message already exists
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('external_id', msg.key.id)
          .limit(1);
        
        if (existingMessages && existingMessages.length > 0) {
          // Update message status if needed
          if (existingMessages[0].status !== status) {
            await supabase
              .from('messages')
              .update({ status })
              .eq('id', existingMessages[0].id);
          }
          
          savedMessages.push(mapDbMessageToMessage(existingMessages[0]));
        } else {
          // Create new message
          const { data: newMessage } = await supabase
            .from('messages')
            .insert({
              lead_id: leadId,
              whatsapp_number_id: whatsappNumberId,
              from_me: msg.key.fromMe,
              text,
              timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
              status,
              external_id: msg.key.id
            })
            .select()
            .single();
            
          if (newMessage) {
            savedMessages.push(mapDbMessageToMessage(newMessage));
          }
        }
      }
      
      // Update lead's last message
      if (savedMessages.length > 0) {
        const lastMessage = savedMessages[savedMessages.length - 1];
        
        await supabase
          .from('leads')
          .update({
            last_message: lastMessage.text,
            last_message_time: lastMessage.time,
            unread_count: 0  // Reset unread count when fetching messages
          })
          .eq('id', leadId);
      }
      
      return savedMessages;
    } catch (error) {
      console.error("Error saving messages:", error);
      return [];
    }
  };

  /**
   * Helper function to extract phone number from WhatsApp JID
   */
  const extractPhoneFromJid = (jid: string): string | null => {
    const match = jid.match(/(\d+)@s\.whatsapp\.net/);
    return match ? match[1] : null;
  };

  /**
   * Helper function to format phone number for display
   */
  const formatPhoneNumber = (phone: string): string => {
    // Simple formatting, can be enhanced for different country codes
    if (phone.startsWith('55')) {
      // Brazilian format
      if (phone.length === 12 || phone.length === 13) {
        // With area code
        const areaCode = phone.substring(2, 4);
        const firstPart = phone.substring(4, phone.length - 4);
        const lastPart = phone.substring(phone.length - 4);
        return `+55 ${areaCode} ${firstPart}-${lastPart}`;
      }
    }
    return `+${phone}`;
  };

  /**
   * Map database lead to contact object
   */
  const mapLeadToContact = (lead: any): Contact => {
    return {
      id: lead.id,
      name: lead.name || "Sem nome",
      phone: formatPhoneNumber(lead.phone),
      email: lead.email || "",
      address: lead.address || "",
      company: lead.company || "",
      notes: lead.notes || "",
      lastMessage: lead.last_message || "",
      lastMessageTime: lead.last_message_time 
        ? new Date(lead.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : "Agora",
      unreadCount: lead.unread_count || 0,
      avatar: "", // No avatar in database yet
      isOnline: false // We don't track online status yet
    };
  };

  /**
   * Map database message to message object
   */
  const mapDbMessageToMessage = (dbMessage: any): Message => {
    return {
      id: dbMessage.id,
      text: dbMessage.text,
      sender: dbMessage.from_me ? "user" : "contact",
      time: new Date(dbMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: dbMessage.status,
      isIncoming: !dbMessage.from_me,
      fromMe: dbMessage.from_me
    };
  };

  return {
    saveChatsAsLeads,
    saveMessages,
    formatPhoneNumber,
    mapLeadToContact,
    mapDbMessageToMessage
  };
};
