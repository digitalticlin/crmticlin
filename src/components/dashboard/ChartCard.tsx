
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
      "rounded-3xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-2xl p-6 space-y-4 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] hover:bg-white/25 animate-fade-in",
      className
    )}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-700 font-medium">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
