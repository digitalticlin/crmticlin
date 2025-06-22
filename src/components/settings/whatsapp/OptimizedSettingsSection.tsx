
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { CreateInstanceButton } from "@/modules/whatsapp";
import { QRCodeModal } from "@/modules/whatsapp/qrCodeManagement";
import { useSupabaseQRCode } from "@/hooks/whatsapp/useSupabaseQRCode";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

export const OptimizedSettingsSection = () => {
  console.log('[Optimized Settings] 🎯 Interface Simplificada para WhatsApp Web.js');

  const { instances, isLoading, refetch } = useWhatsAppWebInstances();
  const [qrModalState, setQrModalState] = useState({
    isOpen: false,
    instanceId: null as string | null,
    instanceName: ""
  });

  const { qrCode } = useSupabaseQRCode(qrModalState.instanceId);

  const handleShowQRModal = (instanceId: string, instanceName: string) => {
    console.log('[Optimized Settings] 📱 Abrindo modal QR para:', instanceName);
    setQrModalState({
      isOpen: true,
      instanceId,
      instanceName
    });
  };

  const handleCloseQRModal = () => {
    setQrModalState({
      isOpen: false,
      instanceId: null,
      instanceName: ""
    });
  };

  const handleInstanceCreated = () => {
    console.log('[Optimized Settings] ✅ Nova instância criada, atualizando lista');
    refetch();
  };

  const handleInstanceDeleted = () => {
    console.log('[Optimized Settings] 🗑️ Instância deletada, atualizando lista');
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do WhatsApp</h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas conexões WhatsApp para automação de mensagens
        </p>
      </div>

      {/* Botão Criar Nova Instância */}
      <Card className="bg-green-50/30 backdrop-blur-sm border border-green-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Nova Conexão WhatsApp
          </CardTitle>
          <p className="text-sm text-gray-600">
            Conecte uma nova conta WhatsApp para automação
          </p>
        </CardHeader>
        <CardContent>
          <CreateInstanceButton 
            onSuccess={handleInstanceCreated}
            className="w-full"
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Suas Conexões WhatsApp ({instances?.length || 0})
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando instâncias...</p>
          </div>
        ) : instances && instances.length > 0 ? (
          <div className="grid gap-4">
            {instances.map((instance) => (
              <SimpleInstanceCard
                key={instance.id}
                instance={instance}
                onGenerateQR={handleShowQRModal}
                onDelete={handleInstanceDeleted}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhuma conexão WhatsApp
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira conexão WhatsApp para começar a usar a automação
              </p>
              <CreateInstanceButton 
                onSuccess={handleInstanceCreated}
                size="lg"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal QR Code */}
      <QRCodeModal
        isOpen={qrModalState.isOpen}
        onClose={handleCloseQRModal}
        qrCode={qrCode}
        instanceName={qrModalState.instanceName}
        instanceId={qrModalState.instanceId || ""}
      />
    </div>
  );
};
