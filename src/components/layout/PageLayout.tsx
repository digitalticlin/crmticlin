
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useSidebar } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "h-screen w-full relative",
      className?.includes("kanban") ? "" : "overflow-hidden"
    )}>
      {/* Fundo gradiente usando o componente reutilizável */}
      <BackgroundGradient className="fixed inset-0 z-0" />
      
      <ResponsiveSidebar />
      
      {/* Main container SEM scroll geral */}
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-30 transition-all duration-300",
        className?.includes("kanban") ? "h-full" : "overflow-hidden h-full",
        isMobile 
          ? "left-0 pt-14" 
          : isCollapsed 
            ? "left-[64px]" 
            : "left-[200px]",
        className
      )}>
        {/* Container com tratamento especial para páginas Kanban (full-bleed) */}
        <div className={cn(
          "w-full h-full",
          className?.includes("kanban") ? "max-w-none" : "max-w-[1200px] mx-auto"
        )}>
          {className?.includes("kanban") ? (
            // SPECIAL layout for Kanban - optimized for drag and drop
            <div className="main-content-scale h-full p-4 md:p-6 flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
                {children}
              </div>
            </div>
          ) : (
            // Layout padrão SEM scroll geral
            <div className="main-content-scale h-full p-4 md:p-6 flex flex-col">
              {children}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
