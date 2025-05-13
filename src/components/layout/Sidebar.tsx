
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  CreditCard, 
  Bot, 
  Settings,
  Kanban,
  ListPlus,
  Cable
} from "lucide-react";
import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: Kanban,
      label: "Funil de Vendas",
      href: "/sales-funnel",
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/chat",
    }
  ];

  const featureNavItems = [
    {
      icon: Users,
      label: "Clientes",
      href: "/clients",
    },
    {
      icon: ListPlus,
      label: "Automação",
      href: "/automation",
    },
    {
      icon: Cable,
      label: "Integração",
      href: "/integration",
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
    }
  ];

  const systemNavItems = [
    {
      icon: CreditCard,
      label: "Planos",
      href: "/plans",
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
    }
  ];

  return (
    <div
      className={cn(
        "h-screen bg-sidebar sticky top-0 left-0 z-30 flex flex-col transition-all duration-300 shadow-lg",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <SidebarLogo isCollapsed={isCollapsed} />

      <Separator />

      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        {/* Main navigation group */}
        <SidebarNavGroup items={mainNavItems} isCollapsed={isCollapsed} />
        
        {/* Features navigation group */}
        <SidebarNavGroup items={featureNavItems} isCollapsed={isCollapsed} />
        
        {/* System navigation group */}
        <SidebarNavGroup 
          items={systemNavItems} 
          isCollapsed={isCollapsed} 
          className="mb-0" // No bottom margin for the last group
        />
      </div>

      <SidebarFooter 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
    </div>
  );
}
