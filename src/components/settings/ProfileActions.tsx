
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProfileActionsProps {
  saving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const ProfileActions = ({ saving, onSave, onCancel }: ProfileActionsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "flex gap-2",
      isMobile ? "flex-col w-full" : "justify-end"
    )}>
      <Button 
        variant="outline"
        onClick={onCancel}
        className={isMobile ? "w-full" : ""}
      >
        Cancelar
      </Button>
      <Button 
        className={cn(
          "bg-ticlin hover:bg-ticlin/90 text-black",
          isMobile ? "w-full" : ""
        )}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Alterações'
        )}
      </Button>
    </div>
  );
};

export default ProfileActions;
