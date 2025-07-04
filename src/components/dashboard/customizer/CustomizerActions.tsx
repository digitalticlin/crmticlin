
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";

interface CustomizerActionsProps {
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function CustomizerActions({ onSave, onClose, saving = false }: CustomizerActionsProps) {
  return (
    <div className="flex justify-between gap-4 pt-4">
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={saving}
        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6"
      >
        Cancelar
      </Button>
      <Button 
        variant="outline"
        onClick={onSave}
        disabled={saving}
        className="flex-1 bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6 flex items-center justify-center gap-2"
      >
        {saving && <LoadingSpinner size="sm" />}
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
