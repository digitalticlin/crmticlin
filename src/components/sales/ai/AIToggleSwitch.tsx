
import { Switch } from "@/components/ui/switch";
import { Bot, BotOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIToggleSwitchProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export const AIToggleSwitch = ({
  enabled,
  onToggle,
  isLoading = false,
  size = "md",
  showIcon = true,
  className
}: AIToggleSwitchProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  return (
    <div className={cn(
      "flex items-center gap-2",
      size === "sm" ? "text-xs" : "text-sm",
      className
    )}>
      {showIcon && (
        enabled ? (
          <Bot className={cn(iconSize, "text-green-600")} />
        ) : (
          <BotOff className={cn(iconSize, "text-gray-400")} />
        )
      )}
      
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={isLoading}
        className={cn(
          size === "sm" && "scale-75"
        )}
      />
      
      <span className={cn(
        "font-medium",
        enabled ? "text-green-700" : "text-gray-500"
      )}>
        IA {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
};
