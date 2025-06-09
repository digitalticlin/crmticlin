
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wifi,
  Activity 
} from "lucide-react";
import { AsyncStatusService } from "@/services/whatsapp/asyncStatusService";
import { toast } from "sonner";

interface AsyncStatusIndicatorProps {
  instances: any[];
  onRefresh: () => void;
}

export const AsyncStatusIndicator = ({ instances, onRefresh }: AsyncStatusIndicatorProps) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<Date | null>(null);

  // Contar instâncias por status
  const statusCounts = {
    pending: instances.filter(i => 
      i.connection_status === 'vps_pending' || 
      i.connection_status === 'initializing'
    ).length,
    waiting: instances.filter(i => i.connection_status === 'waiting_qr').length,
    ready: instances.filter(i => 
      i.connection_status === 'ready' || 
      i.connection_status === 'connected'
    ).length,
    error: instances.filter(i => 
      i.connection_status === 'error' || 
      i.connection_status === 'vps_error'
    ).length
  };

  const handleRecoverPending = async () => {
    if (statusCounts.pending === 0) {
      toast.info('Nenhuma instância pendente para recuperar');
      return;
    }

    setIsRecovering(true);
    try {
      console.log('[Status Indicator] 🔧 Iniciando recuperação manual');
      
      const result = await AsyncStatusService.recoverPendingInstances();
      
      if (result.recovered > 0) {
        toast.success(`${result.recovered} instâncias recuperadas!`);
        onRefresh(); // Atualizar a lista
        setLastRecovery(new Date());
      } else if (result.errors.length > 0) {
        toast.warning(`Nenhuma instância recuperada. ${result.errors.length} erros encontrados.`);
      } else {
        toast.info('Nenhuma instância precisava de recuperação');
      }

    } catch (error: any) {
      console.error('[Status Indicator] ❌ Erro na recuperação:', error);
      toast.error(`Erro na recuperação: ${error.message}`);
    } finally {
      setIsRecovering(false);
    }
  };

  // Auto-recuperação periódica para instâncias pendentes
  useEffect(() => {
    if (statusCounts.pending === 0) return;

    console.log(`[Status Indicator] ⏰ Agendando auto-recuperação para ${statusCounts.pending} instâncias pendentes`);
    
    const timer = setTimeout(async () => {
      try {
        console.log('[Status Indicator] 🔄 Auto-recuperação executando...');
        await AsyncStatusService.recoverPendingInstances();
        onRefresh();
      } catch (error) {
        console.log('[Status Indicator] ⚠️ Erro na auto-recuperação:', error);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, [statusCounts.pending, onRefresh]);

  if (instances.length === 0) {
    return null; // Não mostrar se não há instâncias
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Status das Instâncias</span>
            </div>
            
            <div className="flex items-center gap-2">
              {statusCounts.ready > 0 && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {statusCounts.ready} Pronta(s)
                </Badge>
              )}
              
              {statusCounts.waiting > 0 && (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Wifi className="h-3 w-3 mr-1" />
                  {statusCounts.waiting} Aguardando QR
                </Badge>
              )}
              
              {statusCounts.pending > 0 && (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {statusCounts.pending} Pendente(s)
                </Badge>
              )}
              
              {statusCounts.error > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {statusCounts.error} Erro(s)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRecovery && (
              <span className="text-xs text-gray-600">
                Última recuperação: {lastRecovery.toLocaleTimeString()}
              </span>
            )}
            
            {statusCounts.pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecoverPending}
                disabled={isRecovering}
                className="bg-white/50 hover:bg-white/70 border-blue-300"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recuperando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recuperar Pendentes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {statusCounts.pending > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                <strong>{statusCounts.pending} instância(s)</strong> com criação pendente na VPS.
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Sistema tentará recuperar automaticamente em segundo plano.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
