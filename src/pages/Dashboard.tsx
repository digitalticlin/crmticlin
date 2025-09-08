
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LazyCustomizer from "@/components/dashboard/lazy/LazyCustomizer";
import LazyKPIGrid from "@/components/dashboard/lazy/LazyKPIGrid";
import LazyChartsSection from "@/components/dashboard/lazy/LazyChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { DashboardConfigProvider } from "@/hooks/dashboard/useDashboardConfig";

export default function Dashboard() {
  return (
    <DashboardConfigProvider>
      <DashboardHeader />
      
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Análise de Performance</h2>
            <p className="text-sm text-gray-800">Visualize seus dados e métricas em tempo real</p>
          </div>
          
          <div className="flex justify-center lg:justify-start">
            <PeriodFilter />
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <LazyCustomizer />
          </div>
        </div>
      </div>
      
      <div>
        <LazyKPIGrid />
      </div>
      
      <div>
        <LazyChartsSection />
      </div>
    </DashboardConfigProvider>
  );
}
