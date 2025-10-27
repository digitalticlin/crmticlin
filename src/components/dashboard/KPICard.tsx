
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
      "relative transition-all duration-500 md:hover:scale-[1.02] animate-fade-in mb-7 overflow-visible",
      className
    )}
    style={{ filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))' }}
    >
      {/* Camada de backdrop-blur com formato do balão */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        style={{
          clipPath: 'url(#speech-bubble-clip)',
          WebkitClipPath: 'url(#speech-bubble-clip)'
        }}
      />

      {/* SVG com formato exato da logo Ticlin */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 489.03 348.95"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clip path para o formato do balão */}
          <clipPath id="speech-bubble-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.813,1c-0.011,0,-0.022,-0.006,-0.03,-0.017l-0.091,-0.128H0.126c-0.069,0,-0.126,-0.079,-0.126,-0.176V0.176C0,0.079,0.056,0,0.126,0h0.749c0.069,0,0.126,0.079,0.126,0.176v0.502c0,0.001,0,0.003,0,0.005c0.001,0.05,-0.013,0.099,-0.038,0.134l-0.118,0.166c-0.008,0.011,-0.019,0.017,-0.03,0.017Z" />
          </clipPath>
        </defs>

        {/* Preenchimento principal com transparência */}
        <path
          d="M397.85,348.95c-5.54,0-10.75-2.16-14.66-6.08l-44.71-44.71H61.49c-33.9,0-61.49-27.58-61.49-61.49V61.49C0,27.58,27.58,0,61.49,0h366.06c33.9,0,61.49,27.58,61.49,61.49v175.19c0,.54-.02,1.07-.03,1.6.44,17.43-6.35,34.45-18.66,46.76l-57.83,57.83c-3.92,3.92-9.12,6.07-14.66,6.07Z"
          fill="rgba(255, 255, 255, 0.35)"
          className="drop-shadow-2xl"
        />

        {/* Borda sutil */}
        <path
          d="M397.85,348.95c-5.54,0-10.75-2.16-14.66-6.08l-44.71-44.71H61.49c-33.9,0-61.49-27.58-61.49-61.49V61.49C0,27.58,27.58,0,61.49,0h366.06c33.9,0,61.49,27.58,61.49,61.49v175.19c0,.54-.02,1.07-.03,1.6.44,17.43-6.35,34.45-18.66,46.76l-57.83,57.83c-3.92,3.92-9.12,6.07-14.66,6.07Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
      </svg>

      {/* Conteúdo do card */}
      <div className="relative z-10 px-5 md:px-6 pt-6 md:pt-7 pb-12 md:pb-14 space-y-3 md:space-y-4 min-h-[180px] md:min-h-[200px]">
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
    </div>
  );
}
