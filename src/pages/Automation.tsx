
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Info, Plus, Zap } from "lucide-react";
import { ModernCampaignCreator } from "@/components/automation/ModernCampaignCreator";
import { CampaignListTable } from "@/components/automation/CampaignListTable";
import { toast } from "sonner";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const handleCampaignSuccess = () => {
    setActiveTab("dashboard");
    toast.success("Campanha criada com sucesso!", {
      description: "Sua campanha foi configurada e está pronta para ser iniciada."
    });
  };
  
  return (
    <PageLayout>
      <div className="h-full flex flex-col">
        <ModernPageHeader 
          title="Automação" 
          description="Configure e gerencie suas campanhas de disparo em massa"
          action={
            <Button 
              onClick={() => setActiveTab("create")}
              className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          }
        />
        
        <Alert className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 shadow-glass mb-6">
          <Info className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <Zap className="w-4 h-4 inline mr-1" />
            Para evitar bloqueio pelo WhatsApp, seus disparos são limitados automaticamente a 2-4 mensagens por minuto, respeitando pausas e variações naturais.
          </AlertDescription>
        </Alert>
        
        <div className="flex-1 min-h-0 bg-white/30 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl">
          <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm border border-white/20">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm">
                    Campanhas
                  </TabsTrigger>
                  <TabsTrigger value="create" className="data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm">
                    Nova Campanha
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="dashboard" className="flex-1 min-h-0 p-6 pt-6">
                <div className="h-full max-h-[calc(100vh-280px)] overflow-y-auto scroll-smooth">
                  <CampaignListTable />
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="flex-1 min-h-0 p-6 pt-6">
                <div className="h-full max-h-[calc(100vh-280px)] overflow-y-auto scroll-smooth">
                  <ModernCampaignCreator onSuccess={handleCampaignSuccess} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
