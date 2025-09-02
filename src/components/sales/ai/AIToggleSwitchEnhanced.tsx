
import { Switch } from "@/components/ui/switch";
import { Bot, BotOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIToggleSwitchEnhancedProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "prominent";
  className?: string;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export const AIToggleSwitchEnhanced = ({
  enabled,
  onToggle,
  isLoading = false,
  size = "md",
  variant = "default",
  className,
  label = "IA",
  showLabel = true,
  disabled = false
}: AIToggleSwitchEnhancedProps) => {
  const handleToggle = (checked: boolean) => {
    if (!isLoading && !disabled) {
      onToggle(checked);
    }
  };

  // Configurações de tamanho
  const sizeConfig = {
    sm: {
      container: "gap-1.5 text-xs",
      icon: "h-3 w-3",
      switch: "scale-75",
      padding: "px-2 py-1"
    },
    md: {
      container: "gap-2 text-sm",
      icon: "h-4 w-4",
      switch: "",
      padding: "px-3 py-1.5"
    },
    lg: {
      container: "gap-2.5 text-base",
      icon: "h-5 w-5",
      switch: "scale-110",
      padding: "px-4 py-2"
    }
  };

  // Configurações de variante
  const variantConfig = {
    default: {
      background: enabled 
        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40" 
        : "bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-300/30",
      text: enabled ? "text-green-700" : "text-gray-600",
      shadow: "shadow-sm hover:shadow-md"
    },
    compact: {
      background: enabled 
        ? "bg-green-100/80 border-green-300/50" 
        : "bg-gray-100/60 border-gray-300/40",
      text: enabled ? "text-green-800" : "text-gray-600",
      shadow: "shadow-sm"
    },
    prominent: {
      background: enabled 
        ? "bg-gradient-to-br from-green-400/30 via-emerald-500/20 to-teal-500/20 border-green-400/60" 
        : "bg-gradient-to-br from-gray-400/20 via-slate-500/15 to-gray-600/10 border-gray-300/40",
      text: enabled ? "text-green-800 font-semibold" : "text-gray-700",
      shadow: "shadow-lg hover:shadow-xl"
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300",
        currentSize.container,
        currentSize.padding,
        currentVariant.background,
        currentVariant.shadow,
        currentVariant.text,
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:scale-105 cursor-pointer",
        className
      )}
      onClick={() => !disabled && handleToggle(!enabled)}
      title={`IA ${enabled ? 'Ativada' : 'Desativada'} - Clique para ${enabled ? 'desativar' : 'ativar'}`}
    >
      {/* Ícone com animação */}
      <div className="flex items-center justify-center">
        {isLoading ? (
          <Loader2 className={cn(currentSize.icon, "animate-spin text-blue-600")} />
        ) : enabled ? (
          <Bot className={cn(currentSize.icon, "text-green-600 animate-pulse")} />
        ) : (
          <BotOff className={cn(currentSize.icon, "text-gray-500")} />
        )}
      </div>

      {/* Switch Component */}
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isLoading || disabled}
        className={cn(
          currentSize.switch,
          enabled && "data-[state=checked]:bg-green-600",
          !enabled && "data-[state=unchecked]:bg-gray-300"
        )}
      />

      {/* Label (opcional) */}
      {showLabel && (
        <span className={cn(
          "font-medium whitespace-nowrap transition-colors duration-200",
          currentVariant.text
        )}>
          {enabled ? label : ""}
        </span>
      )}

      {/* Indicador de status visual */}
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        enabled ? "bg-green-500 shadow-green-400/50 shadow-sm" : "bg-gray-400"
      )}/>
    </div>
  );
};
