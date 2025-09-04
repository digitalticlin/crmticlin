
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Zap } from "lucide-react";
import { useInstanceCreation } from '../hooks/useInstanceCreation';
import { useQRModal } from "@/modules/whatsapp/hooks/useQRModal";
import { toast } from "sonner";

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
  const { createInstance, creationState, isCreating } = useInstanceCreation();
  const { openModal, closeModal } = useQRModal();

  const handleCreate = async () => {
    console.log('[CreateInstanceButton] 🚀 NOVA ABORDAGEM: Abrindo modal primeiro, criando depois');
    
    // 1. ABRIR MODAL IMEDIATAMENTE com estado "Criando instância"
    const tempInstanceId = `temp_${Date.now()}`; // ID temporário
    openModal(tempInstanceId, 'Nova Instância');
    
    try {
      // 2. CRIAR INSTÂNCIA NA VPS
      const result = await createInstance();
      
      if (result?.success && result.instance?.id) {
        console.log('[CreateInstanceButton] ✅ Instância criada, atualizando modal:', result.instance.id);
        
        // 3. ATUALIZAR MODAL COM ID REAL
        closeModal(); // Fechar modal temporário
        setTimeout(() => {
          openModal(result.instance.id, result.instance.instance_name);
        }, 100);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        // 4. SE DER ERRO - MOSTRAR NO MODAL E FECHAR
        console.error('[CreateInstanceButton] ❌ Erro na criação:', result?.error);
        closeModal();
        toast.error(`Erro: ${result?.error || 'Falha ao criar instância'}`);
      }
    } catch (error: any) {
      console.error('[CreateInstanceButton] ❌ Erro inesperado:', error);
      closeModal();
      toast.error(`Erro: ${error.message}`);
    }
  };

  // Estados visuais baseados no creationState
  const getButtonContent = () => {
    if (isCreating) {
      return (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Conectando...
        </>
      );
    }
    
    return (
      <>
        <Plus className="h-5 w-5" />
        Conectar WhatsApp
      </>
    );
  };

  return (
    <Button 
      onClick={handleCreate}
      disabled={isCreating}
      variant={variant}
      size={size}
      className={`gap-2 transition-all duration-300 ${className}`}
    >
      {getButtonContent()}
    </Button>
  );
};
