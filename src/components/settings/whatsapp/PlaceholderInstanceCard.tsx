import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createWhatsAppInstance } from "@/services/whatsapp/instanceCreationService";
import { supabase } from "@/integrations/supabase/client";
import QrCodeActionCard from "./QrCodeActionCard";
import { useQrCodeDialogState } from "@/hooks/whatsapp/useQrCodeDialogState";
import { useEvolutionInstanceStatus } from "@/hooks/whatsapp/useEvolutionInstanceStatus";
import { useWhatsAppInstanceActions, useWhatsAppInstanceState } from "@/hooks/whatsapp/whatsappInstanceStore";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean;
  userEmail: string;
}

const PlaceholderInstanceCard = ({
  isSuperAdmin = false,
  userEmail
}: PlaceholderInstanceCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  // Hook para controle do QRCode
  const qrCodeDialog = useQrCodeDialogState();

  // Extrai username do email
  useEffect(() => {
    if (userEmail) {
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, "");
      setUsername(extractedUsername);

      // Verifica se usuário é novo (criou conta em 24h)
      const checkIfNewUser = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data, error } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();
          if (!error && data) {
            const creationDate = new Date(data.created_at);
            setIsNewUser((Date.now() - creationDate.getTime()) / 3600000 < 24);
          }
        } catch { /* Falha silenciosa só pra UX */ }
      };
      checkIfNewUser();
    }
  }, [userEmail]);

  // Ao clicar para criar o WhatsApp
  const handleAddWhatsApp = async () => {
    if (isCreating) return;
    if (!username) {
      toast.error("Não foi possível obter o nome de usuário.");
      return;
    }
    if (!isSuperAdmin && !isNewUser) {
      toast.error("Disponível apenas em planos superiores. Atualize seu plano.");
      return;
    }
    try {
      setIsCreating(true);
      // Chamada à Evolution API via service: cria e grava no banco.
      const result = await createWhatsAppInstance(username);
      if (result.success && result.qrCode) {
        // Mostra card com QR code via hook local de estado
        qrCodeDialog.show(result.qrCode);
        setInstanceName(result.instanceName || null);
        setInstanceId(result.instanceId || null);
        toast.success("Solicitação de conexão enviada!");
      } else {
        toast.error(result.error || "Erro ao criar a instância.");
      }
    } catch (error: any) {
      toast.error("Falha ao criar a instância do WhatsApp");
    } finally {
      setIsCreating(false);
    }
  };

  // Estados para fetch único da atualização Evolution API
  const { fetchStatus } = useEvolutionInstanceStatus();
  const { instances, setInstances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);

  // Função auxiliar para buscar status após QR
  const syncInstanceWithEvolution = async () => {
    if (!instanceName || isSyncingStatus) return;
    setIsSyncingStatus(true);
    try {
      const statusData = await fetchStatus(instanceName);
      // statusData pode ser: { state: "connected" | ... } ou outro JSON
      // Atualiza ou adiciona a instância na lista global
      const idx = instances.findIndex(i => i.instanceName === instanceName);
      if (idx !== -1) {
        // Atualiza status
        const updated = [...instances];
        updated[idx] = {
          ...updated[idx],
          connected: (statusData?.state === "connected")
        };
        setInstances(updated);
      } else {
        // Se não existir, adiciona nova
        setInstances([
          ...instances,
          {
            id: instanceId || "1",
            instanceName: instanceName,
            connected: (statusData?.state === "connected"),
          }
        ]);
      }
    } catch (error) {
      // No-op por enquanto (pode mostrar toast se quiser)
    } finally {
      setIsSyncingStatus(false);
    }
  };

  // Handler botão "Já escaneei"
  const handleScanned = async () => {
    qrCodeDialog.hide();
    toast.info("Estamos verificando a conexão...");
    await syncInstanceWithEvolution();
  };

  // Handler botão "Gerar novo QRCode"
  const handleRegenerate = async () => {
    if (!instanceName) {
      toast.error("Instância desconhecida.");
      return;
    }
    try {
      setIsCreating(true);
      const result = await createWhatsAppInstance(instanceName);
      if (result.success && result.qrCode) {
        qrCodeDialog.show(result.qrCode);
        toast.success("Novo QR code gerado!");
      } else {
        toast.error(result.error || "Falha ao renovar QR code.");
      }
    } catch (error) {
      toast.error("Erro ao renovar QR code.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handler botão "Cancelar"
  const handleCancel = async () => {
    qrCodeDialog.hide();
    setInstanceName(null);
    setInstanceId(null);
    // Remove a instância do banco se criada!
    if (instanceId) {
      try {
        await supabase.from('whatsapp_numbers').delete().eq('id', instanceId);
        toast("Instância cancelada.");
      } catch {
        toast("Erro ao remover instância.");
      }
    }
    await syncInstanceWithEvolution();
  };

  return (
    <>
      <Card className="overflow-hidden glass-card border-0 flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
        <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
          <div className="mb-2">
            <MessageSquare className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="font-medium">Adicionar número</h3>
          {!isSuperAdmin && !isNewUser ? (
            <p className="text-sm text-muted-foreground">
              Disponível apenas em planos superiores. Atualize seu plano.
            </p>
          ) : isNewUser ? (
            <p className="text-sm text-muted-foreground">
              Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Como SuperAdmin, adicione quantos números quiser.
            </p>
          )}
          <Button
            variant="whatsapp"
            size="sm"
            className="mt-2"
            disabled={(!isSuperAdmin && !isNewUser) || isCreating}
            onClick={handleAddWhatsApp}
          >
            {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
          </Button>
        </CardContent>
      </Card>

      {/* Card/modal para QR code com ações e visual aprimorado */}
      {qrCodeDialog.isOpen && qrCodeDialog.qrCodeUrl && (
        <QrCodeActionCard
          qrCodeUrl={qrCodeDialog.qrCodeUrl}
          isLoading={isCreating}
          onScanned={handleScanned}
          onRegenerate={handleRegenerate}
          // Passa o instanceName criado para o Card, para possibilitar o delete correto
          onCancel={handleCancel}
          instanceName={instanceName}
        />
      )}
    </>
  );
};

export default PlaceholderInstanceCard;
