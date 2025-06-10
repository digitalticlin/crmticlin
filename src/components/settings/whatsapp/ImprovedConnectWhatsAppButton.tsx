
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Plus, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ImprovedConnectWhatsAppButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  creationProgress?: {
    phase: string;
    message: string;
    timeElapsed: number;
  } | null;
}

export function ImprovedConnectWhatsAppButton({ 
  onConnect, 
  isConnecting, 
  creationProgress 
}: ImprovedConnectWhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      console.log('[ImprovedConnect] 🚀 INICIANDO CRIAÇÃO COM SISTEMA ROBUSTO');
      console.log('[ImprovedConnect] 📊 Estado:', { isConnecting, isLoading });
      
      await onConnect();
      
      console.log('[ImprovedConnect] ✅ Criação concluída com sistema robusto');
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

  // Determinar ícone baseado no progresso
  const getProgressIcon = () => {
    if (!creationProgress) {
      return loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />;
    }

    if (creationProgress.phase === 'WARNING' && creationProgress.timeElapsed > 70) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    if (creationProgress.timeElapsed > 30) {
      return <Clock className="h-4 w-4" />;
    }

    return <Loader2 className="h-4 w-4 animate-spin" />;
  };

  // Determinar texto baseado no progresso
  const getProgressText = () => {
    if (!creationProgress) {
      return loading ? 'Criando...' : 'Conectar Nova Instância';
    }

    if (creationProgress.timeElapsed > 70) {
      return `Aguarde... (${creationProgress.timeElapsed}s)`;
    }

    if (creationProgress.timeElapsed > 30) {
      return `Conectando... (${creationProgress.timeElapsed}s)`;
    }

    return 'Criando...';
  };

  // Determinar cor do botão baseado no progresso
  const getButtonVariant = () => {
    if (creationProgress?.phase === 'WARNING') {
      return "secondary";
    }
    return loading ? "secondary" : "default";
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleConnect}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white gap-2"
        size="lg"
        variant={getButtonVariant()}
      >
        {getProgressIcon()}
        {getProgressText()}
      </Button>
      
      {/* Mostrar detalhes do progresso */}
      {creationProgress && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {creationProgress.message}
          </p>
          {creationProgress.timeElapsed > 60 && (
            <p className="text-xs text-yellow-600 mt-1">
              Sistema está usando retry automático...
            </p>
          )}
          {creationProgress.timeElapsed > 75 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Operação demorada detectada - sistema robusto em ação
            </p>
          )}
        </div>
      )}
    </div>
  );
}
