import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Activity, CheckCircle, AlertTriangle, Plus, Loader2, Monitor, Settings } from "lucide-react";
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
    createInstance, // CORREÇÃO: Usar o hook
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    qrPollingActive,
    loadInstances
  } = useWhatsAppWebInstances();

  // CORREÇÃO: Função para adicionar log de monitoramento
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
    console.log(`[Monitoring] ${step} - ${status}:`, details);
  };

  // CORREÇÃO: Usar hook em vez de chamada direta
  const handleCreateInstance = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsCreatingInstance(true);
    setShowMonitoring(true);
    
    // Limpar logs anteriores
    setMonitoringData([]);
    
    try {
      // ETAPA 1: Iniciando via hook
      addMonitoringLog('1. Iniciando Criação via Hook', 'pending', {
        userEmail: user.email,
        method: 'HOOK_TO_EDGE_FUNCTION'
      });

      console.log('[WhatsApp Web] 🚀 Criando instância via hook para:', user.email);
      
      // CORREÇÃO: Usar hook em vez de supabase.functions.invoke direto
      const result = await createInstance();
      
      if (!result || !result.success) {
        addMonitoringLog('ERRO: Hook falhou', 'error', {
          result,
          method: 'HOOK_FAILURE'
        });
        throw new Error(result?.error || 'Hook de criação falhou');
      }

      addMonitoringLog('2. Hook Executado com Sucesso', 'success', {
        instanceId: result.instance?.id,
        method: 'HOOK_SUCCESS'
      });

      console.log('[WhatsApp Web] ✅ Instância criada via hook:', result);

      toast.success(`Instância criada via hook!`, {
        description: "Sistema corrigido - usando hook → ApiClient → Edge Function"
      });

      // Atualizar lista de instâncias
      await loadInstances();
      
      addMonitoringLog('3. Lista Atualizada', 'success', {
        totalInstances: instances.length + 1,
        method: 'HOOK_COMPLETE'
      });

    } catch (error: any) {
      console.error('[WhatsApp Web] ❌ Erro no hook:', error);
      
      addMonitoringLog('ERRO FINAL HOOK', 'error', {
        errorMessage: error.message,
        method: 'HOOK_ERROR'
      });

      toast.error(`Erro no hook: ${error.message}`);
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
  const errorInstances = instances.filter(i => 
    i.connection_status === 'error' || i.connection_status === 'vps_error'
  ).length;

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando WhatsApp Settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com status CORRIGIDO */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp Web Settings</h2>
                <p className="text-sm text-green-600">
                  ✅ CORRIGIDO: Frontend → Hook → ApiClient → Edge Function → VPS (Usuário: {user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                API Corrigida
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

      {/* Botões principais CORRIGIDOS */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleCreateInstance}
          disabled={isCreatingInstance}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-3 text-lg"
          size="lg"
        >
          {isCreatingInstance ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Criando via Hook...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Conectar WhatsApp (Hook)
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
            Suas Instâncias WhatsApp ({instances.length})
          </h3>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleRefreshQR}
          />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-green-300 bg-green-50/30">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhuma instância WhatsApp
            </h3>
            <p className="text-gray-600 mb-6">
              Conecte sua primeira instância via API corrigida
            </p>
            <Button 
              onClick={handleCreateInstance}
              disabled={isCreatingInstance}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCreatingInstance ? 'Criando via Hook...' : 'Conectar Primeira Instância (Hook)'}
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
    </div>
  );
};
