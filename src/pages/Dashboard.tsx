
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCustomizer from "@/components/dashboard/customizer/DashboardCustomizer";
import { CustomizableKPIGrid } from "@/components/dashboard/CustomizableKPIGrid";
import CustomizableChartsSection from "@/components/dashboard/CustomizableChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { DashboardConfigProvider } from "@/hooks/dashboard/useDashboardConfig";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();
  // Logs de render podem ser adicionados dentro de componentes filhos que já consomem o provider

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* ETAPA 1: Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* ETAPA 2: Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* ETAPA 3: Container principal com z-index correto e max-width universal */}
      <main className={cn(
        "min-h-screen w-full z-30 overflow-auto transition-all duration-300",
        isMobile 
          ? "pt-14" 
          : isCollapsed 
            ? "ml-[64px]" 
            : "ml-[200px]"
      )} style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
        {/* Container centralizado com padding */}
        <div className="w-full h-full flex justify-center px-4 md:px-6">
          <div className="w-full max-w-[1200px] h-full">
            <div className={cn(
              "main-content-scale py-4 md:py-6 space-y-6 md:space-y-8 min-h-full",
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
                
                <div>
                  <CustomizableKPIGrid />
                </div>
                
                <div>
                  <CustomizableChartsSection />
                </div>
              </DashboardConfigProvider>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
