
import { ClientData } from "@/hooks/clients/types";
import { ClientsListTable } from "@/components/clients/ClientsListTable";
import { RealClientDetails } from "@/components/clients/RealClientDetails";

interface RealClientsLayoutProps {
  clients: ClientData[];
  selectedClient: ClientData | null;
  isDetailsOpen: boolean;
  isLoading?: boolean;
  onSelectClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onDetailsOpenChange: (open: boolean) => void;
}

export function RealClientsLayout({
  clients,
  selectedClient,
  isDetailsOpen,
  isLoading,
  onSelectClient,
  onDeleteClient,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onDetailsOpenChange
}: RealClientsLayoutProps) {
  return (
    <div className="space-y-6">
      <ClientsListTable 
        clients={clients}
        onSelectClient={onSelectClient}
        onEditClient={onSelectClient} // Now just opens details modal
        onDeleteClient={onDeleteClient}
        isLoading={isLoading}
      />
      
      {/* Client Details Modal */}
      {selectedClient && (
        <RealClientDetails
          client={selectedClient}
          isOpen={isDetailsOpen}
          onOpenChange={onDetailsOpenChange}
          onUpdateNotes={onUpdateNotes}
          onUpdatePurchaseValue={onUpdatePurchaseValue}
        />
      )}
    </div>
  );
}
