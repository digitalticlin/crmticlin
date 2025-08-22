
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientData, ClientFormData } from "./clients/types";
import { useDefaultWhatsAppInstance, useClientsQuery } from "./clients/queries";
import { useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients/mutations";
import { useAdvancedFilters } from "@/hooks/clients/useAdvancedFilters";
import { toast } from "sonner";

export function useRealClientManagement() {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  const { filters, hasActiveFilters, filteredClients: advancedFilteredClients } = useAdvancedFilters();

  const defaultWhatsAppQuery = useDefaultWhatsAppInstance(userId || null);
  const clientsQuery = useClientsQuery(userId || null, searchQuery);

  const createClientMutation = useCreateClientMutation(userId || '');
  const updateClientMutation = useUpdateClientMutation(userId || '');
  const deleteClientMutation = useDeleteClientMutation(userId || '');

  const clients = useMemo(() => {
    if (!clientsQuery.data?.pages) return [];
    
    return clientsQuery.data.pages.flatMap(page => page.data);
  }, [clientsQuery.data?.pages]);

  const filteredClients = useMemo(() => {
    if (hasActiveFilters) {
      return advancedFilteredClients || [];
    }
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, advancedFilteredClients, hasActiveFilters, searchQuery]);

  const hasMoreClients = useMemo(() => {
    if (hasActiveFilters) {
      return false;
    }
    
    const lastPage = clientsQuery.data?.pages?.[clientsQuery.data.pages.length - 1];
    return lastPage?.hasMore ?? false;
  }, [clientsQuery.data?.pages, hasActiveFilters]);

  const totalClientsCount = useMemo(() => {
    if (hasActiveFilters) {
      return filteredClients.length;
    }
    
    const firstPage = clientsQuery.data?.pages?.[0];
    return firstPage?.totalCount || clients.length;
  }, [clientsQuery.data?.pages, clients.length, filteredClients.length, hasActiveFilters]);

  const loadMoreClients = async () => {
    if (hasActiveFilters) {
      return;
    }
    
    if (!clientsQuery.isFetchingNextPage && hasMoreClients) {
      console.log('[RealClientManagement] 📄 Carregando próxima página...');
      await clientsQuery.fetchNextPage();
    }
  };

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
    bairro: string;
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
      
      const updatedClient = { ...selectedClient, ...data };
      setSelectedClient(updatedClient);
      clientsQuery.refetch();
      toast.success("Endereço atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
      toast.error("Erro ao atualizar endereço");
    }
  };

  const refetch = async () => {
    await clientsQuery.refetch();
  };

  return {
    clients: filteredClients,
    setSearchQuery,
    selectedClient,
    isDetailsOpen,
    isCreateMode,
    isLoading: clientsQuery.isLoading || updateClientMutation.isPending || createClientMutation.isPending,
    isLoadingMore: clientsQuery.isFetchingNextPage,
    hasMoreClients,
    loadMoreClients,
    totalClientsCount,
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
    refetch,
  };
};

export type { ClientData, ClientFormData } from "./clients/types";
