
import { ClientData } from "@/hooks/clients/types";
import { ClientsListTable } from "@/components/clients/ClientsListTable";
import { RealClientDetails } from "@/components/clients/RealClientDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RealClientForm } from "@/components/clients/RealClientForm";

interface RealClientsLayoutProps {
  clients: ClientData[];
  selectedClient: ClientData | null;
  isDetailsOpen: boolean;
  isFormOpen: boolean;
  isEditing: boolean;
  isLoading?: boolean;
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  onFormSubmit: (data: any) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onDetailsOpenChange: (open: boolean) => void;
  onFormOpenChange: (open: boolean) => void;
}

export function RealClientsLayout({
  clients,
  selectedClient,
  isDetailsOpen,
  isFormOpen,
  isEditing,
  isLoading,
  onSelectClient,
  onEditClient,
  onDeleteClient,
  onFormSubmit,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onDetailsOpenChange,
  onFormOpenChange
}: RealClientsLayoutProps) {
  return (
    <div className="space-y-6">
      <ClientsListTable 
        clients={clients}
        onSelectClient={onSelectClient}
        onEditClient={onEditClient}
        onDeleteClient={onDeleteClient}
        isLoading={isLoading}
      />
      
      {/* Client Details Sheet */}
      {selectedClient && (
        <RealClientDetails
          client={selectedClient}
          isOpen={isDetailsOpen}
          onOpenChange={onDetailsOpenChange}
          onEdit={onEditClient}
          onUpdateNotes={onUpdateNotes}
          onUpdatePurchaseValue={onUpdatePurchaseValue}
        />
      )}
      
      {/* Add/Edit Client Dialog */}
      <Dialog open={isFormOpen} onOpenChange={onFormOpenChange}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <RealClientForm
            client={isEditing ? selectedClient || undefined : undefined}
            onSubmit={onFormSubmit}
            onCancel={() => onFormOpenChange(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
