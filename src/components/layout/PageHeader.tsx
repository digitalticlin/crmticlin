
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/30 p-6 shadow-lg relative z-40", className)}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-800 font-medium">{description}</p>
        )}
      </div>
      {action && (
        <div className="relative z-50">
          {action}
        </div>
      )}
    </div>
  );
}
