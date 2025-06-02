
import { PageLayout } from "@/components/layout/PageLayout";
import { ClientsLayout } from "@/components/clients/ClientsLayout";
import { useClientManagement } from "@/hooks/useClientManagement";

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

  return (
    <PageLayout className="p-0">
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
