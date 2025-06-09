
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimplifiedConnectButton } from "./SimplifiedConnectButton";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";
import { VPSDiagnosticButton } from "./VPSDiagnosticButton";

export const SimplifiedWhatsAppSection = () => {
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
    retryQRCode
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    if (!user?.email) {
      console.error('Email do usuário não disponível');
      return;
    }

    console.log('[Simplified Section] 🚀 Iniciando conexão para:', user.email);
    await createInstance(user.email);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    await refreshQRCode(instanceId);
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando configurações WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasInstances = instances.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800">WhatsApp Web</CardTitle>
          </div>
          <p className="text-sm text-green-700">
            Gerencie suas conexões WhatsApp para automação de mensagens
          </p>
        </CardHeader>
      </Card>

      {/* Diagnóstico VPS */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Diagnóstico de Infraestrutura</CardTitle>
          <p className="text-sm text-blue-700">
            Verifique se a VPS e o servidor WhatsApp estão funcionando corretamente
          </p>
        </CardHeader>
        <CardContent>
          <VPSDiagnosticButton />
        </CardContent>
      </Card>

      {/* Content */}
      {!hasInstances ? (
        // Card de Conectar quando não há instâncias
        <SimplifiedConnectButton 
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      ) : (
        // Grid de instâncias quando há instâncias
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Suas Instâncias WhatsApp ({instances.length})
            </h3>
            <SimplifiedConnectButton 
              onConnect={handleConnect}
              isConnecting={isConnecting}
              variant="outline"
              size="sm"
              text="Adicionar Nova"
            />
          </div>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleRefreshQR}
          />
        </div>
      )}

      {/* Modal QR Automático */}
      <AutoQRModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        isWaiting={!selectedQRCode}
        currentAttempt={0}
        maxAttempts={15}
        error={null}
        onRetry={retryQRCode}
      />
    </div>
  );
};
