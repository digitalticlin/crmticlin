
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useInstanceCreation } from "@/modules/whatsapp/instanceCreation/hooks/useInstanceCreation";
import { useQRModal } from "@/modules/whatsapp/hooks/useQRModal";
import { toast } from "sonner";

interface AddNewConnectionCardProps {
  onSuccess?: () => void;
  onModalRequest?: (instanceId: string, instanceName: string) => void;
  onModalClose?: () => void;
}

export const AddNewConnectionCard = ({ onSuccess, onModalRequest, onModalClose }: AddNewConnectionCardProps) => {
  const { createInstance, isCreating } = useInstanceCreation();
  const { openModal, closeModal } = useQRModal();
  
  const handleConnect = async () => {
    console.log('[AddNewConnectionCard] 🚀 ABORDAGEM SIMPLIFICADA: Criar instância primeiro, depois abrir modal');
    
    if (!onModalRequest) {
      toast.error('Callback de modal não fornecido');
      return;
    }
    
    try {
      // 1. CRIAR INSTÂNCIA NA VPS PRIMEIRO (sem modal)
      console.log('[AddNewConnectionCard] 🛠️ Criando instância...');
      const result = await createInstance();
      
      if (result?.success && result.instance?.id) {
        console.log('[AddNewConnectionCard] ✅ Instância criada, abrindo modal QR:', result.instance.id);
        
        // 2. ABRIR MODAL DIRETO COM ID REAL
        onModalRequest(result.instance.id, result.instance.instance_name || 'WhatsApp');
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('[AddNewConnectionCard] ❌ Erro na criação:', result?.error);
        toast.error(`Erro: ${result?.error || 'Falha ao criar instância'}`);
      }
    } catch (error: any) {
      console.error('[AddNewConnectionCard] ❌ Erro inesperado:', error);
      toast.error(`Erro: ${error.message}`);
    }
  };
  return (
    <Card className="group relative transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1
      bg-white/20 backdrop-blur-xl 
      border-2 border-dashed border-green-300/50 rounded-2xl overflow-hidden
      min-h-[280px] flex items-center justify-center">{/* ✅ REMOVIDO onClick do card */}
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <CardContent className="p-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
          bg-green-400/20 backdrop-blur-sm mb-4 border border-green-300/30
          group-hover:scale-110 transition-transform duration-200">
          {isCreating ? (
            <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          ) : (
            <Plus className="h-8 w-8 text-green-600" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-2">Nova Conexão</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Conecte mais uma conta WhatsApp com QR automático
        </p>
        
        <Button
          onClick={handleConnect}
          disabled={isCreating}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
            text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
