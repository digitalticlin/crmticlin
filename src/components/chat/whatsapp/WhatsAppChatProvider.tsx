
import React, { createContext, useContext, useEffect } from "react";
import { useWhatsAppWebChatIntegrated } from "@/hooks/whatsapp/useWhatsAppWebChatIntegrated";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useSearchParams } from "react-router-dom";
import { useWhatsAppDatabase } from "@/hooks/whatsapp/useWhatsAppDatabase";
import { toast } from 'sonner';

interface WhatsAppChatContextType extends ReturnType<typeof useWhatsAppWebChatIntegrated> {
  companyLoading: boolean;
  instanceHealth: {
    score: number;
    isHealthy: boolean;
    connectedInstances: number;
    totalInstances: number;
  };
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType | null>(null);

export const useWhatsAppChatContext = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error("useWhatsAppChatContext must be used within WhatsAppChatProvider");
  }
  return context;
};

export const WhatsAppChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { userId, loading: companyLoading } = useCompanyData();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  // Usar sistema de banco de dados estabilizado
  const { 
    instances, 
    getActiveInstance, 
    healthScore, 
    isHealthy,
    totalInstances,
    connectedInstances
  } = useWhatsAppDatabase();
  
  const activeInstance = getActiveInstance();

  console.log('[WhatsAppChatProvider] Usando sistema integrado, instância ativa:', activeInstance?.instance_name);

  // Verificar saúde antes de permitir chat
  useEffect(() => {
    if (activeInstance && !isHealthy) {
      toast.warning(`⚠️ Saúde das conexões: ${healthScore}% - Podem ocorrer instabilidades`);
    }
    
    if (totalInstances > 0 && connectedInstances === 0) {
      toast.error('🚨 Nenhuma instância WhatsApp conectada - Chat indisponível');
    }

    // Notificar quando webhook estiver configurado
    if (activeInstance && ['open', 'ready'].includes(activeInstance.connection_status)) {
      toast.success('🔔 Sistema de mensagens ativo - Recebimento automático habilitado');
    }
  }, [activeInstance, isHealthy, healthScore, totalInstances, connectedInstances]);

  const chatData = useWhatsAppWebChatIntegrated(activeInstance);

  // Auto-selecionar contato quando leadId for fornecido via URL
  useEffect(() => {
    if (leadId && chatData.contacts.length > 0 && !chatData.selectedContact) {
      const targetContact = chatData.contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        console.log('[WhatsApp Chat] Auto-selecionando contato do funil:', targetContact.name);
        chatData.setSelectedContact(targetContact);
      }
    }
  }, [leadId, chatData.contacts, chatData.selectedContact, chatData.setSelectedContact]);

  const value: WhatsAppChatContextType = {
    ...chatData,
    companyLoading,
    instanceHealth: {
      score: healthScore,
      isHealthy,
      connectedInstances,
      totalInstances
    }
  };

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
};
