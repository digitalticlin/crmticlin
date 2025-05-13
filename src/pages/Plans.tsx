
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSettings from "@/components/settings/BillingSettings";
import PlansTabContent from "@/components/plans/PlansTabContent";
import { plansData, Plan } from "@/data/plansData";

export default function Plans() {
  const [currentPlan, setCurrentPlan] = useState<string>("pro");
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Planos</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio</p>
          </div>
          
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
        </div>
      </main>
    </div>
  );
}
