
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Phone } from "lucide-react";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface InstanceCardHeaderProps {
  instance: WhatsAppInstance;
  isInstanceConnected: boolean;
  isLoading: boolean;
  onRefreshStatus?: () => Promise<void>;
}

export const InstanceCardHeader = ({
  instance,
  isInstanceConnected,
  isLoading,
  onRefreshStatus
}: InstanceCardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div>
        <h4 className="font-medium">WhatsApp</h4>
        <p className="text-sm text-muted-foreground">Instance: {instance.instanceName}</p>
        {isInstanceConnected && instance.phoneNumber && (
          <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
            <Phone className="w-3 h-3" />
            <p className="text-xs font-medium">{instance.phoneNumber}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={isInstanceConnected ? 
          "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
          "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
          {isInstanceConnected ? "Connected" : "Disconnected"}
        </Badge>
        
        {onRefreshStatus && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onRefreshStatus}
            disabled={isLoading}
          >
            <RefreshCcw 
              className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} 
            />
          </Button>
        )}
      </div>
    </div>
  );
};
