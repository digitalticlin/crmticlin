
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingAddWhatsAppButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
  isNewUser?: boolean;
}

export default function FloatingAddWhatsAppButton({
  onClick,
  disabled,
  isLoading,
  isSuperAdmin,
  isNewUser,
}: FloatingAddWhatsAppButtonProps) {
  const isMobile = useIsMobile();

  // Só mostra se pode adicionar (SuperAdmin ou primeiro do novo user)
  if (!isSuperAdmin && !isNewUser) return null;

  // Exemplo: fixa no canto inferior direito do container.
  return (
    <div
      className={cn(
        "fixed z-40 bottom-8 right-8",
        "rounded-full shadow-lg bg-green-600 hover:bg-green-700 transition-all",
        "flex items-center justify-center",
        isMobile && "bottom-4 right-4"
      )}
      style={{
        width: 64,
        height: 64,
        boxShadow: "0 4px 20px 0 rgba(16,20,29,0.13), 0 2px 10px 0 rgba(0,0,0,0.06)"
      }}
    >
      <Button
        type="button"
        variant="whatsapp"
        size="icon"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "rounded-full bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500",
          "w-16 h-16 min-w-0 min-h-0 flex items-center justify-center p-0",
          "text-white text-3xl"
        )}
        aria-label="Adicionar WhatsApp"
      >
        {isLoading ? (
          <span className="animate-spin w-7 h-7 border-2 border-white border-t-green-400 rounded-full inline-block" />
        ) : (
          <Plus className="w-8 h-8" />
        )}
      </Button>
    </div>
  );
}
