
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  isCollapsed: boolean;
  className?: string;
  comingSoon?: boolean;
};

const NavItem = ({ icon: Icon, label, href, isCollapsed, className, comingSoon = false }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  const handleComingSoonClick = (e: React.MouseEvent) => {
    if (comingSoon) {
      e.preventDefault();
      toast.info(`${label} estará disponível em breve!`);
    }
  };

  const buttonContent = (
    <Button
      variant="ghost"
      size="lg"
      className={cn(
        "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl group relative overflow-hidden",
        "transition-all duration-300 ease-out",
        comingSoon 
          ? "opacity-60 cursor-not-allowed hover:bg-gray-100/50" 
          : "hover:scale-[1.02] hover:translate-x-1",
        isActive && !comingSoon
          ? "bg-gradient-to-r from-white/40 to-white/25 text-gray-900 font-semibold border border-white/40 shadow-lg backdrop-blur-md nav-item-active" 
          : comingSoon
          ? "text-gray-500"
          : "hover:bg-white/25 hover:backdrop-blur-lg hover:border hover:border-white/30 hover:shadow-lg text-gray-700 hover:text-gray-900 nav-item-hover",
        className
      )}
      onClick={handleComingSoonClick}
      disabled={comingSoon}
    >
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
        isActive && !comingSoon
          ? "bg-gradient-to-r from-ticlin/20 to-transparent opacity-100" 
          : !comingSoon && "group-hover:opacity-50 bg-gradient-to-r from-white/10 to-transparent"
      )} />
      
      {/* Icon with glow effect */}
      <div className={cn(
        "relative z-10 transition-all duration-300",
        isActive && !comingSoon && "drop-shadow-[0_0_8px_rgba(211,216,0,0.6)]"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-all duration-300",
          isActive && !comingSoon
            ? "text-ticlin-600 drop-shadow-sm" 
            : comingSoon
            ? "text-gray-400"
            : "group-hover:text-gray-800 group-hover:scale-110"
        )} />
      </div>
      
      {/* Label with slide effect */}
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1">
          <span className={cn(
            "relative z-10 transition-all duration-300 text-sm",
            isActive && !comingSoon
              ? "text-gray-900 font-semibold" 
              : comingSoon
              ? "text-gray-500"
              : "group-hover:text-gray-900 group-hover:translate-x-0.5"
          )}>
            {label}
          </span>
          
          {/* Coming Soon Badge */}
          {comingSoon && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              EM BREVE
            </span>
          )}
        </div>
      )}
      
      {/* Active indicator line */}
      {isActive && !comingSoon && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-ticlin-500 to-ticlin-600 rounded-r-full shadow-lg animate-scale-in" />
      )}
    </Button>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {comingSoon ? (
            <div className="w-full">
              {buttonContent}
            </div>
          ) : (
            <Link to={href} className="w-full">
              {buttonContent}
            </Link>
          )}
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              {label}
              {comingSoon && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  EM BREVE
                </span>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default NavItem;
