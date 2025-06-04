
import { useState } from "react";
import { Building2, Users, CreditCard, MessageSquare, FileText, LifeBuoy, Settings, ChevronRight, ChevronLeft, RefreshCw, Activity, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarLogo from "@/components/layout/SidebarLogo";
import { Separator } from "@/components/ui/separator";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GlobalAdminSidebar = ({ activeTab, setActiveTab }: GlobalAdminSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const adminNavItems = [
    {
      id: "companies",
      icon: Building2,
      label: "Empresas",
    },
    {
      id: "users",
      icon: Users,
      label: "Usuários",
    },
    {
      id: "plans",
      icon: CreditCard,
      label: "Planos",
    },
    {
      id: "whatsapp",
      icon: MessageSquare,
      label: "WhatsApp",
    },
    {
      id: "sync",
      icon: RefreshCw,
      label: "Sincronização",
    },
    {
      id: "sync-logs",
      icon: Activity,
      label: "Logs Sync",
    },
    {
      id: "vps",
      icon: Server,
      label: "VPS",
    },
    {
      id: "logs",
      icon: FileText,
      label: "Logs",
    },
  ];

  return (
    <div
      className={cn(
        "h-screen bg-admin-sidebar sticky top-0 left-0 z-30 flex flex-col transition-all duration-300 shadow-lg border-r",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <div className="p-4 flex items-center justify-center">
        <SidebarLogo isCollapsed={isCollapsed} />
        {!isCollapsed && <span className="ml-2 text-xl font-bold text-ticlin">Admin</span>}
      </div>

      <Separator />

      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        {adminNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center px-3 py-2 rounded-lg transition-colors",
              activeTab === item.id 
                ? "bg-[#d3d800]/20 text-[#d3d800] font-medium" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full p-2 flex justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default GlobalAdminSidebar;
