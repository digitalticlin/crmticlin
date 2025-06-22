
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CreateInstanceButton } from "@/modules/whatsapp";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useQRCodeModal } from "@/modules/whatsapp/instanceCreation/hooks/useQRCodeModal";

export const OptimizedSettingsSection = () => {
  console.log('[Optimized Settings] 🎯 Interface Grid Glassmorphism para WhatsApp Web.js - SISTEMA UNIFICADO');

  const { instances, isLoading, loadInstances } = useWhatsAppWebInstances();
  const { openModal } = useQRCodeModal();

  const handleShowQRModal = (instanceId: string, instanceName: string) => {
    console.log('[Optimized Settings] 📱 Abrindo modal unificado para:', instanceName);
    openModal(instanceId);
  };

  const handleInstanceCreated = () => {
    console.log('[Optimized Settings] ✅ Nova instância criada, atualizando lista');
    loadInstances();
  };

  const handleInstanceDeleted = () => {
    console.log('[Optimized Settings] 🗑️ Instância deletada, atualizando lista');
    loadInstances();
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
      <Card className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/50 shadow-lg">
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

      {/* Grid de Instâncias com Glassmorphism */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Suas Conexões WhatsApp ({instances?.length || 0})
        </h2>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando instâncias...</p>
          </div>
        ) : instances && instances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance) => (
              <div 
                key={instance.id}
                className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                <SimpleInstanceCard
                  instance={instance}
                  onGenerateQR={handleShowQRModal}
                  onDelete={handleInstanceDeleted}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            <CardContent>
              <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-medium text-gray-700 mb-3">
                Nenhuma conexão WhatsApp
              </h3>
              <p className="text-gray-600 mb-6">
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

      {/* Modal QR Code Unificado */}
      <QRCodeModal />
    </div>
  );
};
