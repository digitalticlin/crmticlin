
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm lg:text-base text-gray-600 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
