
import { Button } from "@/components/ui/button";

interface CustomizerActionsProps {
  onSave: () => void;
  onClose: () => void;
}

export function CustomizerActions({ onSave, onClose }: CustomizerActionsProps) {
  return (
    <div className="flex justify-between gap-4 pt-4">
      <Button 
        variant="outline" 
        onClick={onClose}
        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6"
      >
        Cancelar
      </Button>
      <Button 
        variant="outline"
        onClick={onSave}
        className="flex-1 bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 hover:scale-105 py-6"
      >
        Salvar
      </Button>
    </div>
  );
}
