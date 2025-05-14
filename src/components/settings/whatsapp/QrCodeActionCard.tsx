
import { Button } from "@/components/ui/button";

interface QrCodeActionCardProps {
  qrCodeUrl: string;
  isLoading?: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}

const QrCodeActionCard = ({
  qrCodeUrl,
  isLoading = false,
  onScanned,
  onRegenerate,
  onCancel,
}: QrCodeActionCardProps) => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-white dark:bg-zinc-900 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-xs mx-auto">
      <img
        src={qrCodeUrl}
        alt="QR Code para conexão do WhatsApp"
        className="w-48 h-48 object-contain rounded-lg border"
      />
      <p className="text-xs text-muted-foreground text-center">
        Escaneie este QR code no WhatsApp. O código expira em poucos minutos.<br />
        Use seu celular: <span className="font-medium">Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho</span>
      </p>
      <div className="flex gap-2 w-full">
        <Button variant="default" size="sm" className="flex-1" onClick={onScanned} disabled={isLoading}>
          Já escaneei
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onRegenerate} disabled={isLoading}>
          Gerar novo QRCode
        </Button>
        <Button variant="destructive" size="sm" className="flex-1" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default QrCodeActionCard;
