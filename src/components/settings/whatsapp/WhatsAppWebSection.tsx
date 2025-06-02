
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { CleanupOrphanedInstancesButton } from "./CleanupOrphanedInstancesButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

export function WhatsAppWebSection() {
  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    autoConnectState,
    deleteInstance,
    refreshQRCode,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    refetch
  } = useWhatsAppWebInstances(companyId, companyLoading);

  const isLoading = companyLoading || instancesLoading;

  if (isLoading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Se não tem companyId depois de carregar, mostrar mensagem
  if (!companyLoading && !companyId) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="text-center py-8">
          <div className="p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/30 inline-block mb-4">
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">Empresa não encontrada</h3>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa primeiro na aba Perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  // Encontrar a instância ativa do QR modal
  const activeInstance = autoConnectState.activeInstanceId 
    ? instances.find(i => i.id === autoConnectState.activeInstanceId)
    : null;

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100/50 dark:bg-green-800/30">
                <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  WhatsApp Web.js
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte sua conta WhatsApp de forma rápida e automática
                </p>
              </div>
            </div>
            
            {/* Botão de limpeza de instâncias órfãs */}
            <CleanupOrphanedInstancesButton onCleanupComplete={refetch} />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Botão de conexão */}
        <ConnectWhatsAppButton
          onConnect={startAutoConnection}
          isConnecting={autoConnectState.isConnecting}
        />

        {/* Instâncias existentes */}
        {instances.map((instance) => (
          <WhatsAppWebInstanceCard
            key={instance.id}
            instance={instance}
            onDelete={deleteInstance}
            onRefreshQR={refreshQRCode}
            onShowQR={() => openQRModal(instance.id)}
            isNewInstance={instance.id === autoConnectState.activeInstanceId}
          />
        ))}
      </div>

      {/* Estado vazio apenas se não há instâncias */}
      {instances.length === 0 && !instancesLoading && (
        <Card className="glass-card border-0">
          <CardContent className="text-center py-8">
            <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-800/30 inline-block mb-4">
              <Wifi className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma conexão WhatsApp</h3>
            <p className="text-muted-foreground">
              Clique em "Conectar WhatsApp" para começar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do QR Code */}
      <AutoQRCodeModal
        isOpen={autoConnectState.showQRModal}
        onOpenChange={closeQRModal}
        qrCode={activeInstance?.qr_code || null}
        isLoading={autoConnectState.isConnecting && !activeInstance?.qr_code}
        onRefresh={() => {
          if (activeInstance) {
            refreshQRCode(activeInstance.id);
          }
        }}
      />
    </div>
  );
}
