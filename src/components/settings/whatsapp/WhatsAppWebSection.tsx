
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { CleanupOrphanedInstancesButton } from "./CleanupOrphanedInstancesButton";
import { Card, CardContent } from "@/components/ui/card";
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
      {/* Botão de limpeza de instâncias órfãs */}
      <div className="flex justify-end">
        <CleanupOrphanedInstancesButton onCleanupComplete={refetch} />
      </div>

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
