
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
      {/* Fundo gradiente fixo igual ao Dashboard */}
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
