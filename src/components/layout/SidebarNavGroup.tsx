
import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import NavItem from "./NavItem";

type NavItemData = {
  icon: React.ElementType;
  label: string;
  href: string;
};

type SidebarNavGroupProps = {
  items: NavItemData[];
  isCollapsed: boolean;
  className?: string;
};

const SidebarNavGroup = ({ items, isCollapsed, className = "" }: SidebarNavGroupProps) => {
  return (
    <>
      {items.map((item) => (
        <NavItem
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          isCollapsed={isCollapsed}
        />
      ))}
      
      <div className={`my-2 ${className}`}>
        <Separator />
      </div>
    </>
  );
};

export default SidebarNavGroup;
