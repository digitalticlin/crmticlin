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
  X
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
      comingSoon: false,
      requiredPermission: 'canManageFunnels' // Apenas gestores e admins
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
      comingSoon: false,
      requiredPermission: 'canManageFunnels' // Apenas gestores e admins
    }
  ];

  const systemNavItems = [
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
        {/* Mobile Header fixo */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 border-b bg-white/25 backdrop-blur-lg border-white/30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-3 hover:bg-white/15">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] bg-white/25 backdrop-blur-lg border-r border-white/30">
              <div className="h-full flex flex-col">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <SidebarLogo isCollapsed={false} />
          
          {/* Badge do Role */}
          {permissions.role && (
            <div className="ml-auto">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                permissions.role === 'admin' 
                  ? "bg-yellow-100/80 text-yellow-800 border border-yellow-200/60"
                  : permissions.role === 'manager'
                  ? "bg-purple-100/80 text-purple-800 border border-purple-200/60"
                  : "bg-blue-100/80 text-blue-800 border border-blue-200/60"
              )}>
                {permissions.role === 'admin' ? 'ADMIN' : 
                 permissions.role === 'manager' ? 'GESTOR' : 'OPERACIONAL'}
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  // Desktop sidebar fixo
  return (
    <div
      className={cn(
        "main-content-scale fixed top-0 left-0 bottom-0 z-40 flex-col transition-all duration-300 border-r bg-white/25 backdrop-blur-lg border-white/30 hidden md:flex",
        isCollapsed ? "w-[64px]" : "w-[200px]"
      )}
    >
      <SidebarContent />
      
      {/* Badge do Role - Desktop */}
      {permissions.role && !isCollapsed && (
        <div className="absolute top-4 right-4">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            permissions.role === 'admin' 
              ? "bg-yellow-100/80 text-yellow-800 border border-yellow-200/60"
              : permissions.role === 'manager'
              ? "bg-purple-100/80 text-purple-800 border border-purple-200/60"
              : "bg-blue-100/80 text-blue-800 border border-blue-200/60"
          )}>
            {permissions.role === 'admin' ? 'ADMIN' : 
             permissions.role === 'manager' ? 'GESTOR' : 'OPERACIONAL'}
          </span>
        </div>
      )}
    </div>
  );
}
