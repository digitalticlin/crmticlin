
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProfileActionsProps {
  saving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const ProfileActions = ({ saving, onSave, onCancel }: ProfileActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline"
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button 
        className="bg-ticlin hover:bg-ticlin/90 text-black"
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
