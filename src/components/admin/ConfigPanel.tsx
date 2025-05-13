
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./config/GeneralSettingsTab";
import { SecuritySettingsTab } from "./config/SecuritySettingsTab";
import { IntegrationsSettingsTab } from "./config/IntegrationsSettingsTab";
import SystemChecklistPanel from "./SystemChecklistPanel";
import { usePermissions } from "@/hooks/usePermissions";

export default function ConfigPanel() {
  const { isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="checklist">Homologação</TabsTrigger>
          )}
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="general">
            <GeneralSettingsTab />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettingsTab />
          </TabsContent>
          
          <TabsContent value="integrations">
            <IntegrationsSettingsTab />
          </TabsContent>
          
          {isSuperAdmin && (
            <TabsContent value="checklist">
              <SystemChecklistPanel />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
