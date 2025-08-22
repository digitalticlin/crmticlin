
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
      
      {/* Main container responsivo e centralizado */}
      <main className={cn(
        "min-h-screen w-full z-30 transition-all duration-300",
        className?.includes("kanban") ? "h-full" : "overflow-hidden h-full",
        isMobile 
          ? "pt-14" 
          : isCollapsed 
            ? "ml-[64px]" 
            : "ml-[200px]",
        className
      )}>
        {/* Container com tratamento especial para páginas Kanban (full-bleed) */}
        {className?.includes("kanban") ? (
          <div className="w-full h-full max-w-none">
            {/* SPECIAL layout for Kanban - optimized for drag and drop */}
            <div className="main-content-scale h-full p-4 md:p-6 flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex justify-center px-4 md:px-6 lg:px-8">
            <div className="w-full max-w-[1400px] h-full">
              <div className="h-full py-4 md:py-6 lg:py-8 flex flex-col">
                {children}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
