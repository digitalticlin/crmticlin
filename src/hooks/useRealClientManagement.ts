
import { useState } from "react";
import { useCompanyData } from "./useCompanyData";
import { ClientData, ClientFormData } from "./clients/types";
import { useDefaultWhatsAppInstance, useClientsQuery } from "./clients/queries";
import { useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients/mutations";
import { toast } from "sonner";

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

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({ 
        id: selectedClient.id, 
        data: { notes } 
      });
      
      // Atualizar estado local imediatamente
      const updatedClient = { ...selectedClient, notes };
      setSelectedClient(updatedClient);
      
      // Invalidar queries para atualizar a lista
      clientsQuery.refetch();
    } catch (error) {
      console.error("Erro ao atualizar notes:", error);
    }
  };

  const handleUpdatePurchaseValue = async (purchase_value: number | undefined) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({ 
        id: selectedClient.id, 
        data: { purchase_value } 
      });
      
      // Atualizar estado local imediatamente
      const updatedClient = { ...selectedClient, purchase_value };
      setSelectedClient(updatedClient);
      
      // Invalidar queries para atualizar a lista
      clientsQuery.refetch();
    } catch (error) {
      console.error("Erro ao atualizar purchase_value:", error);
    }
  };

  const handleUpdateBasicInfo = async (data: { name: string; email: string; company: string }) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data
      });
      
      // Atualizar estado local imediatamente
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
      
      // Invalidar queries para atualizar a lista
      clientsQuery.refetch();
      
      toast.success("Informações básicas atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar informações básicas:", error);
      toast.error("Erro ao atualizar informações básicas");
    }
  };

  const handleUpdateDocument = async (data: { document_type: 'cpf' | 'cnpj'; document_id: string }) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data
      });
      
      // Atualizar estado local imediatamente
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
      
      // Invalidar queries para atualizar a lista
      clientsQuery.refetch();
      
      toast.success("Informações do documento atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      toast.error("Erro ao atualizar informações do documento");
    }
  };

  const handleUpdateAddress = async (data: { 
    address: string; 
    city: string; 
    state: string; 
    country: string; 
    zip_code: string 
  }) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data
      });
      
      // Atualizar estado local imediatamente
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
      
      // Invalidar queries para atualizar a lista
      clientsQuery.refetch();
      
      toast.success("Endereço atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
      toast.error("Erro ao atualizar endereço");
    }
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
    handleUpdateBasicInfo,
    handleUpdateDocument,
    handleUpdateAddress,
    refetch: clientsQuery.refetch,
  };
}

// Re-export types for backward compatibility
export type { ClientData, ClientFormData } from "./clients/types";
