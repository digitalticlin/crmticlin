
import { useState } from "react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GeneralSettingsTab } from "./config/GeneralSettingsTab";
import { SecuritySettingsTab } from "./config/SecuritySettingsTab";
import { IntegrationsSettingsTab } from "./config/IntegrationsSettingsTab";
import { ApiSettingsTab } from "./config/ApiSettingsTab";
import { PerformanceSettingsTab } from "./config/PerformanceSettingsTab";

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
    termsText: "Termos e condições para uso da plataforma CRM Ticlin...",
    apiMaxRetries: "3",
    apiTimeout: "30000",
    apiAuthHeader: "apikey",
    useHttps: true,
    apiCaching: false,
    cacheStrategy: "memory",
    maxQueriesPerMinute: "1000"
  });
  
  const handleConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      [field]: value
    });
  };

  const saveChanges = () => {
    // Aqui seria implementada a lógica para salvar as configurações no backend
    toast.success("Configurações salvas com sucesso!");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">Painel de Configuração</h2>
          <p className="text-muted-foreground">Configure o sistema para ambiente de produção</p>
        </div>
        <Button onClick={saveChanges}>Salvar Alterações</Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecuritySettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <ApiSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettingsTab config={config} onConfigChange={handleConfigChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
