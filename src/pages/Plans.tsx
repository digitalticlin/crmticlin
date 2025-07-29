
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSettings from "@/components/settings/BillingSettings";
import PlansTabContent from "@/components/plans/PlansTabContent";
import { AlertBanner } from "@/modules/billing/components/AlertBanner";

export default function Plans() {
  return (
    <PageLayout>
      <PageHeader 
        title="Planos e Faturamento" 
        description="Gerencie seus planos de mensagens e faturamento"
      />
      
      {/* Banner de Alertas */}
      <AlertBanner />
      
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="plans">Planos de Mensagens</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="space-y-6">
          <PlansTabContent />
        </TabsContent>
        
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
