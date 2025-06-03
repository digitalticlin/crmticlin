
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  color = "bg-ticlin", 
  className,
  ...props 
}: StatCardProps) {
  return (
    <Card 
      className={cn("shadow-sm", className)} 
      {...props}
    >
      <div className="flex h-full">
        {icon && (
          <div className={cn("px-4 flex items-center justify-center", color)}>
            <div className="text-white">{icon}</div>
          </div>
        )}
        
        <CardContent className="p-4 flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-1">
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
