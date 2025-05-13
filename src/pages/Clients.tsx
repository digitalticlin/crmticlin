
import { useState, useEffect } from "react";
import { Contact } from "@/types/chat";
import Sidebar from "@/components/layout/Sidebar";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientDetails } from "@/components/clients/ClientDetails";
import { ClientForm } from "@/components/clients/ClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function Clients() {
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
        assignedUser: "Ana Costa"
      },
      {
        id: "2",
        name: "Maria Oliveira",
        phone: "+55 11 91234-5678",
        email: "maria.oliveira@email.com",
        tags: ["Potencial Cliente"],
        address: "Av. Paulista, 1000 - São Paulo, SP",
      },
      {
        id: "3",
        name: "Pedro Almeida",
        phone: "+55 11 97777-8888",
        email: "pedro.almeida@email.com",
        purchaseValue: 750,
      },
      {
        id: "4",
        name: "Ana Santos",
        phone: "+55 11 96666-5555",
        tags: ["Aguardando Proposta"],
        assignedUser: "Carlos Ferreira"
      },
      {
        id: "5",
        name: "Carlos Mendes",
        phone: "+55 11 95555-4444",
        email: "carlos.mendes@email.com",
        notes: "Cliente indicado pelo João Silva",
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <ClientsHeader onAddClient={handleAddClient} />
        
        <div className="flex-1 overflow-hidden">
          <ClientsList 
            clients={clients} 
            onSelectClient={handleSelectClient} 
          />
        </div>
        
        {/* Client Details Sheet */}
        {selectedClient && (
          <ClientDetails
            client={selectedClient}
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            onEdit={handleEditClient}
            onUpdateNotes={handleUpdateNotes}
            onUpdateAssignedUser={handleUpdateAssignedUser}
            onUpdatePurchaseValue={handleUpdatePurchaseValue}
          />
        )}
        
        {/* Add/Edit Client Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              client={isEditing ? selectedClient || undefined : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
