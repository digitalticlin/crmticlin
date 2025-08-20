
import { ClientData } from "@/hooks/clients/types";
import { ClientsListTable } from "@/components/clients/ClientsListTable";
import { RealClientDetails } from "@/components/clients/RealClientDetails";

interface RealClientsLayoutProps {
  clients: ClientData[];
  selectedClient: ClientData | null;
  isDetailsOpen: boolean;
  isCreateMode?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreClients?: boolean;
  totalClientsCount?: number;
  onSelectClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  onLoadMoreClients?: () => Promise<void>;
  onSearchChange?: (query: string) => void;
  onUpdateNotes?: (notes: string) => void;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
  onUpdateBasicInfo?: (data: { name: string; email: string; company: string }) => void;
  onUpdateDocument?: (data: { document_type: 'cpf' | 'cnpj'; document_id: string }) => void;
  onUpdateAddress?: (data: { 
    address: string; 
    bairro: string;
    city: string; 
    state: string; 
    country: string; 
    zip_code: string 
  }) => void;
  onDetailsOpenChange: (open: boolean) => void;
  onCreateClient?: (data: Partial<ClientData>) => void;
}

export function RealClientsLayout({
  clients,
  selectedClient,
  isDetailsOpen,
  isCreateMode = false,
  isLoading,
  isLoadingMore,
  hasMoreClients,
  totalClientsCount,
  onSelectClient,
  onDeleteClient,
  onLoadMoreClients,
  onSearchChange,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateBasicInfo,
  onUpdateDocument,
  onUpdateAddress,
  onDetailsOpenChange,
  onCreateClient
}: RealClientsLayoutProps) {
  return (
    <div className="space-y-6">
      <ClientsListTable 
        clients={clients}
        onSelectClient={onSelectClient}
        onEditClient={onSelectClient}
        onDeleteClient={onDeleteClient}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMoreClients={hasMoreClients}
        onLoadMoreClients={onLoadMoreClients}
        totalClientsCount={totalClientsCount}
        onServerSearch={onSearchChange}
      />
      
      <RealClientDetails
        client={selectedClient}
        isOpen={isDetailsOpen}
        isCreateMode={isCreateMode}
        onOpenChange={onDetailsOpenChange}
        onUpdateNotes={onUpdateNotes}
        onUpdatePurchaseValue={onUpdatePurchaseValue}
        onUpdateBasicInfo={onUpdateBasicInfo}
        onUpdateDocument={onUpdateDocument}
        onUpdateAddress={onUpdateAddress}
        onCreateClient={onCreateClient}
      />
    </div>
  );
}
