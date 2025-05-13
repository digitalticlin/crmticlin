
import { useState } from "react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./config/GeneralSettingsTab";
import { SecuritySettingsTab } from "./config/SecuritySettingsTab";
import { IntegrationsSettingsTab } from "./config/IntegrationsSettingsTab";

export default function ConfigPanel() {
  const [activeTab, setActiveTab] = useState("general");
  const [config, setConfig] = useState({
    systemName: "CRM Ticlin",
    apiUrl: "https://api.evolution.com",
    maxInstances: "200",
    maxUsers: "1000",
    debugMode: false,
    maintenanceMode: false,
    logRetention: "30",
    webhookUrl: "https://ticlin.com.br/api/webhook/evolution",
    aiModel: "gpt-4o",
    aiBotLimit: "100",
    termsText: "Termos e condições para uso da plataforma CRM Ticlin..."
  });
  
  const handleConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      [field]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecuritySettingsTab />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
