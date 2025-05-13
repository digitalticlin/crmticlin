
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

import AdminSidebarHeader from "./sidebar/AdminSidebarHeader";
import AdminSidebarFooter from "./sidebar/AdminSidebarFooter";
import AdminNavItem from "./sidebar/AdminNavItem";
import { getAdminNavItems } from "./sidebar/AdminNavItems";

interface GlobalAdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GlobalAdminSidebar = ({ activeTab, setActiveTab }: GlobalAdminSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isSuperAdmin } = usePermissions();
  
  const adminNavItems = getAdminNavItems(isSuperAdmin);

  return (
    <div
      className={cn(
        "h-screen bg-admin-sidebar sticky top-0 left-0 z-30 flex flex-col transition-all duration-300 shadow-lg border-r",
        isCollapsed ? "w-[80px]" : "w-[250px]"
      )}
    >
      <AdminSidebarHeader isCollapsed={isCollapsed} />

      <div className="flex flex-col flex-1 py-6 px-2 gap-1">
        {adminNavItems.map((item) => (
          <AdminNavItem
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={setActiveTab}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      <AdminSidebarFooter 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
    </div>
  );
};

export default GlobalAdminSidebar;
