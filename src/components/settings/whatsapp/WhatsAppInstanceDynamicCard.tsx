
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  instance: {
    id: string;
    instanceName: string;
    phoneNumber?: string;
    state: "connecting" | "open" | "close";
    qrCodeUrl?: string;
  };
  onDeleteSuccess: (id: string) => void;
  onRefreshInstances?: () => void;
}

const EVOLUTION_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

export default function WhatsAppInstanceDynamicCard({ instance, onDeleteSuccess, onRefreshInstances }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(instance.qrCodeUrl || null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Gera/Regera QRCode usando a API /instance/connect/{instanceName}
  const handleGenerateQr = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/connect/${encodeURIComponent(instance.instanceName)}`, {
        method: "GET",
        headers: {
          "apikey": API_KEY
        }
      });
      if (!res.ok) throw new Error("Erro ao gerar novo QRCode");
      const data = await res.json();
      if (data?.base64) {
        setQrCode(data.base64);
        toast.success("QR Code gerado com sucesso!");
      } else {
        throw new Error("Resposta inválida ao gerar QRCode");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar QRCode");
    } finally {
      setLoading(false);
    }
  };

  // Desconecta e remove instância
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/delete/${encodeURIComponent(instance.instanceName)}`, {
        method: "DELETE",
        headers: {
          "API-KEY": API_KEY
        }
      });
      const data = await res.json();
      if (data?.status === "SUCCESS") {
        toast.success("Instância removida com sucesso!");
        onDeleteSuccess(instance.id);
        if (onRefreshInstances) onRefreshInstances();
        return;
      }
      throw new Error("API não confirmou remoção");
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover instância");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden mb-4">
      <CardContent>
        <div className="flex flex-col gap-2">
          <strong className="text-lg">{instance.instanceName}</strong>
          <span className="text-sm text-muted-foreground">{instance.phoneNumber || "Número não informado"}</span>
          <div>
            {/* Lógica conforme state */}
            {(instance.state === "connecting" || instance.state === "close") && (
              <>
                <div className="mb-2">
                  <span className="text-yellow-600 font-medium block mb-1">
                    {instance.state === "connecting" ? "Aguardando conexão via QR Code" : "WhatsApp desconectado"}
                  </span>
                  {qrCode && (
                    <img src={qrCode} alt="QRCode" className="w-48 h-48 border mx-auto mb-2" />
                  )}
                  <Button 
                    onClick={handleGenerateQr}
                    disabled={loading}
                    className="w-full"
                    variant="whatsapp"
                  >
                    <QrCode className="mr-1" /> {loading ? "Gerando QR Code..." : "Gerar QR Code"}
                  </Button>
                </div>
              </>
            )}

            {instance.state === "open" && (
              <>
                <span className="text-green-600 font-medium mb-1 block">
                  Instância conectada!
                </span>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full"
                  variant="destructive"
                >
                  <Trash2 className="mr-1" />
                  {deleting ? "Desconectando..." : "Desconectar"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <span className="text-xs text-muted-foreground ml-1">
          Status: <strong>{instance.state.toUpperCase()}</strong>
        </span>
      </CardFooter>
    </Card>
  );
}
