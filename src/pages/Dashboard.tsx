
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCustomizer from "@/components/dashboard/customizer/DashboardCustomizer";
import { CustomizableKPIGrid } from "@/components/dashboard/CustomizableKPIGrid";
import CustomizableChartsSection from "@/components/dashboard/CustomizableChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
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
      {/* ETAPA 1: Fundo gradiente fixo que ocupa toda a tela */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                       radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                       radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`,
          backgroundColor: '#e5e7eb' // gray-200 fallback
        }}
      />
      
      {/* Elementos flutuantes para profundidade - também fixos */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-15"></div>
      </div>

      {/* ETAPA 2: Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* ETAPA 3: Container principal com scroll independente */}
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-10 overflow-auto transition-all duration-300",
        isMobile 
          ? "left-0 pt-14" 
          : isCollapsed 
            ? "left-[80px]" 
            : "left-[250px]"
      )}>
        <div className={cn(
          "p-4 md:p-6 space-y-6 md:space-y-8 min-h-full",
          isMobile && "pt-6"
        )}>
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
        </div>
      </main>
    </div>
  );
}
