
import { ClientData } from "@/hooks/clients/types";
import { ClientsListTable } from "@/components/clients/ClientsListTable";
import { UniversalLeadDetailSidebar } from "@/components/universal/UniversalLeadDetailSidebar";
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
  
  const handleUpdateClient = (updates: Partial<ClientData>) => {
    if (updates.notes !== undefined) {
      onUpdateNotes(updates.notes);
    }
    if (updates.purchase_value !== undefined) {
      onUpdatePurchaseValue(updates.purchase_value);
    }
    // Adicionar outros updates conforme necessário
  };

  return (
    <div className="space-y-6">
      <ClientsListTable 
        clients={clients}
        onSelectClient={onSelectClient}
        onEditClient={onEditClient}
        onDeleteClient={onDeleteClient}
        isLoading={isLoading}
      />
      
      {/* Universal Client Details Sidebar */}
      {selectedClient && (
        <UniversalLeadDetailSidebar
          data={selectedClient}
          dataType="client"
          isOpen={isDetailsOpen}
          onOpenChange={onDetailsOpenChange}
          onUpdateClient={handleUpdateClient}
          onUpdateNotes={onUpdateNotes}
          onUpdatePurchaseValue={onUpdatePurchaseValue}
        />
      )}
      
      {/* Add/Edit Client Dialog with Glassmorphism */}
      <Dialog open={isFormOpen} onOpenChange={onFormOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] hover:bg-white/40 animate-fade-in">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <RealClientForm
              client={isEditing ? selectedClient || undefined : undefined}
              onSubmit={onFormSubmit}
              onCancel={() => onFormOpenChange(false)}
              isLoading={isLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
