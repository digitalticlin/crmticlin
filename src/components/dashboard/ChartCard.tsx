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
      "rounded-3xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl p-6 space-y-4 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] hover:bg-white/15 animate-fade-in",
      className
    )}>
      <div className="space-y-2">
        <h3 className="text-xl font-orbitron font-bold text-gray-900 tracking-wide">{title}</h3>
        {description && (
          <p className="text-sm text-gray-800 font-inter font-medium">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
