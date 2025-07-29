
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardCustomizer } from "@/components/dashboard/customizer/DashboardCustomizer";

export default function Dashboard() {
  return (
    <PageLayout>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral das suas métricas e atividades"
      />
      <DashboardContent />
    </PageLayout>
  );
}
