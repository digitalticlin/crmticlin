import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { X, RefreshCcw, Check, CircleCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QrCodeActionCardProps {
  qrCodeUrl: string;
  isLoading?: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName?: string | null; // Para API Evolution
}

const QrCodeActionCard = ({
  qrCodeUrl,
  isLoading = false,
  onScanned,
  onRegenerate,
  onCancel,
  instanceName,
}: QrCodeActionCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qrUrl, setQrUrl] = useState(qrCodeUrl);

  // Handler para cancelar e deletar a instância na Evolution API
  const handleDeleteInstance = async () => {
    if (!instanceName) {
      onCancel();
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`https://ticlin-evolution-api.eirfpl.easypanel.host/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "API-KEY": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
        },
      });
      if (!response.ok) throw new Error("Não foi possível remover a instância Evolution");
      toast({
        title: "Instância cancelada com sucesso!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar instância",
        description: error?.message || "",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onCancel();
    }
  };

  // Handler para "Já conectei": checa status, se "open", fecha card
  const handleCheckConnected = async () => {
    if (!instanceName) return;
    setIsChecking(true);
    try {
      const res = await fetch(`https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/${instanceName}`, {
        headers: {
          "Content-Type": "application/json",
          "API-KEY": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
        },
      });
      const json = await res.json();
      if (json?.state === "open") {
        toast({
          title: "Instância conectada!",
          description: "Seu WhatsApp foi conectado com sucesso.",
        });
        onScanned();
      } else {
        toast({
          title: "Ainda não conectado!",
          description: "Por favor, conclua a conexão no celular ou aguarde.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao verificar status",
        description: error?.message || "",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Handler para "Gerar novo QRCode"
  const handleRegenerateQr = async () => {
    if (!instanceName) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connect/${instanceName}`, {
        headers: {
          "Content-Type": "application/json",
          "API-KEY": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
        },
      });
      const json = await res.json();
      if (json?.qrcode?.base64) {
        setQrUrl(json.qrcode.base64);
        toast({
          title: "QR Code atualizado",
        });
      } else {
        throw new Error("QR Code não recebido");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar novo QRCode",
        description: error?.message || "",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <Card className="w-full max-w-md glass-morphism p-6 rounded-2xl shadow-2xl border-none transition-all">
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
          <div className="flex justify-center items-center bg-white/15 dark:bg-zinc-700 rounded-lg p-2 mb-4 w-52 h-52 shadow-xl border border-white/20 backdrop-blur-md transition-all">
            <img
              src={qrUrl}
              alt="QR Code para conexão do WhatsApp"
              className="w-48 h-48 object-contain rounded-md border shadow-lg"
              draggable={false}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center pb-2">
            O QR code expira em poucos minutos.<br /> Gere novamente se necessário.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-0 px-0 border-none bg-transparent">
          <div className="flex gap-2 w-full px-0">
            <Button
              variant="default"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleCheckConnected}
              disabled={isLoading || isDeleting || isChecking || isRefreshing}
            >
              {isChecking ? <span className="animate-spin"><Check className="w-4 h-4 mr-1" /></span> : <Check className="w-4 h-4 mr-1" />}
              Já conectei
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleRegenerateQr}
              disabled={isLoading || isDeleting || isChecking || isRefreshing}
            >
              {isRefreshing ? <span className="animate-spin"><RefreshCcw className="w-4 h-4 mr-1" /></span> : <RefreshCcw className="w-4 h-4 mr-1" />}
              Gerar novo QRCode
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 min-w-0"
              onClick={handleDeleteInstance}
              disabled={isLoading || isDeleting || isChecking || isRefreshing}
            >
              {isDeleting ? <span className="animate-spin"><X className="w-4 h-4 mr-1" /></span> : <X className="w-4 h-4 mr-1" />}
              {isDeleting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
        </CardFooter>
      </Card>
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

export default QrCodeActionCard;
