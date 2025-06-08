
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface ImprovedConnectWhatsAppButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

export function ImprovedConnectWhatsAppButton({ onConnect, isConnecting }: ImprovedConnectWhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      console.log('[ImprovedConnect] 🚀 INICIANDO CRIAÇÃO DE INSTÂNCIA');
      console.log('[ImprovedConnect] 📊 Estado:', { isConnecting, isLoading });
      
      await onConnect();
      
      console.log('[ImprovedConnect] ✅ Criação concluída com sucesso');
    } catch (error: any) {
      console.error('[ImprovedConnect] ❌ ERRO na criação:', error);
      console.error('[ImprovedConnect] 📋 Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(`Erro ao conectar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isConnecting || isLoading;

  return (
    <Button 
      onClick={handleConnect}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white gap-2"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isConnecting ? 'Conectando...' : 'Criando...'}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Conectar Nova Instância
        </>
      )}
    </Button>
  );
}
