
import { Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProfileActionsSectionProps {
  saving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const ProfileActionsSection = ({ saving, onSave, onCancel }: ProfileActionsSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex justify-end animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className={cn(
        "flex gap-4",
        isMobile ? "flex-col w-full" : "flex-row"
      )}>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
        >
          <X className="h-4 w-4" />
          <span>Cancelar</span>
        </button>
        
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-[#D3D800] to-[#D3D800]/80 hover:from-[#D3D800]/90 hover:to-[#D3D800]/70 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileActionsSection;
