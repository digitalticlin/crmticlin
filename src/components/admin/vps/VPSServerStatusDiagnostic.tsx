
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { VPSStatusCard } from "./VPSStatusCard";
import { VPSErrorDisplay } from "./VPSErrorDisplay";
import { VPSRecommendationsPanel } from "./VPSRecommendationsPanel";

interface ServerStatus {
  isOnline: boolean;
  version?: string;
  server?: string;
  port?: string;
  isPersistent?: boolean;
  activeInstances?: number;
  error?: string;
}

export const VPSServerStatusDiagnostic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ServerStatus | null>(null);

  const checkServerStatus = async () => {
    setIsLoading(true);
    setStatus(null);
    
    try {
      console.log('[VPS Status] Verificando servidor via Edge Functions...');
      
      // Usar WhatsAppWebService ao invés de chamadas diretas
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (result.success && result.data) {
        console.log('[VPS Status] Servidor encontrado via Edge Functions:', result.data);
        
        setStatus({
          isOnline: true,
          version: result.data.version || 'v4.0.0',
          server: result.data.server || 'WhatsApp Web.js Server',
          port: '3001', // Porta padrão
          isPersistent: result.data.permanent_mode || result.data.permanentMode || true,
          activeInstances: result.data.active_instances || result.data.activeInstances || 0
        });
        
        toast.success('Servidor encontrado e funcionando');
      } else {
        console.error('[VPS Status] Erro na resposta:', result.error);
        setStatus({
          isOnline: false,
          error: result.error || 'Servidor WhatsApp não está respondendo'
        });
        toast.error('Servidor WhatsApp não está funcionando');
      }
      
    } catch (error) {
      console.error('[VPS Status] Erro ao verificar status:', error);
      setStatus({
        isOnline: false,
        error: `Erro de conectividade: ${error.message}`
      });
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status do Servidor VPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={checkServerStatus}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Server className="h-4 w-4" />
              )}
              {isLoading ? 'Verificando...' : 'Verificar Status'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Verifica o servidor via Edge Functions (método seguro e compatível).
          </p>
        </CardContent>
      </Card>

      {/* Resultados */}
      {status && (
        <div className="space-y-4">
          <VPSStatusCard status={status} />
          
          {status.error && (
            <VPSErrorDisplay error={status.error} />
          )}
          
          <VPSRecommendationsPanel status={status} />
        </div>
      )}
    </div>
  );
};
