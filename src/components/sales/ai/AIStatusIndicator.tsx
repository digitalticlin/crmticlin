
import { Bot, BotOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIStatusIndicatorProps {
  enabled: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const AIStatusIndicator = ({
  enabled,
  size = "md",
  showText = false,
  className
}: AIStatusIndicatorProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5",
      className
    )}>
      {enabled ? (
        <Bot className={cn(
          sizeClasses[size],
          "text-green-600"
        )} />
      ) : (
        <BotOff className={cn(
          sizeClasses[size],
          "text-gray-400"
        )} />
      )}
      
      {showText && (
        <span className={cn(
          textSizeClasses[size],
          "font-medium",
          enabled ? "text-green-700" : "text-gray-500"
        )}>
          IA {enabled ? "Ativa" : "Inativa"}
        </span>
      )}
    </div>
  );
};
