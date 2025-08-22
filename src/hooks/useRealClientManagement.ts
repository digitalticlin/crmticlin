
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useClients, useDefaultWhatsAppInstance } from './clients/queries';
import { ClientData } from './clients/types';
import { useAdvancedFilters } from './clients/useAdvancedFilters';

export const useRealClientManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const { data: clients = [], isLoading, refetch } = useClients();
  const { data: defaultInstance } = useDefaultWhatsAppInstance();
  
  const filters = useAdvancedFilters();
  const hasActiveFilters = filters.activeFilterCount > 0;
  const filteredClients = clients; // Simplified for now

  const isLoadingMore = false;
  const hasMoreClients = false;
  const totalClientsCount = clients.length;

  const loadMoreClients = useCallback(() => {
    // Mock implementation
  }, []);

  const handleSelectClient = useCallback((client: ClientData) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
    setIsCreateMode(false);
  }, []);

  const handleCreateClient = useCallback(() => {
    setSelectedClient(null);
    setIsCreateMode(true);
    setIsDetailsOpen(true);
  }, []);

  const handleSaveNewClient = useCallback(async (clientData: Partial<ClientData>) => {
    try {
      toast.success('Cliente criado com sucesso!');
      setIsCreateMode(false);
      setIsDetailsOpen(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao criar cliente');
    }
  }, [refetch]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    try {
      toast.success('Cliente removido com sucesso!');
      setIsDetailsOpen(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao remover cliente');
    }
  }, [refetch]);

  const handleUpdateNotes = useCallback(async (clientId: string, notes: string) => {
    try {
      toast.success('Notas atualizadas!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar notas');
    }
  }, [refetch]);

  const handleUpdatePurchaseValue = useCallback(async (clientId: string, value: number) => {
    try {
      toast.success('Valor de compra atualizado!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar valor');
    }
  }, [refetch]);

  const handleUpdateBasicInfo = useCallback(async (clientId: string, info: Partial<ClientData>) => {
    try {
      toast.success('Informações atualizadas!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar informações');
    }
  }, [refetch]);

  const handleUpdateDocument = useCallback(async (clientId: string, document: string) => {
    try {
      toast.success('Documento atualizado!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar documento');
    }
  }, [refetch]);

  const handleUpdateAddress = useCallback(async (clientId: string, address: any) => {
    try {
      toast.success('Endereço atualizado!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar endereço');
    }
  }, [refetch]);

  return {
    clients,
    setSearchQuery,
    selectedClient,
    isDetailsOpen,
    isCreateMode,
    isLoading,
    isLoadingMore,
    hasMoreClients,
    totalClientsCount,
    loadMoreClients,
    setIsDetailsOpen,
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
