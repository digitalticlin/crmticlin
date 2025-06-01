
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Users, 
  UserCheck,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Terminal,
  BarChart3
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    name: "Administrador",
    href: "/admin",
    icon: Shield,
  },
  {
    name: "WhatsApp Admin",
    href: "/admin/whatsapp",
    icon: Activity,
  },
  {
    name: "VPS Diagnóstico",
    href: "/vps-diagnostic",
    icon: Terminal,
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className={cn(
      "relative flex flex-col bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            WhatsApp CRM
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-2 h-10",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {!isCollapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.email}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-2",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
