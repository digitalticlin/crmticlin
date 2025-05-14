
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";
import React from "react";

interface FunnelDropdownProps {
  label: React.ReactNode;
  items: {
    label: React.ReactNode;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  iconRight?: React.ReactNode;
  variant?: "outline" | "default";
  className?: string;
}

export function FunnelDropdown({
  label,
  items,
  iconRight,
  variant = "outline",
  className = "",
}: FunnelDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          className={`gap-2 items-center ${className}`}
        >
          {label}
          {iconRight}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {items.map((item, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={item.onClick}
            className="gap-2"
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
