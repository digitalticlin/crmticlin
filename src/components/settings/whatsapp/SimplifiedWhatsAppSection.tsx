
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimplifiedConnectButton } from "./SimplifiedConnectButton";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";

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
      console.error('[Simplified Section] ❌ Email do usuário não disponível');
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
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
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
      {/* Content principal das instâncias */}
      {!hasInstances ? (
        // Card de Conectar modernizado quando não há instâncias
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
