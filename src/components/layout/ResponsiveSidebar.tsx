
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Bot, 
  Settings,
  Kanban,
  ListPlus,
  Menu,
  X,
  CreditCard,
  Wrench
} from "lucide-react";
import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarFooter from "./SidebarFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/contexts/SidebarContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export default function ResponsiveSidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { permissions, loading } = useUserPermissions();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  // Se ainda está carregando permissões, não renderizar o sidebar
  if (loading) {
    return null;
  }

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/",
      comingSoon: false,
      requiredPermission: null // Todos podem acessar
    },
    {
      icon: Kanban,
      label: "Funil de Vendas",
      href: "/sales-funnel",
      comingSoon: false,
      requiredPermission: null // Todos podem acessar
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/whatsapp-chat",
      comingSoon: false,
      requiredPermission: null // Todos podem acessar
    }
  ];

  const featureNavItems = [
    {
      icon: Users,
      label: "Clientes",
      href: "/clients",
      comingSoon: false,
      requiredPermission: null // Todos podem acessar
    },
    {
      icon: ListPlus,
      label: "Automação",
      href: "/automation",
      comingSoon: true,
      badgeIcon: Wrench,
      disabledReason: 'Estamos melhorando esta área. Volte em breve.',
      requiredPermission: 'canManageFunnels' // Apenas gestores e admins
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
      comingSoon: true,
      badgeIcon: Wrench,
      disabledReason: 'Estamos melhorando esta área. Volte em breve.',
      requiredPermission: 'canManageFunnels' // Apenas gestores e admins
    }
  ];

  const systemNavItems = [
    {
      icon: CreditCard,
      label: "Planos",
      href: "/plans",
      comingSoon: false,
      requiredPermission: null // Todos podem acessar
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
      comingSoon: false,
      requiredPermission: 'canAccessSettings' // Apenas gestores e admins
    }
  ];

  // Filtrar itens baseado nas permissões
  const filterItemsByPermission = (items: any[]) => {
    return items.filter(item => {
      if (!item.requiredPermission) return true;
      return permissions[item.requiredPermission as keyof typeof permissions];
    });
  };

  const filteredMainNavItems = filterItemsByPermission(mainNavItems);
  const filteredFeatureNavItems = filterItemsByPermission(featureNavItems);
  const filteredSystemNavItems = filterItemsByPermission(systemNavItems);

  const SidebarContent = () => (
    <>
      <SidebarLogo isCollapsed={isCollapsed && !isMobile} />
      <Separator className="opacity-30" />
      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        {filteredMainNavItems.length > 0 && (
          <SidebarNavGroup items={filteredMainNavItems} isCollapsed={isCollapsed && !isMobile} />
        )}
        {filteredFeatureNavItems.length > 0 && (
          <SidebarNavGroup items={filteredFeatureNavItems} isCollapsed={isCollapsed && !isMobile} />
        )}
        {filteredSystemNavItems.length > 0 && (
          <SidebarNavGroup 
            items={filteredSystemNavItems} 
            isCollapsed={isCollapsed && !isMobile} 
            className="mb-0"
          />
        )}
      </div>
      <SidebarFooter 
        isCollapsed={isCollapsed && !isMobile} 
        toggleCollapse={toggleCollapse} 
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Header fixo - 100% transparente com glassmorphism */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-center px-4 border-b backdrop-blur-xl border-white/30 shadow-lg">
          <SidebarLogo isCollapsed={false} />
        </div>
      </>
    );
  }

  // Desktop sidebar fixo
  return (
    <div
      className={cn(
        "fixed top-0 left-0 bottom-0 z-40 flex-col transition-all duration-300 border-r bg-white/25 backdrop-blur-lg border-white/30 hidden md:flex",
        isCollapsed ? "w-[64px]" : "w-[200px]"
      )}
    >
      <SidebarContent />
      
    </div>
  );
}
