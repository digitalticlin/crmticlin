
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  isCollapsed: boolean;
};

const NavItem = ({ icon: Icon, label, href, isCollapsed }: NavItemProps) => {
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
                "w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-ticlin" : "")} />
              {!isCollapsed && <span>{label}</span>}
            </Button>
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

export default NavItem;
