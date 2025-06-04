
import { Contact } from "@/types/chat";
import { ModernClientsList } from "@/components/clients/ModernClientsList";
import { ClientDetails } from "@/components/clients/ClientDetails";
import { ClientDialogs } from "@/components/clients/ClientDialogs";

interface ModernClientsLayoutProps {
  clients: Contact[];
  selectedClient: Contact | null;
  isDetailsOpen: boolean;
  isFormOpen: boolean;
  isEditing: boolean;
  onSelectClient: (client: Contact) => void;
  onAddClient: () => void;
  onEditClient: (client: Contact) => void;
  onFormSubmit: (data: any) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onDetailsOpenChange: (open: boolean) => void;
  onFormOpenChange: (open: boolean) => void;
}

export function ModernClientsLayout({
  clients,
  selectedClient,
  isDetailsOpen,
  isFormOpen,
  isEditing,
  onSelectClient,
  onAddClient,
  onEditClient,
  onFormSubmit,
  onUpdateNotes,
  onUpdateAssignedUser,
  onUpdatePurchaseValue,
  onDetailsOpenChange,
  onFormOpenChange
}: ModernClientsLayoutProps) {
  const handleUpdateContact = (updates: Partial<Contact>) => {
    if (selectedClient) {
      // Implementar lógica de atualização aqui
      console.log('Updating contact:', updates);
    }
  };

  return (
    <div className="space-y-6">
      <ModernClientsList 
        clients={clients} 
        onSelectClient={onSelectClient} 
      />
      
      {/* Client Details Sheet */}
      {selectedClient && (
        <ClientDetails
          selectedContact={selectedClient}
          isOpen={isDetailsOpen}
          onClose={() => onDetailsOpenChange(false)}
          onUpdateContact={handleUpdateContact}
        />
      )}
      
      {/* Add/Edit Client Dialog */}
      <ClientDialogs
        selectedClient={selectedClient}
        isFormOpen={isFormOpen}
        isEditing={isEditing}
        onOpenChange={onFormOpenChange}
        onFormSubmit={onFormSubmit}
      />
    </div>
  );
}
