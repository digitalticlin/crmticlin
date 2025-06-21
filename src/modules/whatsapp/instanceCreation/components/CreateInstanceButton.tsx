
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useInstanceCreation } from '../hooks/useInstanceCreation';

interface CreateInstanceButtonProps {
  onSuccess?: (result: any) => void;
  variant?: "default" | "outline" | "whatsapp";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const CreateInstanceButton = ({ 
  onSuccess, 
  variant = "whatsapp", 
  size = "lg",
  className = ""
}: CreateInstanceButtonProps) => {
  const { createInstance, isCreating } = useInstanceCreation(onSuccess);

  const handleCreate = async () => {
    await createInstance();
  };

  return (
    <Button 
      onClick={handleCreate}
      disabled={isCreating}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      {isCreating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Criando Instância...
        </>
      ) : (
        <>
          <Plus className="h-5 w-5" />
          Conectar WhatsApp
        </>
      )}
    </Button>
  );
};
