
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface InstanceHeaderProps {
  instance: WhatsAppInstance;
}

const InstanceHeader = ({ instance }: InstanceHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div>
        <h4 className="font-medium">WhatsApp</h4>
        <p className="text-sm text-muted-foreground">Instance: {instance.instanceName}</p>
        {instance.connected && instance.phoneNumber && (
          <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
            <Phone className="w-3 h-3" />
            <p className="text-xs font-medium">{instance.phoneNumber}</p>
          </div>
        )}
      </div>
      <Badge variant="outline" className={instance.connected ? 
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
        "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
        {instance.connected ? "Connected" : "Disconnected"}
      </Badge>
    </div>
  );
};

export default InstanceHeader;
