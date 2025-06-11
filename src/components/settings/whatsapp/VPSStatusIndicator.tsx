
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity } from "lucide-react";

interface VPSStatus {
  online: boolean;
  responseTime?: number;
  lastCheck?: Date;
}

export const VPSStatusIndicator = () => {
  const [vpsStatus, setVpsStatus] = useState<VPSStatus>({ online: false });
  const [isChecking, setIsChecking] = useState(false);

  const checkVPSStatus = async () => {
    setIsChecking(true);
    try {
      console.log('[VPS Status] 🔍 Verificando status do VPS via teste simples...');
      
      const startTime = Date.now();
      
      // CORREÇÃO: Usar fetch simples para health check rápido, sem Edge Function
      const response = await fetch('http://31.97.24.222:3002/health', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5s timeout apenas
      });
      
      const responseTime = Date.now() - startTime;
      const isOnline = response.ok;
      
      setVpsStatus({
        online: isOnline,
        responseTime,
        lastCheck: new Date()
      });
      
      console.log('[VPS Status] 📊 Status obtido:', {
        online: isOnline,
        responseTime: `${responseTime}ms`,
        status: response.status
      });
      
    } catch (error: any) {
      console.error('[VPS Status] ❌ Erro ao verificar status:', error);
      setVpsStatus({
        online: false,
        lastCheck: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVPSStatus();
    
    // Verificar status a cada 60 segundos (menos frequente)
    const interval = setInterval(checkVPSStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Activity className="h-3 w-3 mr-1 animate-spin" />
          Verificando...
        </Badge>
      );
    }

    if (vpsStatus.online) {
      const isSlowVps = vpsStatus.responseTime && vpsStatus.responseTime > 2000;
      return (
        <Badge variant="default" className={isSlowVps ? "bg-yellow-600 text-white" : "bg-green-600 text-white"}>
          <CheckCircle className="h-3 w-3 mr-1" />
          VPS {isSlowVps ? 'Lenta' : 'Online'}
          {vpsStatus.responseTime && ` (${vpsStatus.responseTime}ms)`}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        VPS Offline
      </Badge>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      {vpsStatus.lastCheck && (
        <span className="text-xs text-gray-500">
          Última verificação: {vpsStatus.lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};
