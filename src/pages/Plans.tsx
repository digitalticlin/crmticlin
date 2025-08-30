
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSettings from "@/components/settings/BillingSettings";
import PlansTabContent from "@/components/plans/PlansTabContent";
import { AlertBanner } from "@/modules/billing/components/AlertBanner";
import { PlanStatusOverview } from "@/modules/billing/components/PlanStatusOverview";
import { UsageDisplay } from "@/modules/billing/components/UsageDisplay";
import { PlanComparison } from "@/modules/billing/components/PlanComparison";
import { UpgradeRecommendation } from "@/modules/billing/components/UpgradeRecommendation";

export default function Plans() {
  return (
    <div className="w-full">
      <PageHeader 
        title="Planos e Faturamento" 
        description="Gerencie seus planos de mensagens e faturamento de forma completa"
      />
      
      {/* Banner de Alertas */}
      <AlertBanner />
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
        </TabsList>
        
        {/* Aba de Visão Geral - Nova */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Status do Plano */}
            <div className="space-y-6">
              <PlanStatusOverview />
            </div>
            
            {/* Coluna 2: Estatísticas de Uso */}
            <div className="space-y-6">
              <UsageDisplay />
            </div>
            
            {/* Coluna 3: Recomendações */}
            <div className="space-y-6">
              <UpgradeRecommendation />
            </div>
          </div>
          
          {/* Seção Adicional: Comparação de Planos */}
          <div className="mt-8">
            <PlanComparison />
          </div>
        </TabsContent>
        
        {/* Aba de Planos - Existente Melhorada */}
        <TabsContent value="plans" className="space-y-6">
          <PlansTabContent />
        </TabsContent>
        
        {/* Aba de Faturamento - Existente */}
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
