import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { SalesFunnelContextProvider } from "@/components/sales/funnel/SalesFunnelContextProvider";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUserRole } from "@/hooks/useUserRole";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

// Import debugger for development
if (process.env.NODE_ENV === 'development') {
  import('@/utils/dragDropDebugger').then(({ runDragDropDiagnostic }) => {
    runDragDropDiagnostic();
  });
}

export default function SalesFunnel() {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();
  console.log('[SalesFunnel] 🚀 Inicializando página do funil de vendas');

  return (
    <div className="min-h-screen w-full relative">
      {/* Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* Sidebar fixo */}
      <ResponsiveSidebar />
      
      {/* Container principal com z-index correto e centralização adequada */}
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
            <ErrorBoundary>
              <SalesFunnelContextProvider>
                <ErrorBoundary>
                  <SalesFunnelContent />
                </ErrorBoundary>
              </SalesFunnelContextProvider>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
