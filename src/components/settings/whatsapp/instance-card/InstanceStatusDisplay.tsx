
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import ConnectedBanner from "../ConnectedBanner";
import DeviceInfoSection from "../DeviceInfoSection";

interface InstanceStatusDisplayProps {
  instance: WhatsAppInstance;
  isInstanceConnected: boolean;
  isInstanceDisconnected: boolean;
  hasPhone: boolean;
}

export const InstanceStatusDisplay = ({
  instance,
  isInstanceConnected,
  isInstanceDisconnected,
  hasPhone
}: InstanceStatusDisplayProps) => {
  return (
    <>
      {isInstanceConnected && (
        <>
          <div className="mb-2 py-2 text-center">
            <span className="text-green-700 font-semibold">Conectado</span>
          </div>
          <div className="rounded-lg border bg-gray-50 dark:bg-gray-900/40 p-3 mb-2 text-center">
            <div>
              <span className="font-medium">Instância:</span> {instance.instanceName}
            </div>
            {hasPhone && (
              <div>
                <span className="font-medium">Telefone:</span> {instance.phoneNumber}
              </div>
            )}
          </div>
        </>
      )}
      
      {isInstanceDisconnected && (
        <div className="mb-2 py-2 text-center">
          <span className="text-red-700 font-semibold">Dispositivo desconectado</span>
        </div>
      )}
      
      <ConnectedBanner status={instance.connection_status} />
      
      {isInstanceConnected && <DeviceInfoSection deviceInfo={instance.deviceInfo} />}
    </>
  );
};
