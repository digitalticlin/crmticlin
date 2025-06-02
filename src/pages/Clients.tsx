
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientsLayout } from "@/components/clients/ClientsLayout";
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
      onClick={handleAddClient}
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Cliente
    </Button>
  );

  return (
    <PageLayout>
      <PageHeader 
        title="Clientes" 
        description="Gerencie seus clientes e relacionamentos comerciais"
        action={addClientAction}
      />
      
      <ClientsLayout 
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
