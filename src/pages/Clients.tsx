
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { RealClientsLayout } from "@/components/clients/RealClientsLayout";
import { useRealClientManagement } from "@/hooks/useRealClientManagement";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useDataFilters } from "@/hooks/useDataFilters";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2 } from "lucide-react";

export default function Clients() {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const dataFilters = useDataFilters();

  const {
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
  } = useRealClientManagement();

  console.log('[Clients] 🔍 Sistema de controle de acesso:', {
    role: permissions.role,
    canViewAllData: permissions.canViewAllData,
    dataFilters: dataFilters.role,
    loading: permissionsLoading || dataFilters.loading
  });

  // Loading state para permissões
  if (permissionsLoading || dataFilters.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando clientes...</span>
        </div>
      </div>
    );
  }

  // Verificar se tem permissão para acessar clientes
  if (!permissions.allowedPages.includes('clients')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar a página de clientes.</p>
        </div>
      </div>
    );
  }

  const addClientAction = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline"
        className="bg-white/20 backdrop-blur-md border-white/40 text-gray-800 hover:bg-white/30 hover:text-gray-900 rounded-xl px-4 py-2.5 font-medium shadow-lg"
        onClick={() => refetch()}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
      <Button 
        className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] rounded-xl px-6 py-2.5 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-sm"
        onClick={handleCreateClient}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Cliente
      </Button>
    </div>
  );

  return (
    <>
      <ModernPageHeader 
        title="Clientes" 
        description={
          <div className="flex flex-col gap-2">
            <p className="text-gray-600">
              {permissions.role === 'admin' 
                ? 'Gerencie todos os clientes da sua organização' 
                : 'Visualize os clientes dos recursos atribuídos a você'
              }
            </p>
            {/* Badge indicativo do tipo de acesso */}
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                permissions.role === 'admin' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {permissions.role === 'admin' ? '👑 Admin - Visão Completa' : '🎯 Operacional - Recursos Atribuídos'}
              </span>
            </div>
          </div>
        }
        action={addClientAction}
      />
      
      <RealClientsLayout 
        clients={clients}
        selectedClient={selectedClient}
        isDetailsOpen={isDetailsOpen}
        isCreateMode={isCreateMode}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMoreClients={hasMoreClients}
        totalClientsCount={totalClientsCount}
        onSelectClient={handleSelectClient}
        onDeleteClient={handleDeleteClient}
        onLoadMoreClients={loadMoreClients}
        onUpdateNotes={handleUpdateNotes}
        onUpdatePurchaseValue={handleUpdatePurchaseValue}
        onUpdateBasicInfo={handleUpdateBasicInfo}
        onUpdateDocument={handleUpdateDocument}
        onUpdateAddress={handleUpdateAddress}
        onDetailsOpenChange={setIsDetailsOpen}
        onCreateClient={handleSaveNewClient}
      />
    </>
  );
}
