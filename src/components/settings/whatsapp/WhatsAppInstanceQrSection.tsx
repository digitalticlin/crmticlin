
import QrCodeSection from "./QrCodeSection";
import { Button } from "@/components/ui/button";

interface WhatsAppInstanceQrSectionProps {
  showQr: boolean;
  onlyDeleteMode: boolean;
  instance: any;
  statusConnected: boolean;
  handleConnect: () => Promise<void>;
}

export default function WhatsAppInstanceQrSection({
  showQr,
  onlyDeleteMode,
  instance,
  statusConnected,
  handleConnect
}: WhatsAppInstanceQrSectionProps) {
  if (!showQr || onlyDeleteMode || !instance.qrCodeUrl || statusConnected) {
    return null;
  }
  return (
    <>
      <QrCodeSection qrCodeUrl={instance.qrCodeUrl} />
      <Button variant="outline" className="w-full mt-2" onClick={handleConnect}>
        Já conectei
      </Button>
    </>
  );
}
