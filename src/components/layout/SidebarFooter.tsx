
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarFooterProps = {
  isCollapsed: boolean;
  toggleCollapse: () => void;
};

const SidebarFooter = ({ isCollapsed, toggleCollapse }: SidebarFooterProps) => {
  return (
    <div className="mt-auto mb-6 px-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleCollapse}
        className="w-full flex justify-center items-center h-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>
      
      <Separator className="my-2" />
      
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/">
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className={cn(
                  "w-full flex items-center justify-start gap-3 px-3 py-2 mt-2 rounded-lg text-destructive hover:bg-destructive/10"
                )}
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span>Sair</span>}
              </Button>
            </Link>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SidebarFooter;
