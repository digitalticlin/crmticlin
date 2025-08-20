import { Button } from "@/components/ui/button";
import { CheckSquare, Square } from "lucide-react";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { cn } from "@/lib/utils";

interface MassSelectionToggleProps {
  className?: string;
  massSelection: MassSelectionReturn;
}

export const MassSelectionToggle = ({ className, massSelection }: MassSelectionToggleProps) => {
  if (!massSelection) return null;

  const { isSelectionMode, enterSelectionMode, exitSelectionMode } = massSelection;

  const handleToggle = () => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        isSelectionMode 
          ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" 
          : "hover:bg-gray-50",
        className
      )}
    >
      {isSelectionMode ? (
        <>
          <CheckSquare size={16} />
          Sair da Seleção
        </>
      ) : (
        <>
          <Square size={16} />
          Seleção em Massa
        </>
      )}
    </Button>
  );
};