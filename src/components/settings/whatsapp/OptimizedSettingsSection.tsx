
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Activity, CheckCircle, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";
import { useState } from "react";
import { toast } from "sonner";

export const OptimizedSettingsSection = () => {
  const { user } = useAuth();

  const {
    instances,
    isLoading,
    isConnecting,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    qrPollingActive
  } = useWhatsAppWebInstances();

  // JORNADA UX: Click → Modal → QR automático
  const handleOptimizedConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    console.log('[Optimized Settings] 🚀 UX FLUIDA: Iniciando criação para:', user.email);
    
    try {
      // Chamada principal - modal abre automaticamente dentro do hook
      const result = await createInstance();
      
      if (result && result.success) {
        console.log('[Optimized Settings] ✅ UX FLUIDA: Instância criada!', {
          intelligentName: result.intelligent_name,
          instanceId: result.instance?.id
        });
      }
    } catch (error: any) {
      console.error('[Optimized Settings] ❌ UX FLUIDA: Erro:', error);
      // Toast já é mostrado no hook
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[Optimized Settings] 🗑️ Deletando via ApiClient:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[Optimized Settings] 🔄 Refresh QR via ApiClient:', instanceId);
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
      {/* Header com status da jornada UX */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp Settings - UX Fluida</h2>
                <p className="text-sm text-green-600">
                  Jornada: Click → Modal → Nome Inteligente → QR Automático (Usuário: {user?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sistema Ativo
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

      {/* Botão principal da jornada UX */}
      <div className="flex justify-center">
        <Button 
          onClick={handleOptimizedConnect}
          disabled={isConnecting}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-3 text-lg"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Criando Instância...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Conectar WhatsApp
            </>
          )}
        </Button>
      </div>

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
              Conecte sua primeira instância para começar a usar o sistema
            </p>
            <Button 
              onClick={handleOptimizedConnect}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConnecting ? 'Conectando...' : 'Conectar Primeira Instância'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal QR com UX fluida */}
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
      
      {/* Card informativo sobre UX implementada */}
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-green-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <strong>✅ JORNADA UX FLUIDA IMPLEMENTADA</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Click no Botão:</strong> ✅ Chama createInstance() imediatamente</li>
              <li><strong>Nome Inteligente:</strong> ✅ {user?.email?.split('@')[0] || 'usuario'} → {user?.email?.split('@')[0] || 'usuario'}1, {user?.email?.split('@')[0] || 'usuario'}2...</li>
              <li><strong>Modal Imediato:</strong> ✅ Abre antes mesmo da Edge Function responder</li>
              <li><strong>Edge Function:</strong> ✅ whatsapp_instance_manager com instanceName</li>
              <li><strong>Polling Automático:</strong> ✅ Busca QR Code a cada 3s por 45s</li>
              <li><strong>QR Automático:</strong> ✅ Aparece assim que VPS gerar (base64)</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-green-200">
              <p className="font-medium">🎯 Fluxo Implementado:</p>
              <p>1. Click → 2. Modal "Gerando QR Code..." → 3. Edge Function → 4. VPS → 5. QR aparece automaticamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
