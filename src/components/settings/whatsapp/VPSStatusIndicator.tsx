
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity } from "lucide-react";
import { ApiClient } from "@/lib/apiClient";

interface VPSStatus {
  online: boolean;
  responseTime?: number;
  lastCheck?: Date;
  source?: string;
}

export const VPSStatusIndicator = () => {
  const [vpsStatus, setVpsStatus] = useState<VPSStatus>({ online: false });
  const [isChecking, setIsChecking] = useState(false);

  const checkVPSStatus = async () => {
    setIsChecking(true);
    try {
      console.log('[VPS Status] 🔍 Verificando status via API oficial Supabase...');
      
      // CORREÇÃO: Usar ApiClient que usa APIs oficiais Supabase
      const result = await ApiClient.checkVPSHealth();
      
      setVpsStatus({
        online: result.success,
        responseTime: result.responseTime,
        lastCheck: new Date(),
        source: 'api_oficial_supabase'
      });
      
      console.log('[VPS Status] 📊 Status obtido via API oficial:', {
        online: result.success,
        responseTime: result.responseTime ? `${result.responseTime}ms` : 'N/A',
        source: 'api_oficial_supabase'
      });
      
    } catch (error: any) {
      console.error('[VPS Status] ❌ Erro ao verificar status via API oficial:', error);
      setVpsStatus({
        online: false,
        lastCheck: new Date(),
        source: 'api_oficial_supabase'
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
          Verificando via API...
        </Badge>
      );
    }

    if (vpsStatus.online) {
      const isSlowVps = vpsStatus.responseTime && vpsStatus.responseTime > 2000;
      return (
        <Badge variant="default" className={isSlowVps ? "bg-yellow-600 text-white" : "bg-green-600 text-white"}>
          <CheckCircle className="h-3 w-3 mr-1" />
          VPS {isSlowVps ? 'Lenta' : 'Online'} (API)
          {vpsStatus.responseTime && ` (${vpsStatus.responseTime}ms)`}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        VPS Offline (API)
      </Badge>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      {vpsStatus.lastCheck && (
        <span className="text-xs text-gray-500">
          Última verificação via API oficial: {vpsStatus.lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};
