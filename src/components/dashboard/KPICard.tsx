
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  MessageSquare,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: "users" | "userPlus" | "trendingUp" | "messageSquare";
  className?: string;
}

const iconMap = {
  users: Users,
  userPlus: UserPlus,
  trendingUp: TrendingUp,
  messageSquare: MessageSquare,
};

export default function KPICard({ title, value, description, trend, icon, className }: KPICardProps) {
  const IconComponent = iconMap[icon];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6 space-y-4 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/40 animate-fade-in cursor-help",
            className
          )}>
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25">
                <IconComponent className="h-6 w-6 text-gray-800" />
              </div>
              {trend && trend.value > 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border",
                  trend.isPositive 
                    ? "bg-green-100/60 text-green-800 border-green-200/60" 
                    : "bg-red-100/60 text-red-800 border-red-200/60"
                )}>
                  {trend.isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {trend.value}%
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        </TooltipTrigger>
        {description && (
          <TooltipContent>
            <p className="max-w-48 text-sm">{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
