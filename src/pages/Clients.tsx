
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { RealClientsLayout } from "@/components/clients/RealClientsLayout";
import { useRealClientManagement } from "@/hooks/useRealClientManagement";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

export default function Clients() {
  const {
    clients,
    selectedClient,
    isDetailsOpen,
    isLoading,
    setIsDetailsOpen,
    handleSelectClient,
    handleDeleteClient,
    handleUpdateNotes,
    handleUpdatePurchaseValue,
    handleUpdateBasicInfo,
    handleUpdateDocument,
    handleUpdateAddress,
    refetch,
  } = useRealClientManagement();

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
        onClick={() => {/* TODO: Add client creation modal */}}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Cliente
      </Button>
    </div>
  );

  return (
    <PageLayout>
      <ModernPageHeader 
        title="Clientes" 
        description="Gerencie seus clientes e relacionamentos comerciais"
        action={addClientAction}
      />
      
      <RealClientsLayout 
        clients={clients}
        selectedClient={selectedClient}
        isDetailsOpen={isDetailsOpen}
        isLoading={isLoading}
        onSelectClient={handleSelectClient}
        onDeleteClient={handleDeleteClient}
        onUpdateNotes={handleUpdateNotes}
        onUpdatePurchaseValue={handleUpdatePurchaseValue}
        onUpdateBasicInfo={handleUpdateBasicInfo}
        onUpdateDocument={handleUpdateDocument}
        onUpdateAddress={handleUpdateAddress}
        onDetailsOpenChange={setIsDetailsOpen}
      />
    </PageLayout>
  );
}
