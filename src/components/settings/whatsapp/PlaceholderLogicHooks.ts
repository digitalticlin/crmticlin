
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createWhatsAppInstance } from "@/services/whatsapp/instanceCreationService";
import { supabase } from "@/integrations/supabase/client";
import { useQrCodeDialogState } from "@/hooks/whatsapp/useQrCodeDialogState";
import { useEvolutionInstanceStatus } from "@/hooks/whatsapp/useEvolutionInstanceStatus";
import { useWhatsAppInstanceActions, useWhatsAppInstanceState } from "@/hooks/whatsapp/whatsappInstanceStore";
import { useEvolutionOpenStatus } from "@/hooks/whatsapp/useEvolutionOpenStatus";
import { useUniqueWhatsAppInstanceName } from "@/hooks/whatsapp/useUniqueWhatsAppInstanceName";

export function usePlaceholderLogic({ userEmail, isSuperAdmin = false }) {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [waitingForOpen, setWaitingForOpen] = useState(false);
  const qrCodeDialog = useQrCodeDialogState();
  const { checkIfOpen } = useEvolutionOpenStatus();
  const { getNextAvailableInstanceName } = useUniqueWhatsAppInstanceName();

  useEffect(() => {
    if (userEmail) {
      const extractedUsername = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, "");
      setUsername(extractedUsername);
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
        } catch {}
      };
      checkIfNewUser();
    }
  }, [userEmail]);

  // Lógica para criar WhatsApp
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

      // Buscar o próximo nome incremental disponível usando utilitário já existente.
      const nextAvailableName = await getNextAvailableInstanceName(username);

      // Usar sempre o nome incremental disponível na criação (conforme solicitado)
      const result = await createWhatsAppInstance(nextAvailableName);

      if (!result.success) {
        if (
          result.error &&
          (result.error.toLowerCase().includes("already in use") ||
            (result.triedNames && result.triedNames.length > 0))
        ) {
          toast.error(
            `Os nomes tentados já estavam em uso: ${result.triedNames?.join(", ")}. Por favor, tente novamente em instantes ou altere seu nome!`
          );
        } else {
          toast.error(result.error || "Erro ao criar a instância.");
        }
        setIsCreating(false);
        return;
      }
      qrCodeDialog.show(result.qrCode!);
      setInstanceName(result.instanceName || null);
      setInstanceId(result.instanceId || null);
      toast.success("Solicitação de conexão enviada!");
      setWaitingForOpen(false);
    } catch (error: any) {
      toast.error("Falha ao criar a instância do WhatsApp");
    } finally {
      setIsCreating(false);
    }
  };

  const { fetchStatus } = useEvolutionInstanceStatus();
  const { instances, setInstances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);

  const syncInstanceWithEvolution = async () => {
    if (!instanceName || isSyncingStatus) return;
    setIsSyncingStatus(true);
    try {
      const statusData = await fetchStatus(instanceName);
      const idx = instances.findIndex(i => i.instanceName === instanceName);
      if (idx !== -1) {
        const updated = [...instances];
        updated[idx] = {
          ...updated[idx],
          connected: (statusData?.state === "connected")
        };
        setInstances(updated);
      } else {
        setInstances([
          ...instances,
          {
            id: instanceId || "1",
            instanceName: instanceName,
            connected: (statusData?.state === "connected"),
          }
        ]);
      }
    } catch (error) {} finally {
      setIsSyncingStatus(false);
    }
  };

  const handleScanned = useCallback(async () => {
    qrCodeDialog.hide();
    toast.info("Estamos verificando a conexão...");
    if (instanceName) {
      try {
        const result = await checkIfOpen(instanceName);
        if (result.isOpen) {
          setWaitingForOpen(true);
          const idx = instances.findIndex(i => i.instanceName === instanceName);
          if (idx !== -1) {
            const updated = [...instances];
            updated[idx] = {
              ...updated[idx],
              connected: false
            };
            setInstances(updated);
          } else {
            setInstances([
              ...instances.filter(i => i.instanceName !== instanceName),
              {
                id: instanceId || "1",
                instanceName: instanceName,
                connected: false
              }
            ]);
          }
        } else {
          setWaitingForOpen(false);
          await syncInstanceWithEvolution();
        }
      } catch (e) {
        setWaitingForOpen(false);
        await syncInstanceWithEvolution();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName, checkIfOpen, instances, setInstances, instanceId]);

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

  const handleCancel = async () => {
    qrCodeDialog.hide();
    setInstanceName(null);
    setInstanceId(null);
    setWaitingForOpen(false);
    if (instanceId) {
      try {
        await supabase.from('whatsapp_instances').delete().eq('id', instanceId);
        toast("Instância cancelada.");
      } catch {
        toast("Erro ao remover instância.");
      }
    }
    await syncInstanceWithEvolution();
  };

  const handleDeleteWaiting = async () => {
    setInstanceName(null);
    setInstanceId(null);
    setWaitingForOpen(false);
    if (instanceId) {
      try {
        await supabase.from('whatsapp_instances').delete().eq('id', instanceId);
        toast("Instância cancelada.");
      } catch {
        toast("Erro ao remover instância.");
      }
    }
  };

  return {
    username,
    isNewUser,
    isCreating,
    instanceName,
    instanceId,
    waitingForOpen,
    qrCodeDialog,
    handleAddWhatsApp,
    handleScanned,
    handleRegenerate,
    handleCancel,
    handleDeleteWaiting,
    isSuperAdmin
  };
}
