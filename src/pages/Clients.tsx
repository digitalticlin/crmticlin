
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
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
    </div>
  );
}
