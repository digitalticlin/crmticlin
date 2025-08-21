
import { useState } from "react";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Settings, Radio } from "lucide-react";
import { CampaignsDashboard } from "@/components/automation/campaigns/CampaignsDashboard";
import { CreateCampaignWizard } from "@/components/automation/campaigns/CreateCampaignWizard";
import { CampaignsReports } from "@/components/automation/campaigns/CampaignsReports";
import { CampaignsSettings } from "@/components/automation/campaigns/CampaignsSettings";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <div className="min-h-screen bg-background">
      <ModernPageHeader 
        title="Automação de Campanhas" 
        description="Gerencie e execute suas campanhas de disparo em massa no WhatsApp"
        action={
          <Button 
            onClick={() => setActiveTab("create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        }
      />
      
      <div className="container mx-auto px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <Radio className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Campanha
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <CampaignsDashboard />
          </TabsContent>
          
          <TabsContent value="create">
            <CreateCampaignWizard onSuccess={() => setActiveTab("dashboard")} />
          </TabsContent>
          
          <TabsContent value="reports">
            <CampaignsReports />
          </TabsContent>
          
          <TabsContent value="settings">
            <CampaignsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
