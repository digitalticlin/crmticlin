
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useInstanceDeletion } from '../hooks/useInstanceDeletion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteInstanceButtonProps {
  instanceId: string;
  instanceName?: string;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const DeleteInstanceButton = ({ 
  instanceId,
  instanceName = "esta instância",
  onSuccess,
  variant = "outline",
  size = "sm",
  className = ""
}: DeleteInstanceButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { deleteInstance, isDeleting } = useInstanceDeletion(() => {
    setIsConfirmOpen(false);
    if (onSuccess) onSuccess();
  });

  const handleDelete = async () => {
    await deleteInstance(instanceId);
  };

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar {instanceName}? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              'Deletar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
