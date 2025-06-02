
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { ModernClientsLayout } from "@/components/clients/ModernClientsLayout";
import { useClientManagement } from "@/hooks/useClientManagement";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Clients() {
  const {
    clients,
    selectedClient,
    isDetailsOpen,
    isFormOpen,
    isEditing,
    setIsDetailsOpen,
    setIsFormOpen,
    handleSelectClient,
    handleAddClient,
    handleEditClient,
    handleFormSubmit,
    handleUpdateNotes,
    handleUpdateAssignedUser,
    handleUpdatePurchaseValue
  } = useClientManagement();

  const addClientAction = (
    <Button 
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
      onClick={handleAddClient}
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Cliente
    </Button>
  );

  return (
    <PageLayout>
      <ModernPageHeader 
        title="Clientes" 
        description="Gerencie seus clientes e relacionamentos comerciais"
        action={addClientAction}
      />
      
      <ModernClientsLayout 
        clients={clients}
        selectedClient={selectedClient}
        isDetailsOpen={isDetailsOpen}
        isFormOpen={isFormOpen}
        isEditing={isEditing}
        onSelectClient={handleSelectClient}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onFormSubmit={handleFormSubmit}
        onUpdateNotes={handleUpdateNotes}
        onUpdateAssignedUser={handleUpdateAssignedUser}
        onUpdatePurchaseValue={handleUpdatePurchaseValue}
        onDetailsOpenChange={setIsDetailsOpen}
        onFormOpenChange={setIsFormOpen}
      />
    </PageLayout>
  );
}
