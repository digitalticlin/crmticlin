
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import ChartCard from "@/components/dashboard/ChartCard";

export default function Integration() {
  return (
    <PageLayout>
      <PageHeader 
        title="Integração" 
        description="Configure suas integrações com outros serviços aqui."
      />
      
      <ChartCard 
        title="Integrações Disponíveis"
        description="Configure conexões com serviços externos"
      >
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 flex items-center justify-center h-64">
          <span className="text-gray-500 dark:text-gray-400">
            Página em desenvolvimento
          </span>
        </div>
      </ChartCard>
    </PageLayout>
  );
}
