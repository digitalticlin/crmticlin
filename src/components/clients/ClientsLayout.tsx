
import { Contact } from "@/types/chat";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientDetails } from "@/components/clients/ClientDetails";
import { ClientDialogs } from "@/components/clients/ClientDialogs";

interface ClientsLayoutProps {
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

export function ClientsLayout({
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
}: ClientsLayoutProps) {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <ClientsHeader onAddClient={onAddClient} />
      
      <div className="flex-1 overflow-hidden">
        <ClientsList 
          clients={clients} 
          onSelectClient={onSelectClient} 
        />
      </div>
      
      {/* Client Details Sheet */}
      {selectedClient && (
        <ClientDetails
          client={selectedClient}
          isOpen={isDetailsOpen}
          onOpenChange={onDetailsOpenChange}
          onEdit={onEditClient}
          onUpdateNotes={onUpdateNotes}
          onUpdateAssignedUser={onUpdateAssignedUser}
          onUpdatePurchaseValue={onUpdatePurchaseValue}
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
    </main>
  );
}
