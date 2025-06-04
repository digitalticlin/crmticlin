
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <ResponsiveSidebar />
      <main className={cn(
        "flex-1 overflow-auto",
        !isMobile && "ml-[250px]", // Compensar largura do sidebar fixo no desktop
        className
      )}>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
