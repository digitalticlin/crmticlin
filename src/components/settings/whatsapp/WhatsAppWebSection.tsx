import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Activity, CheckCircle, AlertTriangle, Plus, Loader2, Monitor, Settings, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";
import { MonitoringPanel } from "./MonitoringPanel";
import { VPSDiagnosticPanel } from "./VPSDiagnosticPanel";
import { toast } from "sonner";

export const WhatsAppWebSection = () => {
  const { user } = useAuth();
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);

  const {
    instances,
    isLoading,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    qrPollingActive,
    loadInstances
  } = useWhatsAppWebInstances();

  const addMonitoringLog = (step: string, status: 'pending' | 'success' | 'error', details: any = {}) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      step,
      status,
      details,
      user: user?.email || 'unknown'
    };
    
    setMonitoringData(prev => [logEntry, ...prev.slice(0, 19)]);
    console.log(`[Monitoring BAILEYS] ${step} - ${status}:`, details);
  };

  const handleCreateInstance = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsCreatingInstance(true);
    setShowMonitoring(true);
    
    setMonitoringData([]);
    
    try {
      addMonitoringLog('1. Iniciando Criação via BAILEYS (SEM PUPPETEER)', 'pending', {
        userEmail: user.email,
        method: 'BAILEYS_NO_PUPPETEER'
      });

      console.log('[WhatsApp Web] 🚀 Criando instância via BAILEYS para:', user.email);
      
      const result = await createInstance();
      
      if (!result || !result.success) {
        addMonitoringLog('ERRO: BAILEYS falhou', 'error', {
          result,
          method: 'BAILEYS_ERROR'
        });
        throw new Error(result?.error || 'BAILEYS falhou');
      }

      addMonitoringLog('2. BAILEYS Executado com Sucesso (SEM PUPPETEER)', 'success', {
        instanceId: result.instance?.id,
        method: 'BAILEYS_SUCCESS',
        mode: result.mode || 'baileys_connected_direct'
      });

      console.log('[WhatsApp Web] ✅ Instância criada via BAILEYS:', result);

      if (result.mode === 'database_only') {
        toast.success(`Instância criada em modo fallback!`, {
          description: "BAILEYS funcionando - VPS será sincronizada quando disponível"
        });
      } else {
        toast.success(`Instância criada via BAILEYS (sem Puppeteer)!`, {
          description: "Sistema com conectividade direta usando Baileys"
        });
      }

      await loadInstances();
      
      addMonitoringLog('3. Lista Atualizada (BAILEYS)', 'success', {
        totalInstances: instances.length + 1,
        method: 'BAILEYS_COMPLETE'
      });

    } catch (error: any) {
      console.error('[WhatsApp Web] ❌ Erro no BAILEYS:', error);
      
      addMonitoringLog('ERRO FINAL BAILEYS', 'error', {
        errorMessage: error.message,
        method: 'BAILEYS_ERROR'
      });

      toast.error(`Erro no BAILEYS: ${error.message}`);
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsApp Web] 🗑️ Deletando instância:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsApp Web] 🔄 Refresh QR:', instanceId);
    await refreshQRCode(instanceId);
  };

  // Estatísticas das instâncias
  const connectedInstances = instances.filter(i => 
    i.connection_status === 'connected' || i.connection_status === 'ready'
  ).length;
  const waitingInstances = instances.filter(i => i.connection_status === 'waiting_qr').length;
  const fallbackInstances = instances.filter(i => i.connection_status === 'database_only').length;
  const errorInstances = instances.filter(i => 
    i.connection_status === 'error' || i.connection_status === 'vps_error'
  ).length;

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando WhatsApp BAILEYS (sem Puppeteer)...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com status BAILEYS */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp BAILEYS - NÍVEL 8 (SEM PUPPETEER)</h2>
                <p className="text-sm text-green-600">
                  ⚡ BAILEYS: Frontend → Hook → ApiClient → whatsapp_instance_manager (Usuário: {user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-600 text-white">
                <Zap className="h-3 w-3 mr-1" />
                BAILEYS
              </Badge>
              
              <Badge variant="destructive" className="bg-red-600 text-white">
                <AlertTriangle className="h-3 w-3 mr-1" />
                NO PUPPETEER
              </Badge>
              
              {connectedInstances > 0 && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {connectedInstances} Conectada(s)
                </Badge>
              )}
              
              {waitingInstances > 0 && (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Activity className="h-3 w-3 mr-1" />
                  {waitingInstances} Aguardando QR
                </Badge>
              )}

              {fallbackInstances > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  <Activity className="h-3 w-3 mr-1" />
                  {fallbackInstances} Fallback
                </Badge>
              )}
              
              {errorInstances > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {errorInstances} Erro(s)
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Botões principais BAILEYS */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleCreateInstance}
          disabled={isCreatingInstance}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 px-8 py-3 text-lg"
          size="lg"
        >
          {isCreatingInstance ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Criando via BAILEYS...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Conectar WhatsApp (BAILEYS - SEM PUPPETEER)
            </>
          )}
        </Button>

        <Button 
          onClick={() => setShowMonitoring(!showMonitoring)}
          variant="outline"
          className="gap-2"
        >
          <Monitor className="h-4 w-4" />
          {showMonitoring ? 'Ocultar' : 'Mostrar'} Monitoramento
        </Button>

        <Button 
          onClick={() => setShowDiagnostic(!showDiagnostic)}
          variant="outline"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          {showDiagnostic ? 'Ocultar' : 'Mostrar'} Diagnóstico
        </Button>
      </div>

      {/* Painel de Diagnóstico VPS */}
      {showDiagnostic && (
        <VPSDiagnosticPanel />
      )}

      {/* Painel de Monitoramento */}
      {showMonitoring && (
        <MonitoringPanel 
          logs={monitoringData}
          onClear={() => setMonitoringData([])}
        />
      )}

      {/* Grid de instâncias ou estado vazio */}
      {instances.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Suas Instâncias WhatsApp BAILEYS ({instances.length})
          </h3>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleRefreshQR}
          />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-purple-300 bg-purple-50/30">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-purple-600 opacity-50" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhuma instância WhatsApp BAILEYS
            </h3>
            <p className="text-gray-600 mb-6">
              Conecte sua primeira instância via BAILEYS (sem Puppeteer)
            </p>
            <Button 
              onClick={handleCreateInstance}
              disabled={isCreatingInstance}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreatingInstance ? 'Criando via BAILEYS...' : 'Conectar Primeira Instância (BAILEYS)'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal QR */}
      <AutoQRModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        isWaiting={qrPollingActive || (!selectedQRCode && showQRModal)}
        currentAttempt={0}
        maxAttempts={15}
        error={null}
        onRetry={retryQRCode}
      />

      {/* Card informativo sobre BAILEYS */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-purple-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <strong>⚡ SISTEMA VIA BAILEYS - NÍVEL 8 (SEM PUPPETEER)</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Baileys Engine:</strong> ✅ Biblioteca nativa WhatsApp (sem browser)</li>
              <li><strong>Puppeteer Eliminado:</strong> ❌ Sem crashes de browser</li>
              <li><strong>QR Code Rápido:</strong> ⚡ Geração em 2-3 segundos</li>
              <li><strong>Conexão Estável:</strong> 🔗 Reconexão automática</li>
              <li><strong>Performance:</strong> 🚀 Uso mínimo de recursos</li>
              <li><strong>Compatibilidade:</strong> ✅ Todos endpoints funcionando</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-purple-200">
              <p className="font-medium">🎯 Fluxo BAILEYS:</p>
              <p>Frontend → Hook → ApiClient → whatsapp_instance_manager → VPS (BAILEYS) → QR Code Instantâneo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
