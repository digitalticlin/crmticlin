
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  subtitle?: string;
}

export default function KPICard({
  className,
  icon,
  title,
  value,
  trend,
  subtitle,
  ...props
}: KPICardProps) {
  return (
    <Card className={cn("shadow-sm", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && <div className="text-ticlin">{icon}</div>}
        </div>
        
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold">{value}</h3>
          
          {trend && (
            <div 
              className={cn(
                "text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 rounded",
                trend.isPositive 
                  ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30" 
                  : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
