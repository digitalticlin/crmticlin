
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useAutoConnect } from "@/hooks/whatsapp/useAutoConnect";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { ConnectingInstanceCard } from "./ConnectingInstanceCard";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

export function WhatsAppWebSection() {
  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    deleteInstance,
    refreshQRCode
  } = useWhatsAppWebInstances(companyId, companyLoading);

  const {
    state: autoConnectState,
    startConnection,
    closeQRModal,
    openQRModal,
    refreshQRCode: refreshAutoQR,
    reset
  } = useAutoConnect();

  const isLoading = companyLoading || instancesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Se não tem companyId depois de carregar, mostrar mensagem
  if (!companyLoading && !companyId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Empresa não encontrada</h3>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa primeiro na aba Perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <CardTitle>WhatsApp Web.js</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Conecte sua conta WhatsApp de forma rápida e automática
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Botão de conexão ou card de instância em processo */}
        {!autoConnectState.instanceId ? (
          <ConnectWhatsAppButton
            onConnect={startConnection}
            isConnecting={autoConnectState.isConnecting}
          />
        ) : (
          <ConnectingInstanceCard
            instanceId={autoConnectState.instanceId}
            status={autoConnectState.error ? 'error' : 
                   autoConnectState.qrCode ? 'waiting_scan' : 'connecting'}
            error={autoConnectState.error}
            onShowQR={openQRModal}
            onRefresh={() => {
              reset();
              startConnection();
            }}
          />
        )}

        {/* Instâncias existentes */}
        {instances.map((instance) => (
          <WhatsAppWebInstanceCard
            key={instance.id}
            instance={instance}
            onDelete={deleteInstance}
            onRefreshQR={refreshQRCode}
          />
        ))}
      </div>

      {/* Estado vazio apenas se não há instâncias E não está conectando */}
      {instances.length === 0 && !instancesLoading && !autoConnectState.instanceId && (
        <Card>
          <CardContent className="text-center py-8">
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conexão WhatsApp</h3>
            <p className="text-muted-foreground">
              Clique em "Conectar WhatsApp" para começar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do QR Code automático */}
      <AutoQRCodeModal
        isOpen={autoConnectState.showQRModal}
        onOpenChange={closeQRModal}
        qrCode={autoConnectState.qrCode}
        isLoading={autoConnectState.isConnecting && !autoConnectState.qrCode}
        onRefresh={refreshAutoQR}
      />
    </div>
  );
}
