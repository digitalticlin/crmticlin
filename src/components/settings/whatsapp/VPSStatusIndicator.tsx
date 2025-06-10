
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity } from "lucide-react";
import { ApiClient } from "@/lib/apiClient";

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
      console.log('[VPS Status] 🔍 Verificando status do VPS corrigido...');
      
      const startTime = Date.now();
      const result = await ApiClient.checkVPSHealth();
      const responseTime = Date.now() - startTime;
      
      setVpsStatus({
        online: result.success,
        responseTime,
        lastCheck: new Date()
      });
      
      console.log('[VPS Status] 📊 Status obtido:', {
        online: result.success,
        responseTime: `${responseTime}ms`
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
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(checkVPSStatus, 30000);
    
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
      return (
        <Badge variant="default" className="bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          VPS Online
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
