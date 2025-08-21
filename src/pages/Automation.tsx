
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { NewBroadcastListForm } from "@/components/automation/NewBroadcastListForm";
import { BroadcastLists } from "@/components/automation/BroadcastLists";
import { toast } from "sonner";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("lists");
  
  const handleCampaignSuccess = () => {
    setActiveTab("lists");
    toast.success("Campanha criada com sucesso!", {
      description: "Sua campanha foi configurada e está pronta para ser iniciada."
    });
  };
  
  return (
    <PageLayout>
      <PageHeader 
        title="Automação" 
        description="Configure e gerencie suas campanhas de disparo em massa"
      />
      
      <Alert className="border border-amber-200 bg-amber-50/50 dark:bg-amber-900/20 dark:border-amber-800">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Para evitar bloqueio pelo WhatsApp, seus disparos são limitados automaticamente a 2-4 mensagens por minuto, respeitando pausas e variações naturais.
        </AlertDescription>
      </Alert>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="lists">Campanhas</TabsTrigger>
          <TabsTrigger value="new">Nova Campanha</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lists" className="space-y-4">
          <BroadcastLists />
        </TabsContent>
        
        <TabsContent value="new">
          <NewBroadcastListForm onSuccess={handleCampaignSuccess} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
