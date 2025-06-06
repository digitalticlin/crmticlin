
import { useState } from "react";
import { useCompanyData } from "./useCompanyData";
import { ClientData, ClientFormData } from "./clients/types";
import { useDefaultWhatsAppInstance, useClientsQuery } from "./clients/queries";
import { useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients/mutations";

export function useRealClientManagement() {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { companyId } = useCompanyData();

  // Queries
  const defaultWhatsAppQuery = useDefaultWhatsAppInstance(companyId);
  const clientsQuery = useClientsQuery(companyId);

  // Mutations
  const updateClientMutation = useUpdateClientMutation(companyId);
  const deleteClientMutation = useDeleteClientMutation(companyId);

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientMutation.mutate(clientId);
    setIsDetailsOpen(false);
    setSelectedClient(null);
  };

  const handleUpdateNotes = (notes: string) => {
    if (!selectedClient) return;
    updateClientMutation.mutate({ 
      id: selectedClient.id, 
      data: { notes } 
    });
    setSelectedClient({ ...selectedClient, notes });
  };

  const handleUpdatePurchaseValue = (purchase_value: number | undefined) => {
    if (!selectedClient) return;
    updateClientMutation.mutate({ 
      id: selectedClient.id, 
      data: { purchase_value } 
    });
    setSelectedClient({ ...selectedClient, purchase_value });
  };

  return {
    clients: clientsQuery.data || [],
    selectedClient,
    isDetailsOpen,
    isLoading: clientsQuery.isLoading || updateClientMutation.isPending,
    setIsDetailsOpen: (open: boolean) => {
      setIsDetailsOpen(open);
      if (!open) setSelectedClient(null);
    },
    handleSelectClient,
    handleDeleteClient,
    handleUpdateNotes,
    handleUpdatePurchaseValue,
    refetch: clientsQuery.refetch,
  };
}

// Re-export types for backward compatibility
export type { ClientData, ClientFormData } from "./clients/types";
