
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 transition-all duration-500 hover:shadow-3xl md:hover:scale-[1.01] hover:bg-white/40 animate-fade-in overflow-hidden",
      className
    )}>
      <div className="space-y-1">
        {/* Mobile: título menor mas ainda legível */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-gray-800 font-medium">{description}</p>
        )}
      </div>
      {/* Container do gráfico com scroll horizontal suave em mobile se necessário */}
      <div className="min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}
