
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

// Função utilitária local para a exclusão via Evolution API (garante total isolamento)
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
  // onRegenerate, // Removida do props dos botões
  onCancel,
  instanceName,
  onRefreshInstances
}: PlaceholderQrModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleScanClick = async () => {
    onScanned?.();
    // Atualiza página imediatamente após fechamento do modal
    if (onRefreshInstances) {
      setTimeout(() => onRefreshInstances(), 350); // ligeiro delay para evitar race com o fechamento
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
      // Sucesso: fecha o modal e aciona evento parent (remover da lista, etc)
      if (onRefreshInstances) {
        setTimeout(() => onRefreshInstances(), 350);
      }
      onCancel();
      // Feedback visual pode ser adicionado se necessário
    } catch (error: any) {
      // Exibe erro, mas garante que o loading some e o modal fecha
      alert(error.message || "Falha ao remover instância.");
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conecte seu WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o código QR abaixo para conectar sua conta do WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64"
            />
          ) : (
            <div className="flex items-center justify-center">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando código QR...
                </>
              ) : (
                "Nenhum código QR disponível."
              )}
            </div>
          )}
          <div className="flex w-full justify-center space-x-2">
            {/* Removido o botão de regenerar */}
            <Button
              onClick={handleScanClick}
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" /> Já conectei
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelWithDelete}
              disabled={isLoading}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
