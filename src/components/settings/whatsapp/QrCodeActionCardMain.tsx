import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppSupportErrorModal } from "./WhatsAppSupportErrorModal";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { useQrConnectionCheck } from "./useQrConnectionCheck";

interface QrCodeActionCardProps {
  qrCodeUrl: string;
  isLoading?: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName?: string | null;
  onCloseWithRefresh?: () => void;
}

const QrCodeActionCardMain = ({
  qrCodeUrl,
  isLoading = false,
  onScanned,
  onCancel,
  instanceName,
}: QrCodeActionCardProps) => {
  // Estados locais
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportDetail, setSupportDetail] = useState<string | undefined>(undefined);
  const [qrUrl] = useState(qrCodeUrl);
  const [connectedCardVisible, setConnectedCardVisible] = useState(false);
  const [instanceInfo, setInstanceInfo] = useState<{ name: string; number?: string } | null>(null);

  // Para resgatar nome e número do QR, pode ser extendido se necessário
  useEffect(() => {
    setInstanceInfo({
      name: instanceName || "Instância WhatsApp",
      // O número pode ser buscado por props se necessário
    });
  }, [instanceName]);

  // Referência para acesso ao cleanup de polling/efeitos ao fechar modal
  const cleanupOnCloseRef = useRef<() => void>(() => {});

  // NOVO: Função para garantir cleanup SEMPRE ao fechar modal
  const handleCloseAll = () => {
    // Cancela polling e efeitos se ativo
    cleanup(); // Chama sempre o cleanup ao fechar/cancelar
    if (typeof onCancel === "function") onCancel();
  };

  const handleDeleteInstance = async () => {
    if (!instanceName) {
      handleCloseAll();
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://ticlin-evolution-api.eirfpl.easypanel.host/instance/delete/${encodeURIComponent(instanceName)}`,
        {
          method: "DELETE",
          headers: {
            "apikey": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
            "Content-Type": "application/json",
          },
        }
      );
      let json: any = null;
      try {
        json = await response.json();
      } catch {
        throw new Error("Resposta inesperada do servidor");
      }
      if (
        (typeof json.status === "string" && json.status.toLowerCase().includes("succes")) ||
        (json.status === 200 && json.error === false)
      ) {
        toast({
          title: "Instância cancelada com sucesso!",
          variant: "default",
        });
        handleCloseAll();
        return;
      }
      if (
        (json?.status === 404 || json?.status === "404") &&
        json?.response?.message &&
        Array.isArray(json.response.message) &&
        json.response.message.join(" ").toLowerCase().includes("instance does not exist")
      ) {
        handleCloseAll();
        return;
      }
      throw new Error(json?.response?.message?.join(" ") || json?.error || "Erro ao cancelar instância");
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar instância",
        description: error?.message || "",
        variant: "destructive",
      });
      handleCloseAll();
    } finally {
      setIsDeleting(false);
    }
  };

  // --- NOVO: Estado do hook isolado, sem pooling, dispara só 1 vez ---
  const [hasConnected, setHasConnected] = useState(false);
  const { isChecking, checkConnection, cleanup } = useQrConnectionCheck({
    instanceName,
    onConnected: () => {
      setHasConnected(true);
      setConnectedCardVisible(true);
      onScanned();
    },
    onClosed: () => {},
    onNotExist: (msg) => {
      setSupportDetail(msg);
      setShowSupportModal(true);
    },
  });

  // Limpa polling/checks ao fechar modal (componentWillUnmount E ao chamar handleCloseAll)
  useEffect(() => {
    cleanupOnCloseRef.current = cleanup;
    return () => cleanup();
  }, [cleanup]);

  // Se o usuário fechar modal manualmente (botão cancelar/deletar): garantir cleanup
  // Já está coberto por handleCloseAll!

  // --- Renderização: QR até conectar, depois card de conectado ---
  if (hasConnected && connectedCardVisible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
        <Card className="w-full max-w-md glass-morphism p-8 rounded-2xl shadow-2xl border-none transition-all">
          <CardHeader className="flex flex-col items-center text-center pb-2 border-none bg-transparent">
            <CardTitle className="text-lg font-semibold mb-0 text-gradient">
              Dispositivo conectado!
            </CardTitle>
            <CardDescription className="mt-2 mb-0 text-xs text-muted-foreground max-w-xs">
              Seu WhatsApp foi conectado com sucesso.<br />
              Agora você pode usá-lo normalmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2 px-0 pb-2 pt-1">
            <div className="rounded-xl border-2 border-green-400 bg-white py-3 px-6 mb-2 w-full flex flex-col items-center">
              <span className="font-semibold text-green-800">
                {instanceInfo?.name}
              </span>
              {instanceInfo?.number && (
                <span className="text-xs text-muted-foreground">{instanceInfo.number}</span>
              )}
            </div>
            <div className="text-xs text-green-600 text-center pb-1 pt-1">
              Status: <strong>Conectado</strong>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-0 px-0 border-none bg-transparent">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDeleteInstance}
              disabled={isDeleting}
            >
              {isDeleting ? <span className="animate-spin"><X className="w-4 h-4 mr-1" /></span> : <X className="w-4 h-4 mr-1" />}
              {isDeleting ? "Removendo..." : "Remover"}
            </Button>
          </CardFooter>
        </Card>
        {/* SUPORTE: Modal para instance not exist */}
        <WhatsAppSupportErrorModal
          open={showSupportModal}
          errorDetail={supportDetail}
          onClose={() => {
            setShowSupportModal(false);
            console.log('[QrCodeActionCardMain] Suporte: modal fechado');
          }}
        />
        <style>{`
          .glass-morphism {
            background: rgba(255,255,255,0.17);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(13px);
            -webkit-backdrop-filter: blur(13px);
            border-radius: 24px;
            border: 1px solid rgba(255,255,255, 0.18);
            transition: all 0.2s;
          }
          .text-gradient {
            background: linear-gradient(90deg, #19ffe5 8%, #a685ff 44%, #7e30e1 86%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
          }
        `}
        </style>
      </div>
    );
  }

  // --- Renderiza QR Code e botão "Já conectei" ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <Card className="w-full max-w-lg glass-morphism p-8 rounded-2xl shadow-2xl border-none transition-all">
        <CardHeader className="flex flex-col items-center text-center pb-2 border-none bg-transparent">
          <CardTitle className="text-lg font-semibold mb-0 text-gradient">
            Escaneie para conectar seu WhatsApp
          </CardTitle>
          <CardDescription className="mt-2 mb-0 text-xs text-muted-foreground max-w-xs">
            Use a câmera do celular para acessar:<br />
            <span className="font-medium">Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-0 pb-2 pt-1">
          <QrCodeDisplay qrUrl={qrUrl} />
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center pb-2">
            O QR code expira em poucos minutos.<br /> Gere novamente se necessário.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0 px-0 border-none bg-transparent">
          <div className="flex flex-col sm:flex-row gap-2 w-full px-0 justify-between items-stretch">
            <Button
              variant="default"
              size="sm"
              className="flex-1 min-w-0"
              onClick={() => {
                checkConnection();
              }}
              disabled={isLoading || isDeleting || isChecking}
            >
              <Check className="w-4 h-4 mr-1" />
              {isChecking ? "Verificando..." : "Já conectei"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleCloseAll}
              disabled={isLoading || isDeleting || isChecking}
            >
              {isDeleting ? <span className="animate-spin"><X className="w-4 h-4 mr-1" /></span> : <X className="w-4 h-4 mr-1" />}
              {isDeleting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
          {/* Spinner explícito durante verificação manual */}
          {isChecking && (
            <div className="flex flex-col items-center justify-center gap-2 py-2 animate-fade-in">
              <span className="text-sm text-muted-foreground">Verificando conexão...</span>
            </div>
          )}
        </CardFooter>
      </Card>
      {/* SUPORTE: Modal para instance not exist */}
      <WhatsAppSupportErrorModal
        open={showSupportModal}
        errorDetail={supportDetail}
        onClose={() => {
          setShowSupportModal(false);
          console.log('[QrCodeActionCardMain] Suporte: modal fechado');
        }}
      />
      <style>{`
        .glass-morphism {
          background: rgba(255,255,255,0.17);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(13px);
          -webkit-backdrop-filter: blur(13px);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255, 0.18);
          transition: all 0.2s;
        }
        .text-gradient {
          background: linear-gradient(90deg, #19ffe5 8%, #a685ff 44%, #7e30e1 86%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
      `}
      </style>
    </div>
  );
};

export default QrCodeActionCardMain;
