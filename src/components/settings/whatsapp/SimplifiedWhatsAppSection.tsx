
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

  // FASE 2: Criar instância sem parâmetros
  const handleConnect = async () => {
    if (!user?.email) {
      console.error('[Simplified Section] ❌ Email do usuário não disponível');
      return;
    }

    console.log('[Simplified Section] 🚀 FASE 2: Iniciando criação via edge functions corretas:', user.email);
    await createInstance(); // CORREÇÃO: sem parâmetros
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[Simplified Section] 🗑️ FASE 2: Deletando via edge functions corretas:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[Simplified Section] 🔄 FASE 2: Refresh QR via edge functions corretas:', instanceId);
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
      {/* FASE 2: Interface otimizada para usar edge functions corretas */}
      
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

      {/* FASE 2: Modal QR Automático usando edge functions corretas */}
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
      
      {/* Card informativo sobre correção aplicada */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>✅ FASE 2 APLICADA:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>whatsapp_instance_manager:</strong> Criação e gerenciamento de instâncias</li>
              <li><strong>whatsapp_qr_service:</strong> Geração e recuperação de QR codes</li>
              <li><strong>Comunicação VPS:</strong> Direta via HTTP com edge functions corretas</li>
              <li><strong>Modal QR:</strong> Abre instantaneamente e faz polling inteligente</li>
              <li><strong>Webhook:</strong> Sincronização automática VPS → Supabase</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">🎯 Fluxo FASE 2:</p>
              <p>1. Criar instância → Modal abre automaticamente</p>
              <p>2. Polling via whatsapp_qr_service → QR aparece</p>
              <p>3. Webhook VPS → Status sincronizado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
