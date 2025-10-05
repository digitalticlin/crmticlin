
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
      "rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-5 md:p-6 space-y-3 md:space-y-4 transition-all duration-500 hover:shadow-3xl md:hover:scale-[1.02] hover:bg-white/40 animate-fade-in",
      // Mobile: altura mínima maior, touch-friendly
      "min-h-[140px] md:min-h-auto",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="p-3 md:p-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25">
          {/* Mobile: ícone maior */}
          <IconComponent className="h-7 w-7 md:h-6 md:w-6 text-gray-800" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-1 rounded-full text-xs md:text-xs font-medium backdrop-blur-sm border",
            trend.isPositive
              ? "bg-green-100/60 text-green-800 border-green-200/60"
              : "bg-red-100/60 text-red-800 border-red-200/60"
          )}>
            {trend.isPositive ? (
              <ArrowUp className="h-3.5 w-3.5 md:h-3 md:w-3" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 md:h-3 md:w-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="space-y-1 md:space-y-1">
        {/* Mobile: fonte legível */}
        <p className="text-sm md:text-sm font-medium text-gray-800">{title}</p>
        {/* Mobile: número maior e mais destacado */}
        <p className="text-4xl md:text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
