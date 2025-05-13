
import { Separator } from "@/components/ui/separator";
import SidebarLogo from "@/components/layout/SidebarLogo";

interface AdminSidebarHeaderProps {
  isCollapsed: boolean;
}

const AdminSidebarHeader = ({ isCollapsed }: AdminSidebarHeaderProps) => {
  return (
    <>
      <div className="p-4 flex items-center justify-center">
        <SidebarLogo isCollapsed={isCollapsed} />
        {!isCollapsed && <span className="ml-2 text-xl font-bold text-ticlin">Admin</span>}
      </div>
      <Separator />
    </>
  );
};

export default AdminSidebarHeader;
