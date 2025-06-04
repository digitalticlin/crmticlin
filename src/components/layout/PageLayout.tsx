
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* Fundo gradiente fixo */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
      
      <ResponsiveSidebar />
      
      {/* Container principal com scroll independente */}
      <main className={cn(
        "fixed top-0 right-0 bottom-0 z-10 overflow-auto",
        "left-0 md:left-[250px]", // Ajuste para largura do sidebar
        className
      )}>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
