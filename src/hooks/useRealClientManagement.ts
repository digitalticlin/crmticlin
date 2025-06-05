
import { useState } from "react";
import { useCompanyData } from "./useCompanyData";
import { ClientData, ClientFormData } from "./clients/types";
import { useDefaultWhatsAppInstance, useClientsQuery } from "./clients/queries";
import { useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients/mutations";

export function useRealClientManagement() {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { companyId } = useCompanyData();

  // Queries
  const defaultWhatsAppQuery = useDefaultWhatsAppInstance(companyId);
  const clientsQuery = useClientsQuery(companyId);

  // Mutations
  const createClientMutation = useCreateClientMutation(companyId, defaultWhatsAppQuery.data?.id || null);
  const updateClientMutation = useUpdateClientMutation(companyId);
  const deleteClientMutation = useDeleteClientMutation(companyId);

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsEditing(true);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: ClientFormData) => {
    if (isEditing && selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
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
  };

  const handleUpdatePurchaseValue = (purchase_value: number | undefined) => {
    if (!selectedClient) return;
    updateClientMutation.mutate({ 
      id: selectedClient.id, 
      data: { purchase_value } 
    });
  };

  return {
    clients: clientsQuery.data || [],
    selectedClient,
    isDetailsOpen,
    isFormOpen,
    isEditing,
    isLoading: clientsQuery.isLoading || createClientMutation.isPending || updateClientMutation.isPending,
    setIsDetailsOpen: (open: boolean) => {
      setIsDetailsOpen(open);
      if (!open) setSelectedClient(null);
    },
    setIsFormOpen: (open: boolean) => {
      setIsFormOpen(open);
      if (!open) {
        setSelectedClient(null);
        setIsEditing(false);
      }
    },
    handleSelectClient,
    handleAddClient,
    handleEditClient,
    handleFormSubmit,
    handleDeleteClient,
    handleUpdateNotes,
    handleUpdatePurchaseValue,
    refetch: clientsQuery.refetch,
  };
}

// Re-export types for backward compatibility
export type { ClientData, ClientFormData } from "./clients/types";
