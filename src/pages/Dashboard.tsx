
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
    <div className="min-h-screen w-full relative">
      {/* ETAPA 1: Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* ETAPA 2: Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* ETAPA 3: Container principal com z-index correto e centralização adequada */}
      <main className={cn(
        "min-h-screen z-30 transition-all duration-300",
        isMobile 
          ? "pt-14 w-full" 
          : isCollapsed 
            ? "ml-[64px] w-[calc(100vw-64px)]" 
            : "ml-[200px] w-[calc(100vw-200px)]"
      )}>
        {/* Container centralizado */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "py-6 lg:py-8 space-y-6 lg:space-y-8 mx-auto max-w-[1400px]",
            isMobile && "pt-6"
          )}>
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
      </main>
    </div>
  );
}
