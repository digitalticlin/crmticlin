
import { useState } from "react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebQRModal } from "./WhatsAppWebQRModal";
import { WhatsAppAdminPanel } from "./WhatsAppAdminPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export const WhatsAppWebSection = () => {
  const { user } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const {
    instances,
    isLoading,
    isConnecting,
    error,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    refetch
  } = useWhatsAppWebInstances();

  console.log('[WhatsApp Web Section] Renderizando com:', {
    instancesCount: instances.length,
    isLoading,
    userEmail: user?.email
  });

  // Verificar se é super admin para mostrar painel de admin
  const isAdmin = user?.email?.includes('digitalticlin') || false;

  // Função para criar instância (corrigindo interface)
  const handleCreateInstance = async () => {
    const instanceName = `WhatsApp_${Date.now()}`;
    await createInstance(instanceName);
  };

  // Função para mostrar QR Code
  const handleShowQR = (instance: any) => {
    // Implementar lógica para mostrar QR Code se necessário
  };

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  return (
    <div className="space-y-6">
      <WhatsAppWebSectionHeader 
        onConnect={handleCreateInstance}
        isConnecting={isConnecting}
        isLoading={isLoading}
        companyLoading={false}
      />

      {/* Admin Tools para super admins - SEM TestSyncButton */}
      {isAdmin && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">
              🔧 Ferramentas de Administração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAdminPanel ? 'Ocultar' : 'Mostrar'} Painel Avançado
              </button>
            </div>
            
            {showAdminPanel && <WhatsAppAdminPanel />}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Erro: {error}</p>
        </div>
      )}

      {instances.length === 0 ? (
        <WhatsAppWebEmptyState 
          onConnect={handleCreateInstance}
          isConnecting={isConnecting}
        />
      ) : (
        <WhatsAppWebInstancesGrid 
          instances={instances}
          onRefreshQR={refreshQRCode}
          onDelete={deleteInstance}
          onShowQR={handleShowQR}
        />
      )}

      <WhatsAppWebQRModal 
        isOpen={showQRModal}
        onOpenChange={closeQRModal}
        qrCodeUrl={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </div>
  );
};
