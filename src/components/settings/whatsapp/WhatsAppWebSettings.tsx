import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Shield, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { CreateInstanceButton } from "@/modules/whatsapp/instanceCreation/components/CreateInstanceButton";
import { CleanupOrphanedInstancesButton } from "./CleanupOrphanedInstancesButton";
import { OrphanInstanceManager } from "./OrphanInstanceManager";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";
import { VPSHealthService } from "@/services/whatsapp/vpsHealthService";
import { WhatsAppCleanupService } from "@/services/whatsapp/cleanupService";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstanceCreation } from "@/modules/whatsapp/instanceCreation/hooks/useInstanceCreation";

export const WhatsAppWebSettings = () => {
  const [vpsHealth, setVpsHealth] = useState<{ online: boolean; responseTime?: number } | null>(null);
  const [orphanCount, setOrphanCount] = useState<number>(0);
  const { user } = useAuth();
  
  const {
    instances,
    isLoading,
    deleteInstance,
    refreshQRCode,
    loadInstances
  } = useWhatsAppWebInstances();

  const { createInstance, isCreating } = useInstanceCreation(loadInstances);

  // FASE 2: Monitoramento otimizado da VPS
  useEffect(() => {
    const checkVPSHealth = async () => {
      const health = await VPSHealthService.checkVPSHealth();
      setVpsHealth({
        online: health.online,
        responseTime: health.responseTime
      });
    };

    const checkOrphanCount = async () => {
      const count = await WhatsAppCleanupService.getOrphanInstancesCount();
      setOrphanCount(count);
    };

    checkVPSHealth();
    checkOrphanCount();

    const interval = setInterval(() => {
      checkVPSHealth();
      checkOrphanCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!user?.email) {
      console.error('[WhatsApp Settings] ❌ Email do usuário não disponível');
      return;
    }

    try {
      console.log('[WhatsApp Settings] 🎯 Criando instância para usuário autenticado:', user.id);
      await createInstance();
    } catch (error: any) {
      console.error('[WhatsApp Settings] ❌ Erro ao conectar:', error);
    }
  };

  const handleShowQR = (instance: any) => {
    console.log('[WhatsApp Settings] 📱 Mostrando QR Code para:', instance.id);
  };

  const handleRefreshQRCodeWrapper = async (instanceId: string): Promise<{ qrCode?: string } | null> => {
    try {
      const result = await refreshQRCode(instanceId);
      if (result?.success && result.qrCode) {
        return { qrCode: result.qrCode };
      }
      return null;
    } catch (error: any) {
      console.error('[WhatsApp Settings] ❌ Erro ao atualizar QR Code:', error);
      return null;
    }
  };

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  // Contar instâncias por status
  const connectedInstances = instances.filter(i => 
    i.connection_status === 'connected' || i.connection_status === 'ready'
  ).length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp Modular</h2>
                <p className="text-sm text-green-600">
                  Sistema modular ativo (Usuário: {user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vpsHealth?.online ? "default" : "destructive"} className="border-green-300">
                <Activity className="h-3 w-3 mr-1" />
                VPS {vpsHealth?.online ? 'Online' : 'Offline'}
              </Badge>
              
              {connectedInstances > 0 && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {connectedInstances} Conectada(s)
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <OrphanInstanceManager />

      <div className="flex gap-3">
        <CreateInstanceButton 
          onSuccess={loadInstances}
          variant="whatsapp"
          size="lg"
        />
        <CleanupOrphanedInstancesButton 
          onCleanupComplete={loadInstances}
        />
      </div>

      {instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={refreshQRCode}
          onDelete={deleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnect}
          isConnecting={isCreating}
        />
      )}

      {/* Modal QR unificado */}
      <QRCodeModal />
    </div>
  );
};
