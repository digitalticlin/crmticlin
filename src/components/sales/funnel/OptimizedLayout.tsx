
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptimizedLayoutProps {
  header: ReactNode;
  controlBar: ReactNode;
  content: ReactNode;
  className?: string;
}

export function OptimizedLayout({ 
  header, 
  controlBar, 
  content, 
  className 
}: OptimizedLayoutProps) {
  return (
    <div className={cn(
      "sales-funnel-layout h-full grid grid-rows-[60px_50px_1fr] gap-4 p-4",
      className
    )}>
      {/* Header Compacto - 60px fixo */}
      <div className="header-section">
        {header}
      </div>
      
      {/* Barra de Controle Slim - 50px fixo */}
      <div className="control-section">
        {controlBar}
      </div>
      
      {/* Área de Conteúdo Maximizada */}
      <div className="content-section overflow-hidden">
        {content}
      </div>
    </div>
  );
}
