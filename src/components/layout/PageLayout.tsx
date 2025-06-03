
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ResponsiveSidebar />
      <main className={cn("flex-1 overflow-auto", className)}>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
