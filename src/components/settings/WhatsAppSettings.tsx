import { useState, useEffect, useRef } from "react";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";
import { useWhatsAppFetcher } from "@/hooks/whatsapp/useWhatsAppFetcher";
import FloatingAddWhatsAppButton from "./whatsapp/FloatingAddWhatsAppButton";
import { usePlaceholderLogic } from "./whatsapp/PlaceholderLogicHooks";
import PlaceholderQrModal from "./whatsapp/PlaceholderQrModal";
import WaitingForConnectionCard from "./whatsapp/WaitingForConnectionCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CHECK_INTERVAL = 15000; // Check status every 15 seconds

const WhatsAppSettings = () => {
  // State to store current user's email
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const userDataLoadedRef = useRef(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Load current user data
  useEffect(() => {
    if (userDataLoadedRef.current) return;
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        if (user) {
          setUserEmail(user.email || "");
          userDataLoadedRef.current = true;

          // Check if user is a SuperAdmin
          const { data: superAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
          if (!superAdminError) {
            setIsSuperAdmin(superAdmin || false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  // Só inicializar o hook quando o email do usuário estiver disponível
  const {
    instances,
    isLoading: instanceLoading,
    lastError,
    connectInstance,
    deleteInstance,
    refreshQrCode,
    checkInstanceStatus,
    addConnectingInstance,
    showQrCode,
    setShowQrCode,
  } = useWhatsAppInstances(userEmail);

  // Add the connection synchronizer
  const { syncAllInstances } = useConnectionSynchronizer();

  // Obter fetchUserInstances, garantindo refresh correto das instâncias de usuário
  const { fetchUserInstances } = useWhatsAppFetcher();

  // Atualiza as instâncias do usuário (em vez de instâncias da empresa)
  const refreshUserInstances = () => {
    if (userEmail) {
      fetchUserInstances(userEmail);
    }
  };

  // Handle showing QR code by updating state
  const handleShowQrCode = (instanceId: string) => {
    setShowQrCode(instanceId);
  };

  // Modified to handle the Promise<string> return properly
  const handleConnectInstance = async (instanceId: string) => {
    try {
      await connectInstance(instanceId);
      addConnectingInstance(instanceId);
    } catch (error) {
      console.error("Error in handleConnectInstance:", error);
    }
  };

  // Handle explicit status check request from component
  const handleStatusCheck = (instanceId: string) => {
    addConnectingInstance(instanceId);
  };

  useEffect(() => {
    if (instances.length > 0) {
      const instancesForSync = instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      syncAllInstances(instancesForSync).then((results) => {
        console.log("Initial status sync completed:", results);
      });
    }
  }, [instances, syncAllInstances]);

  // Atualiza status de todas as instâncias do usuário (empresa atual)
  const handleSyncAllForCompany = async () => {
    if (!instances.length) {
      toast.error("Nenhuma instância WhatsApp encontrada para atualizar.");
      return;
    }
    try {
      setIsSyncingAll(true);
      const instancesForSync = instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName
      }));
      await syncAllInstances(instancesForSync);
      toast.success("Status do WhatsApp da empresa sincronizado!");
      // Opcional: forçar atualização visual
      refreshUserInstances();
    } catch (e) {
      toast.error(
        "Falha ao sincronizar status das instâncias da empresa."
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  // --- Lógica para adicionar WhatsApp, fora da grid, aproveitando usePlaceholderLogic ---
  const placeholderLogic = usePlaceholderLogic({ userEmail, isSuperAdmin });

  // Render waiting card se existe
  const showWaitingCard = placeholderLogic.waitingForOpen && placeholderLogic.instanceName;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">WhatsApp Management</h3>
          {/* Botão de sincronizar status de toda a empresa (apenas Admin comum, não SuperAdmin global) */}
          {!isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAllForCompany}
              disabled={isSyncingAll}
              className="ml-2"
            >
              {isSyncingAll ? (
                <>
                  <Loader2 className="animate-spin mr-1 h-4 w-4" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Loader2 className="mr-1 h-4 w-4" />
                  Atualizar Status
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Connect and manage your WhatsApp instances
        </p>
      </div>

      <WhatsAppInfoAlert />

      {lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lastError}
          </AlertDescription>
        </Alert>
      )}

      {/* Botão flutuante "+" */}
      <FloatingAddWhatsAppButton
        onClick={placeholderLogic.handleAddWhatsApp}
        disabled={placeholderLogic.isCreating}
        isLoading={placeholderLogic.isCreating}
        isSuperAdmin={isSuperAdmin}
        isNewUser={placeholderLogic.isNewUser}
      />

      {/* Modal do QR Code e lógica de adicionar */}
      <PlaceholderQrModal
        isOpen={placeholderLogic.qrCodeDialog.isOpen}
        qrCodeUrl={placeholderLogic.qrCodeDialog.qrCodeUrl}
        isCreating={placeholderLogic.isCreating}
        onScanned={placeholderLogic.handleScanned}
        onRegenerate={placeholderLogic.handleRegenerate}
        onCancel={placeholderLogic.handleCancel}
        instanceName={placeholderLogic.instanceName}
        onRefreshInstances={refreshUserInstances}
      />

      {/* Card de "aguardando conexão" após scan QR */}
      {showWaitingCard && (
        <div className="max-w-[450px] mx-auto">
          <WaitingForConnectionCard
            instanceName={placeholderLogic.instanceName!}
            onDelete={placeholderLogic.handleDeleteWaiting}
          />
        </div>
      )}

      {/* Grid responsiva para os cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.filter(instance => !!instance.id && instance.id !== "1").map(instance =>
          <WhatsAppInstanceCard
            key={instance.id}
            instance={instance}
            isLoading={instanceLoading[instance.id] || false}
            showQrCode={showQrCode === instance.id}
            onConnect={handleConnectInstance}
            onDelete={deleteInstance}
            onRefreshQrCode={refreshQrCode}
            onStatusCheck={handleStatusCheck}
          />
        )}
      </div>
    </div>
  );
};

export default WhatsAppSettings;
