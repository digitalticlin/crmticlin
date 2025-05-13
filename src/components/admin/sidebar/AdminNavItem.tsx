
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AdminNavItemProps {
  id: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  isCollapsed: boolean;
}

const AdminNavItem = ({ id, icon: Icon, label, isActive, onClick, isCollapsed }: AdminNavItemProps) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "w-full flex items-center px-3 py-2 rounded-lg transition-colors",
        isActive
          ? "bg-[#d3d800]/20 text-[#d3d800] font-medium" 
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  );
};

export default AdminNavItem;
