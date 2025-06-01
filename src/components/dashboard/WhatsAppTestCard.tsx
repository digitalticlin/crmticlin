
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { toast } from "sonner";
import { WhatsAppConnectionStatus } from "./whatsapp/WhatsAppConnectionStatus";
import { WhatsAppActionButtons } from "./whatsapp/WhatsAppActionButtons";
import { WhatsAppCreateInstanceModal } from "./whatsapp/WhatsAppCreateInstanceModal";
import { WhatsAppQRCodeModal } from "./whatsapp/WhatsAppQRCodeModal";

export function WhatsAppTestCard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    createInstance,
    refreshQRCode
  } = useWhatsAppWebInstances();

  const connectedInstances = instances.filter(i => i.web_status === 'ready' || i.web_status === 'open');
  const disconnectedInstances = instances.filter(i => i.web_status !== 'ready' && i.web_status !== 'open');

  const handleCreateInstance = async () => {
    setIsCreating(true);
    try {
      await createInstance();
      toast.success("Instância criada! Agora você pode gerar o QR Code para conectar.");
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleShowQR = async (instanceId: string) => {
    try {
      const qrCode = await refreshQRCode(instanceId);
      setCurrentQRCode(qrCode);
      setShowQRModal(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    }
  };

  const isLoading = companyLoading || instancesLoading;

  // Se não tem companyId, mostrar mensagem de configuração
  if (!companyLoading && !companyId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <CardTitle>Teste WhatsApp</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure sua empresa primeiro
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Configure os dados da sua empresa no perfil para usar o WhatsApp
            </p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/settings">Ir para Configurações</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <CardTitle>Teste WhatsApp</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Conecte e teste sua instância WhatsApp rapidamente
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <WhatsAppConnectionStatus
            isLoading={isLoading}
            connectedCount={connectedInstances.length}
            disconnectedCount={disconnectedInstances.length}
          />

          <WhatsAppActionButtons
            isLoading={isLoading}
            isCreating={isCreating}
            instances={instances}
            connectedInstances={connectedInstances}
            disconnectedInstances={disconnectedInstances}
            onCreateInstance={() => setShowCreateForm(true)}
            onShowQR={handleShowQR}
          />
        </CardContent>
      </Card>

      <WhatsAppCreateInstanceModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onCreateInstance={handleCreateInstance}
        isCreating={isCreating}
      />

      <WhatsAppQRCodeModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        qrCode={currentQRCode}
      />
    </>
  );
}
