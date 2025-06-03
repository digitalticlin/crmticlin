
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RotateCcw } from "lucide-react";

interface CustomizerHeaderProps {
  onReset: () => void;
}

export function CustomizerHeader({ onReset }: CustomizerHeaderProps) {
  return (
    <SheetHeader className="p-8 pb-6">
      <div className="flex flex-col gap-4">
        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-[#D3D800] via-yellow-400 to-[#D3D800] bg-clip-text text-transparent text-center">
          Personalizar Dashboard
        </SheetTitle>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-2 bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </Button>
        </div>
      </div>
      <p className="text-white/80 text-sm font-medium mt-2 text-center">
        Configure sua experiência de dados
      </p>
    </SheetHeader>
  );
}
