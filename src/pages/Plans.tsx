
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSettings from "@/components/settings/BillingSettings";
import PlansTabContent from "@/components/plans/PlansTabContent";
import { plansData, Plan } from "@/data/plansData";

export default function Plans() {
  const [currentPlan, setCurrentPlan] = useState<string>("pro");
  
  return (
    <PageLayout>
      <PageHeader 
        title="Planos" 
        description="Escolha o plano ideal para o seu negócio"
      />
      
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="space-y-6">
          <PlansTabContent 
            currentPlan={currentPlan}
            plans={plansData}
          />
        </TabsContent>
        
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
