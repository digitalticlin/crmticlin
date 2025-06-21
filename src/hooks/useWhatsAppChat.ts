
import { useState } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppDatabase } from './whatsapp/useWhatsAppDatabase';
import { useWhatsAppWebChat } from './whatsapp/useWhatsAppWebChat';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

// DEPRECATED: Use useWhatsAppWebChat instead
// This hook is kept for backward compatibility but should be replaced
export const useWhatsAppChat = (userEmail?: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get user company ID
  const { companyId } = useCompanyResolver();

  // Use database-only approach
  const { instances, getActiveInstance } = useWhatsAppDatabase();
  const activeInstance = getActiveInstance();

  // Convert WhatsAppInstance to WhatsAppWebInstance for compatibility
  const webActiveInstance = activeInstance ? {
    id: activeInstance.id,
    instance_name: activeInstance.instance_name,
    connection_type: activeInstance.connection_type || 'web',
    server_url: activeInstance.server_url || '',
    vps_instance_id: activeInstance.vps_instance_id || '',
    web_status: activeInstance.web_status || '',
    connection_status: activeInstance.connection_status,
    qr_code: activeInstance.qr_code,
    phone: activeInstance.phone,
    profile_name: activeInstance.profile_name,
    profile_pic_url: activeInstance.profile_pic_url,
    date_connected: activeInstance.date_connected,
    date_disconnected: activeInstance.date_disconnected,
    created_by_user_id: activeInstance.created_by_user_id || '',
    created_at: activeInstance.created_at || new Date().toISOString(),
    updated_at: activeInstance.updated_at || new Date().toISOString()
  } : null;

  // Use the new WhatsApp Web chat hook
  const {
    contacts,
    messages,
    sendMessage,
    loading
  } = useWhatsAppWebChat(webActiveInstance?.id || '');

  // Get contact notes
  const {
    contactNotes,
    setContactNotes,
    updateContactNotes
  } = useContactNotes(selectedContact);

  // Update selected contact with changes like notes
  const updateSelectedContactData = (updates: Partial<Contact>) => {
    if (selectedContact) {
      setSelectedContact(prevContact => {
        if (!prevContact) return null;
        return { ...prevContact, ...updates };
      });
    }
  };

  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts: loading,
    isLoadingMessages: loading,
    isSending: false,
    lastRefresh,
    contactNotes,
    setContactNotes,
    updateContactNotes,
    fetchContacts: () => {},
    fetchMessages: () => {},
    activeInstance
  };
};
