
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useInstanceCreation } from '../hooks/useInstanceCreation';

interface CreateInstanceButtonProps {
  variant?: "default" | "outline" | "whatsapp";
  size?: "default" | "sm" | "lg";
  className?: string;
  onSuccess?: () => void | Promise<void>;
}

export const CreateInstanceButton = ({ 
  variant = "whatsapp", 
  size = "lg",
  className = "",
  onSuccess
}: CreateInstanceButtonProps) => {
  const { createInstance, isCreating } = useInstanceCreation();

  const handleCreate = async () => {
    console.log('[CreateInstanceButton] 🚀 Iniciando criação de instância');
    const result = await createInstance();
    
    if (result.success && onSuccess) {
      await onSuccess();
    }
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
