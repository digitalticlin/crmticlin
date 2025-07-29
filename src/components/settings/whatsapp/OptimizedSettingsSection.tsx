
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Settings, Zap, Shield } from "lucide-react";
import { CreateInstanceButton } from "@/modules/whatsapp/instanceCreation/components/CreateInstanceButton";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";
import { useWhatsAppSettingsLogic } from "@/hooks/whatsapp/useWhatsAppSettingsLogic";

export const OptimizedSettingsSection = () => {
  const { instances, isLoading } = useWhatsAppSettingsLogic();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações do WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie suas instâncias do WhatsApp Web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Instâncias Conectadas</h3>
                <p className="text-sm text-muted-foreground">
                  {instances.length} instância(s) configurada(s)
                </p>
              </div>
              <CreateInstanceButton />
            </div>

            {instances.length > 0 && (
              <div className="space-y-2">
                {instances.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{instance.instance_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {instance.connection_status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <QRCodeModal />
    </div>
  );
};
