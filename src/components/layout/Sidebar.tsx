
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  CreditCard, 
  Bot, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Kanban,
  ListPlus
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "h-screen bg-sidebar sticky top-0 left-0 z-30 flex flex-col transition-all duration-300 shadow-lg",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <div className="flex items-center justify-center h-16 p-4">
        {!isCollapsed ? (
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" 
              alt="Ticlin Logo" 
              className="h-8" 
            />
          </div>
        ) : (
          <img 
            src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" 
            alt="Ticlin Logo" 
            className="h-8" 
          />
        )}
      </div>

      <Separator />

      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          href="/dashboard"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={Kanban}
          label="Funil de Vendas"
          href="/sales-funnel"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={MessageSquare}
          label="Chat"
          href="/chat"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={Users}
          label="Clientes"
          href="/clients"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={MessageSquare}
          label="WhatsApp"
          href="/whatsapp"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={ListPlus}
          label="Automação"
          href="/automation"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={Users}
          label="Equipe"
          href="/team"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={CreditCard}
          label="Planos"
          href="/plans"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={Bot}
          label="Agentes IA"
          href="/ai-agents"
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={Settings}
          label="Configurações"
          href="/settings"
          isCollapsed={isCollapsed}
        />
      </div>

      <div className="mt-auto mb-6 px-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
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
    </div>
  );
}
