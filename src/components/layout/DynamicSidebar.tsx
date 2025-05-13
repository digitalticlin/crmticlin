
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
  Cable,
  AlertTriangle
} from "lucide-react";
import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarFooter from "./SidebarFooter";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";

export default function DynamicSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const permissions = usePermissions();

  // If permissions are still loading, show a simplified sidebar
  if (permissions.isLoading || !user) {
    return (
      <div className="h-screen bg-sidebar sticky top-0 left-0 z-30 flex flex-col transition-all duration-300 shadow-lg w-[250px]">
        <SidebarLogo isCollapsed={false} />
        <Separator />
        <div className="flex flex-col flex-1 py-6 px-2 gap-1 justify-center items-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 animate-pulse" />
          <p className="text-sm text-center mt-2">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Define navigation items based on permissions
  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
      visible: true, // Everyone can see dashboard
    },
    {
      icon: Kanban,
      label: "Funil de Vendas",
      href: "/sales-funnel",
      visible: true, // Everyone can see sales funnel
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/chat",
      visible: true, // Everyone can use chat
    }
  ].filter(item => item.visible);

  const featureNavItems = [
    {
      icon: Users,
      label: "Clientes",
      href: "/clients",
      visible: true, // All users can see clients
    },
    {
      icon: ListPlus,
      label: "Automação",
      href: "/automation",
      visible: permissions.isCompanyAdmin || permissions.isSuperAdmin, // Only admins can access automation
    },
    {
      icon: Cable,
      label: "Integração",
      href: "/integration",
      visible: permissions.isCompanyAdmin || permissions.isSuperAdmin, // Only admins can access integration
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
      visible: permissions.isCompanyAdmin || permissions.isSuperAdmin, // Only admins can access AI agents
    }
  ].filter(item => item.visible);

  const systemNavItems = [
    {
      icon: CreditCard,
      label: "Planos",
      href: "/plans",
      visible: permissions.isCompanyAdmin || permissions.isSuperAdmin, // Only admins can see plans
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
      visible: true, // Everyone can access their own settings
    }
  ].filter(item => item.visible);

  // Add admin link if user is super admin
  if (permissions.isSuperAdmin) {
    systemNavItems.push({
      icon: Users,
      label: "Admin Global",
      href: "/admin",
      visible: true,
    });
  }

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
        {featureNavItems.length > 0 && (
          <SidebarNavGroup items={featureNavItems} isCollapsed={isCollapsed} />
        )}
        
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
