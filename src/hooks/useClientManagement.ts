
import { useState, useEffect } from "react";
import { Contact } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export function useClientManagement() {
  // State for clients list
  const [clients, setClients] = useState<Contact[]>([]);
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load initial data (in a real app, this would come from an API)
  useEffect(() => {
    // For demonstration, we'll load some sample data
    const sampleClients: Contact[] = [
      {
        id: "1",
        name: "João Silva",
        phone: "+55 11 98765-4321",
        email: "joao.silva@email.com",
        tags: ["Cliente VIP", "Proposta Enviada"],
        notes: "Cliente interessado no plano premium. Agendar demonstração.",
        purchaseValue: 1500,
        assignedUser: "Ana Costa",
        createdAt: "10/04/2025",
        company: "Tech Solutions Ltda.",
        deals: [
          {
            id: "deal1",
            status: "won",
            value: 1500,
            date: "12/05/2025",
            note: "Cliente aceitou proposta do plano básico"
          }
        ]
      },
      {
        id: "2",
        name: "Maria Oliveira",
        phone: "+55 11 91234-5678",
        email: "maria.oliveira@email.com",
        tags: ["Potencial Cliente"],
        address: "Av. Paulista, 1000 - São Paulo, SP",
        createdAt: "15/03/2025",
        company: "Oliveira Consultoria"
      },
      {
        id: "3",
        name: "Pedro Almeida",
        phone: "+55 11 97777-8888",
        email: "pedro.almeida@email.com",
        purchaseValue: 750,
        createdAt: "22/02/2025",
        company: "Tech Solutions Ltda."
      },
      {
        id: "4",
        name: "Ana Santos",
        phone: "+55 11 96666-5555",
        tags: ["Aguardando Proposta"],
        assignedUser: "Carlos Ferreira",
        createdAt: "05/01/2025",
        company: "Construções Santos"
      },
      {
        id: "5",
        name: "Carlos Mendes",
        phone: "+55 11 95555-4444",
        email: "carlos.mendes@email.com",
        notes: "Cliente indicado pelo João Silva",
        createdAt: "30/04/2025"
      },
    ];
    
    setClients(sampleClients);
  }, []);

  // Handle selecting a client
  const handleSelectClient = (client: Contact) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  // Handle adding a new client
  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Handle editing a client
  const handleEditClient = (client: Contact) => {
    setSelectedClient(client);
    setIsEditing(true);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (data: any) => {
    if (isEditing && selectedClient) {
      // Update existing client
      const updatedClient = {
        ...selectedClient,
        ...data
      };
      
      setClients(clients.map(c => 
        c.id === selectedClient.id ? updatedClient : c
      ));
      
      setSelectedClient(updatedClient);
      toast.success("Cliente atualizado com sucesso");
    } else {
      // Add new client
      const newClient = {
        id: uuidv4(),
        ...data
      };
      
      setClients([...clients, newClient]);
      toast.success("Cliente adicionado com sucesso");
    }
    
    setIsFormOpen(false);
  };

  // Handle updating client notes
  const handleUpdateNotes = (notes: string) => {
    if (!selectedClient) return;
    
    const updatedClient = {
      ...selectedClient,
      notes
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
  };

  // Handle updating assigned user
  const handleUpdateAssignedUser = (assignedUser: string) => {
    if (!selectedClient) return;
    
    const updatedClient = {
      ...selectedClient,
      assignedUser
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
  };

  // Handle updating purchase value
  const handleUpdatePurchaseValue = (purchaseValue: number | undefined) => {
    if (!selectedClient) return;
    
    const updatedClient = {
      ...selectedClient,
      purchaseValue
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
  };

  return {
    clients,
    selectedClient,
    isDetailsOpen,
    isFormOpen,
    isEditing,
    setIsDetailsOpen,
    setIsFormOpen,
    handleSelectClient,
    handleAddClient,
    handleEditClient,
    handleFormSubmit,
    handleUpdateNotes,
    handleUpdateAssignedUser,
    handleUpdatePurchaseValue
  };
}
