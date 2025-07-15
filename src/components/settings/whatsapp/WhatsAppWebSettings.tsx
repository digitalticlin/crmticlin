import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Activity, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppWebInstances } from '@/hooks/whatsapp/useWhatsAppWebInstances';
import { useIntegratedInstanceCreation } from '@/hooks/whatsapp/useIntegratedInstanceCreation';
import { AutoQRModal } from './AutoQRModal';
import { WhatsAppWebInstancesGrid } from './WhatsAppWebInstancesGrid';
import { WhatsAppWebEmptyState } from './WhatsAppWebEmptyState';
import { VPSHealthService } from '@/services/whatsapp/vpsHealthService';
import { WhatsAppCleanupService } from '@/services/whatsapp/cleanupService';

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

  // Usar o novo hook integrado
  const {
    isCreating,
    creationStage,
    showModal,
    instanceId,
    instanceName,
    error: creationError,
    createInstanceWithAutoModal,
    closeModal,
    resetState
  } = useIntegratedInstanceCreation();

  // Monitoramento da VPS
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

  // Handler para conectar WhatsApp com modal automático
  const handleConnectWhatsApp = async () => {
    if (!user?.email) {
      console.error('[WhatsApp Settings] ❌ Email do usuário não disponível');
      return;
    }

    try {
      console.log('[WhatsApp Settings] 🎯 Criando instância integrada para usuário:', user.id);
      
      await createInstanceWithAutoModal({
        onSuccess: (instanceId, instanceName) => {
          console.log('[WhatsApp Settings] ✅ Instância criada com sucesso:', { instanceId, instanceName });
          // Recarregar lista de instâncias
          loadInstances();
        },
        onError: (error) => {
          console.error('[WhatsApp Settings] ❌ Erro na criação:', error);
        }
      });
    } catch (error: any) {
      console.error('[WhatsApp Settings] ❌ Erro ao conectar:', error);
    }
  };

  const handleShowQR = (instance: any) => {
    console.log('[WhatsApp Settings] 📱 Mostrando QR Code para:', instance.id);
    // Implementar lógica para mostrar QR de instância existente
  };

  const connectedInstances = instances.filter(instance => 
    instance.connection_status === 'connected' || 
    instance.connection_status === 'ready'
  ).length;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando instâncias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp Web Integrado</h2>
                <p className="text-sm text-green-600">
                  Sistema com modal automático (Usuário: {user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vpsHealth?.online ? "default" : "destructive"} className="border-green-300">
                <Activity className="h-3 w-3 mr-1" />
                VPS {vpsHealth?.online ? 'Online' : 'Offline'}
              </Badge>
              
              {vpsHealth?.responseTime && (
                <Badge variant="outline" className="border-blue-300">
                  {vpsHealth.responseTime}ms
                </Badge>
              )}
              
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

      {/* Botão de Criar Instância */}
      <div className="flex gap-3">
        <Button 
          onClick={handleConnectWhatsApp}
          disabled={isCreating}
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {creationStage || 'Criando...'}
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Conectar WhatsApp (Automático)
            </>
          )}
        </Button>
        
        {creationError && (
          <div className="flex items-center text-red-600 text-sm">
            <span>Erro: {creationError}</span>
          </div>
        )}
      </div>

      {/* Lista de Instâncias ou Estado Vazio */}
      {instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={refreshQRCode}
          onDelete={deleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnectWhatsApp}
          isConnecting={isCreating}
        />
      )}

      {/* Modal QR Automático */}
      <AutoQRModal
        isOpen={showModal}
        onClose={closeModal}
        instanceId={instanceId}
        instanceName={instanceName}
      />
    </div>
  );
};
