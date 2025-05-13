
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminSidebarFooterProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const AdminSidebarFooter = ({ isCollapsed, toggleCollapse }: AdminSidebarFooterProps) => {
  return (
    <div className="p-4 border-t">
      <button
        onClick={toggleCollapse}
        className="w-full p-2 flex justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default AdminSidebarFooter;
