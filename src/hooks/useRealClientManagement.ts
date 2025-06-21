
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientData, ClientFormData } from "./clients/types";
import { useDefaultWhatsAppInstance, useClientsQuery } from "./clients/queries";
import { useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients/mutations";
import { toast } from "sonner";

export function useRealClientManagement() {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  // Queries
  const defaultWhatsAppQuery = useDefaultWhatsAppInstance(userId || null);
  const clientsQuery = useClientsQuery(userId || null);

  // Mutations
  const createClientMutation = useCreateClientMutation(userId || '');
  const updateClientMutation = useUpdateClientMutation(userId || '');
  const deleteClientMutation = useDeleteClientMutation(userId || '');

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsCreateMode(false);
    setIsDetailsOpen(true);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setIsCreateMode(true);
    setIsDetailsOpen(true);
  };

  const handleSaveNewClient = async (data: Partial<ClientData>) => {
    try {
      await createClientMutation.mutateAsync(data as ClientFormData);
      setIsDetailsOpen(false);
      setIsCreateMode(false);
      clientsQuery.refetch();
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    }
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
      
      const updatedClient = { ...selectedClient, notes };
      setSelectedClient(updatedClient);
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
      
      const updatedClient = { ...selectedClient, purchase_value };
      setSelectedClient(updatedClient);
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
      
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
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
      
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
      clientsQuery.refetch();
      toast.success("Informações do documento atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      toast.error("Erro ao atualizar informações do documento");
    }
  };

  const handleUpdateAddress = async (data: { 
    address: string; 
  }) => {
    if (!selectedClient) return;
    
    try {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data
      });
      
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
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
    isCreateMode,
    isLoading: clientsQuery.isLoading || updateClientMutation.isPending || createClientMutation.isPending,
    setIsDetailsOpen: (open: boolean) => {
      setIsDetailsOpen(open);
      if (!open) {
        setSelectedClient(null);
        setIsCreateMode(false);
      }
    },
    handleSelectClient,
    handleCreateClient,
    handleSaveNewClient,
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
