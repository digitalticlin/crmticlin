import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CreateInstanceButton } from "@/modules/whatsapp";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useQRCodeModal } from "@/modules/whatsapp/instanceCreation/hooks/useQRCodeModal";
import { useConnectionStatusSync } from "@/modules/whatsapp/connectionStatusSync";
import { useInstanceCreation } from "@/modules/whatsapp/instanceCreation/hooks/useInstanceCreation";
import { AddNewConnectionCard } from "./connection/AddNewConnectionCard";
import { toast } from "sonner";

export const OptimizedSettingsSection = () => {
  console.log('[Optimized Settings] 🎯 Interface Grid Glassmorphism para WhatsApp Web.js - LAYOUT REORGANIZADO');

  const { instances, isLoading, loadInstances, deleteInstance } = useWhatsAppWebInstances();
  const { openModal } = useQRCodeModal();

  // CORREÇÃO: Usar hook de criação de instância sem callback
  const { createInstance, isCreating } = useInstanceCreation();

  // CORREÇÃO: Connection Status Sync para atualizar lista automaticamente
  useConnectionStatusSync({
    onConnectionDetected: (data) => {
      console.log('[Optimized Settings] 🎉 Nova conexão detectada, atualizando lista:', data);
      
      // Mostrar toast com informações da conexão
      const phoneInfo = data.phone ? ` 📱 ${data.phone}` : '';
      const profileInfo = data.profileName ? ` (${data.profileName})` : '';
      
      toast.success(`${data.instanceName} conectado!${phoneInfo}${profileInfo}`, {
        duration: 6000
      });
      
      // Atualizar lista
      loadInstances();
    },
    onInstanceUpdate: () => {
      console.log('[Optimized Settings] 🔄 Atualizando lista após mudança de instância');
      loadInstances();
    }
  });

  const handleShowQRModal = (instanceId: string, instanceName: string) => {
    console.log('[Optimized Settings] 📱 Abrindo modal unificado para:', instanceName);
    openModal(instanceId, instanceName);
  };

  const handleInstanceCreated = () => {
    console.log('[Optimized Settings] ✅ Nova instância criada, atualizando lista');
    loadInstances();
  };

  const handleInstanceDeleted = async (instanceId: string) => {
    console.log('[Optimized Settings] 🗑️ Instância deletada, removendo da lista automaticamente');
    await deleteInstance(instanceId);
  };

  const handleCreateInstance = async () => {
    console.log('[Optimized Settings] 🚀 Criando nova instância via card "Nova Conexão"');
    const result = await createInstance();
    if (result.success) {
      handleInstanceCreated();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando instâncias...</p>
      </div>
    );
  }

  const hasInstances = instances && instances.length > 0;

  return (
    <div className="space-y-6">
      {/* Caso 1: Nenhuma instância - Mostrar apenas o card de conexão centralizado */}
      {!hasInstances && (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-full max-w-md">
            <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-glass rounded-3xl overflow-hidden">
              <CardContent className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                  bg-green-400/20 backdrop-blur-sm mb-6 border border-green-300/30
                  ring-4 ring-green-200/30">
                  <MessageSquare className="h-10 w-10 text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Conectar WhatsApp</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Conecte sua primeira conta WhatsApp para começar a usar a automação. 
                  O QR Code será gerado automaticamente!
                </p>
                
                <CreateInstanceButton 
                  onSuccess={handleInstanceCreated}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                    text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl 
                    transition-all duration-200"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Caso 2: Há instâncias - Mostrar grid com card "Nova Conexão" como primeiro item */}
      {hasInstances && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Suas Conexões WhatsApp ({instances.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card "Nova Conexão" como primeiro item do grid */}
            <div className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-glass-lg">
              <AddNewConnectionCard
                onConnect={handleCreateInstance}
                isConnecting={isCreating}
              />
            </div>

            {/* Cards das instâncias existentes */}
            {instances.map((instance) => (
              <div 
                key={instance.id}
                className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-glass-lg"
              >
                <SimpleInstanceCard
                  instance={instance}
                  onGenerateQR={handleShowQRModal}
                  onDelete={handleInstanceDeleted}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal QR Code Unificado */}
      <QRCodeModal />
    </div>
  );
};
