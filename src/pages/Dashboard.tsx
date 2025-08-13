
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCustomizer from "@/components/dashboard/customizer/DashboardCustomizer";
import { CustomizableKPIGrid } from "@/components/dashboard/CustomizableKPIGrid";
import CustomizableChartsSection from "@/components/dashboard/CustomizableChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { useDashboardConfig, DashboardConfigProvider } from "@/hooks/dashboard/useDashboardConfig";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();
  const { config, forceUpdate, loading } = useDashboardConfig();

  // ETAPA 5: Validação - monitoring da página
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`🏠 DASHBOARD RENDER [${timestamp}]:`, {
      forceUpdate,
      loading,
      configKPIs: config.kpis,
      configCharts: config.charts,
      enabledKpis: Object.values(config.kpis).filter(Boolean).length,
      enabledCharts: Object.values(config.charts).filter(Boolean).length
    });
  }, [forceUpdate, config, loading]);

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* ETAPA 1: Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* ETAPA 2: Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* ETAPA 3: Container principal com z-index correto e max-width universal */}
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-30 overflow-auto transition-all duration-300",
        isMobile 
          ? "left-0 pt-14" 
          : isCollapsed 
            ? "left-[64px]" 
            : "left-[200px]"
      )}>
        {/* NOVO: Container universal com max-width de 1200px */}
        <div className="w-full max-w-[1200px] mx-auto h-full">
          <div className={cn(
            "main-content-scale p-4 md:p-6 space-y-6 md:space-y-8 min-h-full",
            isMobile && "pt-6"
          )}>
            <DashboardConfigProvider>
            <DashboardHeader />
            
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Análise de Performance</h2>
                  <p className="text-sm text-gray-800">Visualize seus dados e métricas em tempo real</p>
                </div>
                
                <div className="flex justify-center md:justify-start">
                  <PeriodFilter />
                </div>
                
                <div className="flex justify-end">
                  <DashboardCustomizer />
                </div>
              </div>
            </div>
            
            {/* ETAPA 3: Keys simplificadas baseadas apenas no forceUpdate */}
            <div key={`dashboard-kpi-${forceUpdate}`}>
              <CustomizableKPIGrid />
            </div>
            
            <div key={`dashboard-charts-${forceUpdate}`}>
              <CustomizableChartsSection />
            </div>
            </DashboardConfigProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
