
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "@/modules/whatsapp/qrCode/components/QRCodeModal";
import { ConnectionCard } from "./connection/ConnectionCard";
import { AddNewConnectionCard } from "./connection/AddNewConnectionCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useInstanceCreation } from "@/modules/whatsapp/instanceCreation/hooks/useInstanceCreation";
import { useQRCodeModal } from "@/modules/whatsapp/qrCode/hooks/useQRCodeModal";

export const SimpleWhatsAppConnection = () => {
  const { user } = useAuth();
  
  const {
    instances,
    isLoading,
    deleteInstance,
    loadInstances
  } = useWhatsAppWebInstances();

  const { createInstance, isCreating } = useInstanceCreation(loadInstances);
  const { 
    isOpen: showQRModal,
    qrCode: selectedQRCode,
    instanceName: selectedInstanceName,
    instanceId: selectedInstanceId,
    isLoading: isWaitingForQR,
    error: qrError,
    openModal,
    closeModal,
    fetchQRCode,
    refreshQRCode
  } = useQRCodeModal();

  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    console.log('[Simple Connection] 🎯 Criando instância via módulo modular para:', user.email);
    await createInstance();
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 Modal QR Code via módulo modular:', { instanceId, instanceName });
    openModal(instanceId, instanceName);
    toast.info(`Modal aberto para ${instanceName}. Clique em "Gerar QR Code" para iniciar.`);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[Simple Connection] 🗑️ Deletando via hook existente:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Simple Connection] 🔄 Refresh QR Code via módulo modular:', instanceId);
      
      const result = await fetchQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Simple Connection] ✅ QR Code obtido via módulo modular!');
        return { success: true, qrCode: result.qrCode };
      }
      
      if (result.waiting) {
        console.log('[Simple Connection] ⏳ QR Code ainda não disponível');
        return { success: false, waiting: true };
      }
      
      console.log('[Simple Connection] ❌ Falha na busca:', result.error);
      return { success: false, error: result.error };
      
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro ao buscar QR Code:', error);
      return { success: false, error: error.message };
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-700 font-medium">Carregando suas conexões WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <ConnectionCard onConnect={handleConnect} isConnecting={isCreating} />

        <QRCodeModal
          isOpen={showQRModal}
          onClose={closeModal}
          qrCode={selectedQRCode}
          instanceName={selectedInstanceName}
          isLoading={isWaitingForQR}
          error={qrError}
          onRefresh={refreshQRCode}
          onGenerate={() => fetchQRCode()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <SimpleInstanceCard
            key={instance.id}
            instance={instance}
            onGenerateQR={handleGenerateQR}
            onDelete={handleDeleteInstance}
            onRefreshQRCode={handleRefreshQRCode}
          />
        ))}
        
        <AddNewConnectionCard onConnect={handleConnect} isConnecting={isCreating} />
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={closeModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        isLoading={isWaitingForQR}
        error={qrError}
        onRefresh={refreshQRCode}
        onGenerate={() => fetchQRCode()}
      />

      {/* Card informativo sobre modularização */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>✅ FASE 1 MODULARIZAÇÃO IMPLEMENTADA:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Estrutura Modular:</strong> ✅ src/modules/whatsapp/</li>
              <li><strong>Criação de Instância:</strong> ✅ instanceCreation module</li>
              <li><strong>QR Code:</strong> ✅ qrCode module</li>
              <li><strong>Deleção:</strong> ✅ instanceDeletion module</li>
              <li><strong>Mensagens:</strong> ✅ messaging module</li>
              <li><strong>Componentes Atualizados:</strong> ✅ Usando novos hooks modulares</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">🎯 Próxima Fase:</p>
              <p>Modularização das Edge Functions (whatsapp_instance_manager, whatsapp_qr_service, etc.)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
