
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstancesData } from "@/hooks/whatsapp/useInstancesData";
import { useStabilizedInstanceSync } from "@/hooks/whatsapp/useStabilizedInstanceSync";
import { OrphanInstanceManager } from "@/components/admin/OrphanInstanceManager";
import { WhatsAppPanelHeader } from "@/components/admin/whatsapp/WhatsAppPanelHeader";
import { WhatsAppStatsGrid } from "@/components/admin/whatsapp/WhatsAppStatsGrid";
import { WhatsAppInstancesTab } from "@/components/admin/whatsapp/WhatsAppInstancesTab";
import { WhatsAppDiagnosticTab } from "@/components/admin/whatsapp/WhatsAppDiagnosticTab";
import { WhatsAppSystemTab } from "@/components/admin/whatsapp/WhatsAppSystemTab";
import { toast } from "sonner";

export const UnifiedWhatsAppPanel = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { instances, isLoading, refetch } = useInstancesData();
  const { 
    syncCount, 
    healthScore, 
    isHealthy, 
    lastSync,
    refetch: forceSync 
  } = useStabilizedInstanceSync();

  const connectedInstances = instances.filter(i => 
    ['open', 'ready', 'connected'].includes(i.connection_status)
  );
  
  const disconnectedInstances = instances.filter(i => 
    !['open', 'ready', 'connected'].includes(i.connection_status)
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), forceSync()]);
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <WhatsAppPanelHeader 
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <WhatsAppStatsGrid 
        connectedInstances={connectedInstances}
        disconnectedInstances={disconnectedInstances}
        totalInstances={instances.length}
        healthScore={healthScore}
        isHealthy={isHealthy}
      />

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances">Instâncias Ativas</TabsTrigger>
          <TabsTrigger value="orphans">Instâncias Órfãs</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          <WhatsAppInstancesTab 
            instances={instances}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="orphans" className="space-y-6">
          <OrphanInstanceManager />
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-6">
          <WhatsAppDiagnosticTab />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <WhatsAppSystemTab 
            isHealthy={isHealthy}
            syncCount={syncCount}
            lastSync={lastSync}
            connectedInstances={connectedInstances}
            disconnectedInstances={disconnectedInstances}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
