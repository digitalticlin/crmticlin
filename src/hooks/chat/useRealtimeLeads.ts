/**
 * 🚀 HOOK SIMPLIFICADO PARA REALTIME DE LEADS
 * 
 * ⚠️ DEPRECIADO: Este hook será substituído pelo sistema modular
 * useChatsRealtime + useMessagesRealtime
 * 
 * Mantido temporariamente para compatibilidade durante migração
 */

import { useEffect, useRef, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => void;
  fetchMessages?: () => void;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null;
}

export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId
}: UseRealtimeLeadsProps) => {
  
  console.log('[useRealtimeLeads] ⚠️ DEPRECIADO: Este hook será substituído pelo sistema modular');
  
  // ✅ FUNCIONALIDADE MÍNIMA - APENAS LOGS
  useEffect(() => {
    if (activeInstanceId) {
      console.log('[useRealtimeLeads] 📡 Sistema simplificado ativo para instância:', activeInstanceId);
    }
    
    return () => {
      console.log('[useRealtimeLeads] 🔌 Cleanup simplificado');
    };
  }, [activeInstanceId]);

  // ✅ RETORNAR INTERFACE COMPATÍVEL (sem funcionalidade real)
  return {
    isConnected: !!activeInstanceId,
    activeChannels: activeInstanceId ? 1 : 0
  };
};
