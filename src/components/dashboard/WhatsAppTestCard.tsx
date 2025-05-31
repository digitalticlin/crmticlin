
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, QrCode, CheckCircle, Loader2 } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { toast } from "sonner";

export function WhatsAppTestCard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { companyId } = useCompanyData();
  const {
    instances,
    createInstance,
    refreshQRCode
  } = useWhatsAppWebInstances(companyId);

  const connectedInstances = instances.filter(i => i.web_status === 'ready' || i.web_status === 'open');
  const disconnectedInstances = instances.filter(i => i.web_status !== 'ready' && i.web_status !== 'open');

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast.error("Digite um nome para a instância");
      return;
    }

    setIsCreating(true);
    try {
      await createInstance(instanceName.trim());
      setInstanceName("");
      setShowCreateForm(false);
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
          {/* Status atual */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Status da Conexão</p>
              <p className="text-xs text-muted-foreground">
                {connectedInstances.length} conectada(s), {disconnectedInstances.length} desconectada(s)
              </p>
            </div>
            {connectedInstances.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-2 w-2 bg-gray-400 rounded-full" />
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2">
            {disconnectedInstances.length === 0 ? (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isCreating}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isCreating ? 'Criando...' : 'Criar Nova Instância WhatsApp'}
              </Button>
            ) : (
              <Button 
                onClick={() => handleShowQR(disconnectedInstances[0].id)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Conectar WhatsApp ({disconnectedInstances[0].instance_name})
              </Button>
            )}

            {instances.length > 0 && (
              <Button variant="outline" className="w-full" asChild>
                <a href="/settings">Ver Todas as Instâncias</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: atendimento, vendas, suporte..."
                disabled={isCreating}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateInstance}
                disabled={isCreating || !instanceName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Instância'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {currentQRCode ? (
              <>
                <div className="bg-white p-4 rounded-lg mb-4 border">
                  <img 
                    src={currentQRCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Como conectar:</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Vá em Menu → Aparelhos conectados</p>
                    <p>3. Toque em "Conectar um aparelho"</p>
                    <p>4. Escaneie este QR code</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Gerando QR Code...</p>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowQRModal(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
