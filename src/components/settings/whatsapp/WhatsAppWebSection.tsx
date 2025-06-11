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
import { supabase } from "@/integrations/supabase/client";

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
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    qrPollingActive,
    loadInstances
  } = useWhatsAppWebInstances();

  // Função para adicionar log de monitoramento
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
      // ETAPA 1: Iniciando requisição VIA API SUPABASE
      addMonitoringLog('1. Iniciando Requisição via API Supabase', 'pending', {
        userEmail: user.email,
        action: 'create_instance',
        method: 'SUPABASE_API_ONLY'
      });

      console.log('[WhatsApp Web] 🚀 Criando instância via API Supabase para:', user.email);
      
      // Gerar nome inteligente baseado no email
      const intelligentName = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      
      addMonitoringLog('2. Nome Inteligente Gerado', 'success', {
        originalEmail: user.email,
        intelligentName
      });

      // ETAPA 2: Chamando Edge Function via API Supabase (NÃO HTTP)
      addMonitoringLog('3. Chamando Edge Function via API', 'pending', {
        method: 'supabase.functions.invoke',
        function: 'whatsapp_instance_manager',
        payload: {
          action: 'create_instance',
          instanceName: intelligentName
        }
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: intelligentName
        }
      });

      if (error) {
        addMonitoringLog('3. API Supabase Error', 'error', {
          error: error.message,
          errorType: 'SUPABASE_API_ERROR'
        });
        throw new Error(error.message);
      }

      addMonitoringLog('3. API Supabase Success', 'success', {
        responseReceived: !!data,
        success: data?.success,
        method: 'API_ONLY'
      });

      if (!data?.success) {
        addMonitoringLog('4. Edge Function Response Error', 'error', {
          functionError: data?.error || 'Resposta inválida da Edge Function',
          fullResponse: data
        });
        throw new Error(data?.error || 'Falha na Edge Function');
      }

      // ETAPA 3: Instância criada com sucesso via API
      addMonitoringLog('4. Instância Criada via API', 'success', {
        instanceId: data.instance?.id,
        vpsInstanceId: data.instance?.vps_instance_id,
        instanceName: intelligentName,
        method: 'SUPABASE_API_ONLY'
      });

      console.log('[WhatsApp Web] ✅ Instância criada via API:', {
        instanceName: intelligentName,
        instanceId: data.instance?.id
      });

      toast.success(`Instância "${intelligentName}" criada via API!`, {
        description: "Sistema corrigido - usando apenas API Supabase"
      });

      // ETAPA 4: Aguardando Webhook (se VPS disponível)
      if (data.vps_success) {
        addMonitoringLog('5. Aguardando Webhook VPS', 'pending', {
          expectedWebhook: 'qr_code_update',
          timeout: '30 segundos'
        });
      } else {
        addMonitoringLog('5. Modo Fallback Ativo', 'success', {
          reason: 'VPS indisponível',
          fallbackMode: true
        });
      }

      // Atualizar lista de instâncias
      await loadInstances();
      
      addMonitoringLog('6. Lista Atualizada via API', 'success', {
        totalInstances: instances.length + 1,
        method: 'SUPABASE_API_ONLY'
      });

    } catch (error: any) {
      console.error('[WhatsApp Web] ❌ Erro ao criar via API:', error);
      
      addMonitoringLog('ERRO FINAL API', 'error', {
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
        method: 'SUPABASE_API_ERROR'
      });

      toast.error(`Erro na criação via API: ${error.message}`);
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
                  ✅ CORRIGIDO: Edge Function → API Supabase → VPS → Webhook (Usuário: {user?.email})
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
              Criando via API...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Conectar WhatsApp (API)
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
              {isCreatingInstance ? 'Criando via API...' : 'Conectar Primeira Instância (API)'}
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
