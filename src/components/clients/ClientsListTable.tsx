
import { useState } from "react";
import { ClientData } from "@/hooks/clients/types";
import { ClientsSearchBar } from "./ClientsSearchBar";
import { ClientsTable } from "./ClientsTable";

interface ClientsListTableProps {
  clients: ClientData[];
  onSelectClient: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  isLoading?: boolean;
}

export const ClientsListTable = ({ 
  clients, 
  onSelectClient, 
  onEditClient, 
  onDeleteClient,
  isLoading 
}: ClientsListTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3d800]"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ClientsSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clients={clients}
        filteredClients={filteredClients}
      />

      <ClientsTable
        filteredClients={filteredClients}
        searchQuery={searchQuery}
        onSelectClient={onSelectClient}
        onEditClient={onEditClient}
        onDeleteClient={onDeleteClient}
      />
    </div>
  );
};
