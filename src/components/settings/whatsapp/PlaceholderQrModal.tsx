
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

// Função utilitária local para a exclusão via Evolution API
async function deleteEvolutionInstance(instanceName: string) {
  const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/delete/" + encodeURIComponent(instanceName);
  const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";
  const resp = await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "apikey": API_KEY,
    },
  });
  const data = await resp.json();
  if (!resp.ok || data.status !== "SUCCESS") {
    throw new Error(data?.response?.message || "Erro ao deletar instância na Evolution API");
  }
  return data;
}

interface PlaceholderQrModalProps {
  isOpen: boolean;
  qrCodeUrl: string | null;
  isCreating: boolean;
  onScanned: () => void;
  onRegenerate: () => void; // NÃO MAIS USADO, será removido do botão
  onCancel: () => void;
  instanceName: string | null;
  onRefreshInstances?: () => void;
}

export default function PlaceholderQrModal({
  isOpen,
  qrCodeUrl,
  isCreating,
  onScanned,
  // onRegenerate, // Removido do uso
  onCancel,
  instanceName,
  onRefreshInstances
}: PlaceholderQrModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleScanClick = async () => {
    onScanned?.();
    if (onRefreshInstances) {
      setTimeout(() => onRefreshInstances(), 350);
    }
  };

  const handleCancelWithDelete = async () => {
    if (!instanceName) {
      onCancel();
      return;
    }
    setIsLoading(true);
    try {
      await deleteEvolutionInstance(instanceName);
      if (onRefreshInstances) {
        setTimeout(() => onRefreshInstances(), 350);
      }
      onCancel();
    } catch (error: any) {
      alert(error.message || "Falha ao remover instância.");
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[380px] 
        bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-glass
        flex flex-col items-center px-6 py-8 space-y-5
        "
        style={{
          boxShadow: "0 8px 40px 0 rgba(31,38,135,0.12)",
        }}
      >
        <DialogHeader className="w-full flex flex-col items-center pb-2">
          <DialogTitle
            className="text-xl font-bold text-center mb-1"
            style={{ color: "#d3d800" }}
          >
            Conecte seu WhatsApp
          </DialogTitle>
          <DialogDescription
            className="text-center text-white/90 mb-0"
            style={{ lineHeight: 1.35 }}
          >
            Escaneie o código QR abaixo para conectar sua conta do WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center w-full">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64 rounded-xl border-2 border-[#d3d800] bg-white"
              style={{
                boxShadow: "0 2px 25px 0 #e4e83033",
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[256px]">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#d3d800]" />
                  <span className="text-white">Gerando código QR...</span>
                </>
              ) : (
                <span className="text-muted-foreground">Nenhum código QR disponível.</span>
              )}
            </div>
          )}
          <span className="text-xs mt-2 text-center text-white/80 px-2">
            Abra o WhatsApp no seu celular,<br />vá em <span className="font-semibold text-[#d3d800]">Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho</span>.
          </span>
        </div>
        <div className="flex w-full justify-center gap-3 pt-4">
          <Button
            onClick={handleScanClick}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border border-slate-200 bg-white/80 hover:bg-white text-black data-[state=open]:bg-white/90 px-0 py-2 rounded-lg transition"
          >
            <Check className="mr-1 h-4 w-4" /> Já conectei
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelWithDelete}
            disabled={isLoading}
            className="flex-1 bg-red-700 hover:bg-red-800 text-white py-2 rounded-lg transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Cancelar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
