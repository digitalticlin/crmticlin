
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  isCollapsed: boolean;
  className?: string;
};

const NavItem = ({ icon: Icon, label, href, isCollapsed, className }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={href} className="w-full">
            <Button
              variant="ghost"
              size="lg"
              className={cn(
                "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl group relative overflow-hidden",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:translate-x-1",
                isActive 
                  ? "bg-gradient-to-r from-white/40 to-white/25 text-gray-900 font-semibold border border-white/40 shadow-lg backdrop-blur-md nav-item-active" 
                  : "hover:bg-white/25 hover:backdrop-blur-lg hover:border hover:border-white/30 hover:shadow-lg text-gray-700 hover:text-gray-900 nav-item-hover",
                className
              )}
            >
              {/* Background glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                isActive 
                  ? "bg-gradient-to-r from-ticlin/20 to-transparent opacity-100" 
                  : "group-hover:opacity-50 bg-gradient-to-r from-white/10 to-transparent"
              )} />
              
              {/* Icon with glow effect */}
              <div className={cn(
                "relative z-10 transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_rgba(211,216,0,0.6)]"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive 
                    ? "text-ticlin-600 drop-shadow-sm" 
                    : "group-hover:text-gray-800 group-hover:scale-110"
                )} />
              </div>
              
              {/* Label with slide effect */}
              {!isCollapsed && (
                <span className={cn(
                  "relative z-10 transition-all duration-300 text-sm",
                  isActive 
                    ? "text-gray-900 font-semibold" 
                    : "group-hover:text-gray-900 group-hover:translate-x-0.5"
                )}>
                  {label}
                </span>
              )}
              
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-ticlin-500 to-ticlin-600 rounded-r-full shadow-lg animate-scale-in" />
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

export default NavItem;
