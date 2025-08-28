import React from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
  fullHeight?: boolean;
}

export function AppLayout({ 
  children, 
  maxWidth = 'max-w-[1400px]',
  fullHeight = false 
}: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full relative">
      {/* Fundo gradiente fixo */}
      <BackgroundGradient className="fixed inset-0 z-0" />

      {/* Sidebar fixo - nunca recarrega */}
      <ResponsiveSidebar />
      
      {/* Container principal com transições suaves */}
      <main className={cn(
        "min-h-screen z-30 transition-all duration-300",
        isMobile 
          ? "pt-14 w-full" 
          : isCollapsed 
            ? "ml-[64px] w-[calc(100vw-64px)]" 
            : "ml-[200px] w-[calc(100vw-200px)]"
      )}>
        {/* Container de conteúdo */}
        <div className={cn(
          "w-full",
          fullHeight ? "h-[calc(100vh-3.5rem)] sm:h-screen" : "",
          !fullHeight && "px-4 sm:px-6 lg:px-8"
        )}>
          <div className={cn(
            fullHeight ? "h-full" : "py-6 lg:py-8 space-y-6 lg:space-y-8 mx-auto",
            !fullHeight && maxWidth,
            isMobile && !fullHeight && "pt-6"
          )}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}