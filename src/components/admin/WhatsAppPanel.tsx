
import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { WhatsAppHeader } from "./whatsapp/WhatsAppHeader";
import { WhatsAppFilters } from "./whatsapp/WhatsAppFilters";
import { WhatsAppTable } from "./whatsapp/WhatsAppTable";
import { SystemStatusPanel } from "./whatsapp/SystemStatusPanel";
import { useWhatsAppPanel } from "./whatsapp/useWhatsAppPanel";

export default function WhatsAppPanel() {
  const {
    filteredInstances,
    instances,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    companyFilter,
    setCompanyFilter,
    companies,
    systemStatuses
  } = useWhatsAppPanel();

  const handleRefresh = () => {
    // Implementation for refresh functionality would go here
    console.log("Refreshing WhatsApp instances status");
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <WhatsAppHeader onRefresh={handleRefresh} />
          <WhatsAppFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            companies={companies}
          />
        </CardHeader>
        <CardContent>
          <WhatsAppTable instances={filteredInstances} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredInstances.length} de {instances.length} instâncias
          </div>
          <div className="text-sm text-muted-foreground">
            Última verificação: 13/05/2024 16:30
          </div>
        </CardFooter>
      </Card>
      
      <SystemStatusPanel systemStatuses={systemStatuses} />
    </div>
  );
}
