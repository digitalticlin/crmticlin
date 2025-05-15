
import { useState } from "react";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportDetail, setSupportDetail] = useState<string | undefined>(undefined);
  const [qrUrl] = useState(qrCodeUrl);

  // Novo: garante que handleCloseAll só fecha modal, nada de polling!
  const handleCloseAll = () => {
    console.log('[QrCodeActionCardMain] handleCloseAll chamado - só UI, sem polling/refresh de status!');
    if (typeof onCancel === "function") onCancel();
    // Não chama onCloseWithRefresh!
  };

  // Handler para deletar instância Evolution API (permanece igual)
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

  // Usando hook isolado para checagem (apenas no botão)
  const { isChecking, checkConnection } = useQrConnectionCheck({
    instanceName,
    onConnected: onScanned,
    onClosed: () => {},
    onNotExist: (msg) => {
      setSupportDetail(msg);
      setShowSupportModal(true);
    },
  });

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
              onClick={checkConnection}
              disabled={isLoading || isDeleting || isChecking}
            >
              {isChecking ? <span className="animate-spin"><Check className="w-4 h-4 mr-1" /></span> : <Check className="w-4 h-4 mr-1" />}
              Já conectei
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleDeleteInstance}
              disabled={isLoading || isDeleting || isChecking}
            >
              {isDeleting ? <span className="animate-spin"><X className="w-4 h-4 mr-1" /></span> : <X className="w-4 h-4 mr-1" />}
              {isDeleting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
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
      {/* Glassmorphism utility */}
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
