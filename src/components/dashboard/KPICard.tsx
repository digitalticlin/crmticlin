
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  MessageSquare,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
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

export default function KPICard({ title, value, trend, icon, className }: KPICardProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className={cn(
      "rounded-3xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-2xl p-6 space-y-4 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/25 animate-fade-in",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <IconComponent className="h-6 w-6 text-gray-800" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border",
            trend.isPositive 
              ? "bg-green-100/50 text-green-700 border-green-200/50" 
              : "bg-red-100/50 text-red-700 border-red-200/50"
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
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
