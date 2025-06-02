import React from "react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
  className?: string;
}

import { NavLink, useNavigate } from "react-router-dom";
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  UserPlus, 
  Calendar,
  Brain,
  Plug,
  CreditCard,
  Shield,
  LogOut,
  Building2,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import SidebarLogo from "./SidebarLogo";
import SidebarFooter from "./SidebarFooter";

const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "WhatsApp Chat", href: "/whatsapp-chat", icon: MessageSquare, className: "text-green-600" },
    { name: "Funil de Vendas", href: "/sales-funnel", icon: BarChart3 },
    { name: "Clientes", href: "/clients", icon: Building2 },
    { name: "Equipe", href: "/team", icon: Users },
    { name: "Automação", href: "/automation", icon: Calendar },
    { name: "Agentes IA", href: "/ai-agents", icon: Brain },
    { name: "Integrações", href: "/integration", icon: Plug },
    { name: "Planos", href: "/plans", icon: CreditCard },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-white shadow-lg border-r border-gray-200">
      <SidebarLogo />
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                item.className
              )
            }
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                item.className
              )}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <SidebarFooter />

      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
