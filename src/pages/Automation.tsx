
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { NewBroadcastListForm } from "@/components/automation/NewBroadcastListForm";
import { BroadcastLists } from "@/components/automation/BroadcastLists";
import { BroadcastSimulationCard } from "@/components/automation/BroadcastSimulationCard";
import { toast } from "sonner";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("lists");
  
  const handleCampaignSuccess = () => {
    setActiveTab("lists");
    toast.success("Campanha criada com sucesso!", {
      description: "Sua campanha foi configurada e está pronta para ser iniciada."
    });
  };

  // Dados de exemplo para simulação
  const simulationCampaigns = [
    {
      id: 'sim-1',
      name: 'Teste - Promoção Semanal',
      message: 'Olá! Temos uma promoção especial esta semana com 30% de desconto em todos os produtos. Aproveite!',
      mediaType: 'text' as const,
      fragments: 1,
      targetCount: 150,
      instanceName: 'WhatsApp Principal'
    },
    {
      id: 'sim-2',
      name: 'Teste - Apresentação com Vídeo',
      message: 'Confira nosso novo produto no vídeo em anexo. Esperamos seu feedback!',
      mediaType: 'video' as const,
      fragments: 2,
      targetCount: 85,
      instanceName: 'WhatsApp Vendas'
    }
  ];
  
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
          <TabsTrigger value="simulation">Simulação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lists" className="space-y-4">
          <BroadcastLists />
        </TabsContent>
        
        <TabsContent value="new">
          <NewBroadcastListForm onSuccess={handleCampaignSuccess} />
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Campanhas de Teste</h3>
              <p className="text-sm text-gray-500">
                Use para testar configurações sem enviar mensagens reais
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {simulationCampaigns.map((campaign) => (
                <BroadcastSimulationCard
                  key={campaign.id}
                  {...campaign}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
