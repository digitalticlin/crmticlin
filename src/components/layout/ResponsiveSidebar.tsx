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
import { useSidebar } from "@/contexts/SidebarContext";

export default function ResponsiveSidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
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
      comingSoon: false
    },
    {
      icon: Kanban,
      label: "Funil de Vendas",
      href: "/sales-funnel",
      comingSoon: false
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/whatsapp-chat",
      comingSoon: false
    }
  ];

  const featureNavItems = [
    {
      icon: Users,
      label: "Clientes",
      href: "/clients",
      comingSoon: true
    },
    {
      icon: ListPlus,
      label: "Automação",
      href: "/automation",
      comingSoon: true
    },
    {
      icon: Cable,
      label: "Integração",
      href: "/integration",
      comingSoon: true
    },
    {
      icon: Bot,
      label: "Agentes IA",
      href: "/ai-agents",
      comingSoon: true
    }
  ];

  const systemNavItems = [
    {
      icon: CreditCard,
      label: "Planos",
      href: "/plans",
      comingSoon: true
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
      comingSoon: false
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
        </div>
      </>
    );
  }

  // Desktop sidebar fixo
  return (
    <div
      className={cn(
        "fixed top-0 left-0 bottom-0 z-30 flex-col transition-all duration-300 border-r bg-white/25 backdrop-blur-lg border-white/30 hidden md:flex",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <SidebarContent />
    </div>
  );
}
