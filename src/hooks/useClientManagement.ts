
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSelectClient = (client: Contact) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleAddClient = () => {
    setIsFormOpen(true);
    setIsEditing(false);
  };

  const handleEditClient = (client: Contact) => {
    setSelectedClient(client);
    setIsFormOpen(true);
    setIsEditing(true);
  };

  const handleFormSubmit = (clientData: Partial<Contact>) => {
    if (isEditing && selectedClient) {
      updateClient(selectedClient.id, clientData);
    } else {
      const newClient: Contact = {
        id: Date.now().toString(),
        name: clientData.name || '',
        phone: clientData.phone || '',
        email: clientData.email,
        address: clientData.address,
        company: clientData.company,
        documentId: clientData.documentId,
        tags: clientData.tags || [],
        notes: clientData.notes || '',
        assignedUser: clientData.assignedUser || '',
        lastMessageTime: new Date().toISOString(),
        lastMessage: '',
        avatar: '',
        createdAt: new Date().toISOString(),
        deals: []
      };
      setClients(prev => [...prev, newClient]);
    }
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleUpdateNotes = (notes: string) => {
    if (selectedClient) {
      updateClient(selectedClient.id, { notes });
    }
  };

  const handleUpdateAssignedUser = (user: string) => {
    if (selectedClient) {
      updateClient(selectedClient.id, { assignedUser: user });
    }
  };

  const handleUpdatePurchaseValue = (value: number) => {
    // Esta função está sendo mantida para compatibilidade, mas não faz nada
    // pois removemos purchaseValue do tipo Contact
    console.log('Purchase value update requested:', value);
  };

  return {
    clients,
    selectedClient,
    isDetailsOpen,
    isFormOpen,
    isEditing,
    setIsDetailsOpen,
    setIsFormOpen,
    updateClient,
    openClientDetails,
    closeClientDetails,
    handleSelectClient,
    handleAddClient,
    handleEditClient,
    handleFormSubmit,
    handleUpdateNotes,
    handleUpdateAssignedUser,
    handleUpdatePurchaseValue
  };
};
