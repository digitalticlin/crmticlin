
import { useState } from 'react';
import { Contact } from '@/types/chat';

export const useClientManagement = () => {
  const [clients, setClients] = useState<Contact[]>([
    {
      id: "1",
      name: "Ana Silva",
      phone: "+55 11 99999-1234",
      email: "ana.silva@email.com",
      address: "Rua das Flores, 123, São Paulo - SP",
      company: "Tech Solutions",
      documentId: "123.456.789-01",
      tags: ["VIP", "Cliente Ativo"],
      notes: "Cliente muito satisfeita com os serviços. Sempre pontual nos pagamentos.",
      assignedUser: "João Santos",
      lastMessageTime: "2024-01-15",
      lastMessage: "Obrigada pelo excelente trabalho!",
      avatar: "",
      createdAt: "2024-01-15T08:00:00Z",
      deals: [
        {
          id: "d1",
          status: "won",
          value: 15000,
          date: "2024-01-10",
          note: "Projeto de e-commerce concluído com sucesso"
        }
      ]
    },
    {
      id: "2",
      name: "Carlos Mendes", 
      phone: "+55 11 98888-5678",
      email: "carlos.mendes@empresa.com",
      address: "Av. Paulista, 456, São Paulo - SP",
      company: "Inovação Ltda",
      documentId: "987.654.321-09",
      tags: ["Cliente Premium"],
      notes: "Cliente corporativo com demandas regulares. Boa relação comercial.",
      assignedUser: "Maria Costa",
      lastMessageTime: "2024-01-16",
      lastMessage: "Vamos agendar a próxima fase do projeto.",
      avatar: "",
      createdAt: "2024-01-16T09:00:00Z",
      deals: [
        {
          id: "d2",
          status: "won",
          value: 25000,
          date: "2024-01-05",
          note: "Sistema de gestão implementado"
        }
      ]
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const updateClient = (clientId: string, updates: Partial<Contact>) => {
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    ));
    
    if (selectedClient?.id === clientId) {
      setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const openClientDetails = (client: Contact) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setIsDetailsOpen(false);
  };

  return {
    clients,
    selectedClient,
    isDetailsOpen,
    updateClient,
    openClientDetails,
    closeClientDetails
  };
};
