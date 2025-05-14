
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { X, RefreshCcw, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QrCodeActionCardProps {
  qrCodeUrl: string;
  isLoading?: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName?: string | null; // For delete API
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

  // Botão CANCELAR faz requisição à Evolution API para deletar a instância e fecha o modal
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
      if (!response.ok) {
        throw new Error("Não foi possível remover a instância Evolution");
      }
      onCancel();
      // Toast de sucesso
      toast.success("Instância cancelada com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao cancelar instância");
      onCancel();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border-0">
        <CardHeader className="flex flex-col items-center text-center pb-2">
          <CardTitle className="text-lg font-semibold mb-0">Escaneie para conectar seu WhatsApp</CardTitle>
          <CardDescription className="mt-2 mb-0 text-xs text-muted-foreground">
            Use a câmera do celular e acesse: <br />
            <span className="font-medium">Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-6 pb-2 pt-1">
          <div className="flex justify-center items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-2 mb-4 w-52 h-52">
            <img
              src={qrCodeUrl}
              alt="QR Code para conexão do WhatsApp"
              className="w-48 h-48 object-contain rounded-md border shadow-lg"
            />
          </div>
          <div className="text-xs text-gray-500 text-center pb-2">
            O QR code expira em poucos minutos. Gere novamente se necessário.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={onScanned}
              disabled={isLoading || isDeleting}
            >
              <Check className="w-4 h-4 mr-1" /> Já escaneei
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onRegenerate}
              disabled={isLoading || isDeleting}
            >
              <RefreshCcw className="w-4 h-4 mr-1" /> Gerar novo QRCode
            </Button>
            <Button 
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleDeleteInstance}
              disabled={isLoading || isDeleting}
            >
              <X className="w-4 h-4 mr-1" />
              {isDeleting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QrCodeActionCard;
