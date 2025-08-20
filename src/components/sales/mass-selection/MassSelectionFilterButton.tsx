import { Button } from "@/components/ui/button";
import { CheckSquare, Square } from "lucide-react";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { cn } from "@/lib/utils";

interface MassSelectionFilterButtonProps {
  massSelection: MassSelectionReturn;
}

export const MassSelectionFilterButton = ({ massSelection }: MassSelectionFilterButtonProps) => {
  const { isSelectionMode, selectedLeads, enterSelectionMode, exitSelectionMode } = massSelection;

  // Temporary debug logs
  console.log('🐛 [DEBUG] MassSelectionFilterButton render:', {
    isSelectionMode,
    selectedCount: selectedLeads.size,
    hasEnterSelectionMode: typeof enterSelectionMode === 'function',
    hasExitSelectionMode: typeof exitSelectionMode === 'function'
  });

  const handleToggle = () => {
    console.log('🐛 [DEBUG] Toggle button clicked, current mode:', isSelectionMode);
    if (isSelectionMode) {
      console.log('🐛 [DEBUG] Calling exitSelectionMode');
      exitSelectionMode();
    } else {
      console.log('🐛 [DEBUG] Calling enterSelectionMode');
      enterSelectionMode();
    }
  };

  const selectedCount = selectedLeads.size;

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      className={cn(
        // Estilo base idêntico ao botão "Responsável"
        "bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl h-9 px-3 transition-all duration-200",
        // Estilo ativo quando em modo seleção
        isSelectionMode && "bg-blue-500/20 border-blue-500/30 text-blue-700 hover:bg-blue-500/30 hover:text-blue-800"
      )}
    >
      {isSelectionMode ? (
        <CheckSquare className="w-4 h-4 mr-1" />
      ) : (
        <Square className="w-4 h-4 mr-1" />
      )}
      <span className="hidden sm:inline">
        {isSelectionMode ? "Selecionando" : "Seleção em Massa"}
      </span>
      {/* Mostrar contador quando há leads selecionados */}
      {selectedCount > 0 && (
        <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {selectedCount}
        </span>
      )}
    </Button>
  );
};