
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { AutomationHeader } from "@/components/automation/AutomationHeader";
import { NewBroadcastListForm } from "@/components/automation/NewBroadcastListForm";
import { BroadcastLists } from "@/components/automation/BroadcastLists";
import { useToast } from "@/hooks/use-toast";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("lists");
  const { toast } = useToast();
  
  return (
    <PageLayout>
      <PageHeader 
        title="Automação" 
        description="Configure e gerencie suas automações de mensagens"
      />
      
      <Alert className="border border-amber-200 bg-amber-50/50 dark:bg-amber-900/20 dark:border-amber-800">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Para evitar bloqueio pelo WhatsApp, seus disparos serão limitados automaticamente a 2 a 4 mensagens por minuto, respeitando pausas e variações.
        </AlertDescription>
      </Alert>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="lists">Listas de Transmissão</TabsTrigger>
          <TabsTrigger value="new">Nova Transmissão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lists" className="space-y-4">
          <BroadcastLists />
        </TabsContent>
        
        <TabsContent value="new">
          <NewBroadcastListForm onSuccess={() => {
            setActiveTab("lists");
            toast({
              title: "Lista criada com sucesso",
              description: "Sua lista de transmissão foi configurada e está pronta para iniciar.",
            });
          }} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
