
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
  X
} from "lucide-react";
import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarFooter from "./SidebarFooter";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ResponsiveSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, []);

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
      className: "text-green-600"
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

  const SidebarContent = () => (
    <>
      <SidebarLogo isCollapsed={isCollapsed && !isMobile} />
      <Separator className="opacity-30" />
      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        <SidebarNavGroup items={mainNavItems} isCollapsed={isCollapsed && !isMobile} />
        <SidebarNavGroup items={featureNavItems} isCollapsed={isCollapsed && !isMobile} />
        <SidebarNavGroup 
          items={systemNavItems} 
          isCollapsed={isCollapsed && !isMobile} 
          className="mb-0"
        />
      </div>
      <SidebarFooter 
        isCollapsed={isCollapsed && !isMobile} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger - fixo no topo */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 border-b bg-white/25 backdrop-blur-lg border-white/30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-3 hover:bg-white/15">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] bg-white/25 backdrop-blur-lg border-r border-white/30 fixed">
              <div className="h-full flex flex-col">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <SidebarLogo isCollapsed={false} />
        </div>
        
        {/* Mobile spacing para compensar o header fixo */}
        <div className="h-14 md:hidden" />
      </>
    );
  }

  // Desktop sidebar - fixo na lateral
  return (
    <div
      className={cn(
        "hidden md:flex h-screen fixed top-0 left-0 z-30 flex-col transition-all duration-300 border-r bg-white/25 backdrop-blur-lg border-white/30",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <SidebarContent />
    </div>
  );
}
