
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./config/GeneralSettingsTab";
import { SecuritySettingsTab } from "./config/SecuritySettingsTab";
import { IntegrationsSettingsTab } from "./config/IntegrationsSettingsTab";
import SystemChecklistPanel from "./SystemChecklistPanel";
import { usePermissions } from "@/hooks/usePermissions";

export default function ConfigPanel() {
  const { isSuperAdmin } = usePermissions();
  
  // Add configuration state
  const [config, setConfig] = useState({
    // General settings
    systemName: "Ticlin CRM",
    maxInstances: "10",
    maxUsers: "50",
    logRetention: "30",
    debugMode: false,
    maintenanceMode: false,
    termsText: "Termos de uso padrão da plataforma Ticlin CRM.",
    
    // Integration settings
    apiUrl: "https://api.evolution.com",
    webhookUrl: "https://webhook.ticlin.com.br/evolution",
    aiModel: "gpt-4",
    aiBotLimit: "5"
  });

  // Handle configuration changes
  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
            <GeneralSettingsTab 
              config={config} 
              onConfigChange={handleConfigChange} 
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettingsTab />
          </TabsContent>
          
          <TabsContent value="integrations">
            <IntegrationsSettingsTab 
              config={config} 
              onConfigChange={handleConfigChange} 
            />
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
